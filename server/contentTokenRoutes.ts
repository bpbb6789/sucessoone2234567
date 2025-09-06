import { Express } from 'express';
import multer from 'multer';
import { bondingCurveService } from './bondingCurve';
import { PinataSDK } from 'pinata';

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for content tokenization
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg',
      'application/pdf', 'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

interface ContentTokenData {
  tokenAddress: string;
  name: string;
  symbol: string;
  description?: string;
  contentType: string;
  mediaCid: string;
  thumbnailCid?: string;
  creator: string;
  createdAt: string;
  currentPrice: string;
  marketCap: string;
  volume24h: string;
  holders: number;
  totalSupply: string;
  socialLinks?: {
    twitter?: string;
    website?: string;
    discord?: string;
  };
}

// In-memory storage for content tokens (replace with database later)
const contentTokens: Map<string, ContentTokenData> = new Map();

export function setupContentTokenRoutes(app: Express) {
  
  // Upload content to IPFS
  app.post('/api/upload-content', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { contentType, title, description } = req.body;
      
      console.log('Uploading content to IPFS:', {
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        contentType
      });

      // Upload to IPFS via Pinata
      const file = new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      });
      
      const uploadResult = await pinata.upload.public.file(file, {
        metadata: {
          name: req.file.originalname,
          keyvalues: {
            contentType: contentType,
            title: title || req.file.originalname,
            description: description || '',
            uploadedAt: new Date().toISOString()
          }
        }
      });

      console.log('IPFS upload result:', uploadResult);

      // For video/image content, we might want to generate a thumbnail
      let thumbnailCid = undefined;
      if (req.file.mimetype.startsWith('image/') && req.file.size < 10 * 1024 * 1024) {
        // For images under 10MB, use the same CID as thumbnail
        thumbnailCid = uploadResult.cid;
      }

      res.json({
        success: true,
        mediaCid: uploadResult.cid,
        thumbnailCid,
        contentType,
        fileSize: req.file.size,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Deploy content token with bonding curve
  app.post('/api/deploy-content-coin', async (req, res) => {
    try {
      const {
        creatorAddress,
        title,
        description,
        contentType,
        mediaCid,
        thumbnailCid,
        coinName,
        coinSymbol,
        totalSupply = '1000000',
        marketCapSetting = 'medium',
        socialLinks = {}
      } = req.body;

      if (!mediaCid || !coinName || !coinSymbol) {
        return res.status(400).json({ 
          error: 'Missing required fields: mediaCid, coinName, coinSymbol' 
        });
      }

      console.log('Deploying content token:', {
        coinName,
        coinSymbol,
        contentType,
        mediaCid,
        creator: creatorAddress
      });

      // Map market cap setting to K value for bonding curve
      const kValueMap = {
        'low': '1000000000000',    // 1e12
        'medium': '5000000000000', // 5e12  
        'high': '10000000000000'   // 10e12
      };
      const kValue = kValueMap[marketCapSetting as keyof typeof kValueMap] || kValueMap.medium;

      // Deploy real bonding curve contract
      if (!bondingCurveService.isConfigured()) {
        throw new Error('Bonding curve service not configured. Missing required environment variables.');
      }

      // First, we need a token address. In a real implementation, you would deploy an ERC20 token first
      // For now, we'll use a placeholder that would be replaced with actual token deployment
      const tempTokenAddress = `0x${Math.random().toString(16).substring(2).padStart(40, '0')}`;
      
      const deployResult = await bondingCurveService.deployBondingCurve(
        tempTokenAddress,
        creatorAddress || 'anonymous',
        `content-coin-${Date.now()}`
      );

      if (!deployResult.success) {
        throw new Error(deployResult.error || 'Failed to deploy bonding curve');
      }

      console.log('Bonding curve deployed:', deployResult);

      // Create content token entry
      const tokenData: ContentTokenData = {
        tokenAddress: deployResult.curveAddress!,
        name: coinName,
        symbol: coinSymbol,
        description,
        contentType,
        mediaCid,
        thumbnailCid,
        creator: creatorAddress || 'anonymous',
        createdAt: new Date().toISOString(),
        currentPrice: '0',
        marketCap: '0',
        volume24h: '0',
        holders: 0,
        totalSupply,
        socialLinks
      };

      // Store in memory (replace with database later)
      contentTokens.set(deployResult.curveAddress!, tokenData);

      res.json({
        success: true,
        tokenAddress: deployResult.curveAddress,
        transactionHash: deployResult.transactionHash,
        tokenData
      });

    } catch (error) {
      console.error('Deploy content coin error:', error);
      res.status(500).json({ 
        error: 'Deployment failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all content tokens
  app.get('/api/content-tokens', async (req, res) => {
    try {
      const { type, sort = 'newest', search, limit } = req.query;

      let tokens = Array.from(contentTokens.values());

      // Filter by content type
      if (type && type !== 'all') {
        tokens = tokens.filter(token => token.contentType === type);
      }

      // Search filter
      if (search) {
        const searchLower = (search as string).toLowerCase();
        tokens = tokens.filter(token => 
          token.name.toLowerCase().includes(searchLower) ||
          token.symbol.toLowerCase().includes(searchLower) ||
          token.description?.toLowerCase().includes(searchLower)
        );
      }

      // Sort tokens
      switch (sort) {
        case 'newest':
          tokens.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'oldest':
          tokens.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'price-high':
          tokens.sort((a, b) => parseFloat(b.currentPrice) - parseFloat(a.currentPrice));
          break;
        case 'price-low':
          tokens.sort((a, b) => parseFloat(a.currentPrice) - parseFloat(b.currentPrice));
          break;
        case 'market-cap':
          tokens.sort((a, b) => parseFloat(b.marketCap) - parseFloat(a.marketCap));
          break;
        case 'trending':
          tokens.sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h));
          break;
      }

      // Apply limit
      if (limit) {
        tokens = tokens.slice(0, parseInt(limit as string));
      }

      // Update prices for each token (async but don't await to keep response fast)
      tokens.forEach(async (token) => {
        try {
          // Mock price data for now
          token.currentPrice = (Math.random() * 0.001).toString();
          token.marketCap = (Math.random() * 10000).toString();
        } catch (error) {
          console.warn(`Failed to update price for ${token.symbol}:`, error);
        }
      });

      res.json(tokens);
    } catch (error) {
      console.error('Get content tokens error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch content tokens',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get individual content token details
  app.get('/api/content-tokens/:address', async (req, res) => {
    try {
      const { address } = req.params;
      const token = contentTokens.get(address.toLowerCase());

      if (!token) {
        return res.status(404).json({ error: 'Content token not found' });
      }

      // Update live price data (mock for now)
      try {
        token.currentPrice = (Math.random() * 0.001).toString();
        token.marketCap = (Math.random() * 10000).toString();
      } catch (error) {
        console.warn(`Failed to update price for ${token.symbol}:`, error);
      }

      res.json(token);
    } catch (error) {
      console.error('Get content token error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch content token',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Import content from URL
  app.post('/api/import-content-url', async (req, res) => {
    try {
      const { url, contentType } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      console.log('Importing content from URL:', url);

      // For now, return a placeholder response
      // In a real implementation, you would:
      // 1. Download the content from the URL
      // 2. Upload to IPFS
      // 3. Generate thumbnail if needed
      // 4. Return the IPFS CIDs

      res.json({
        success: true,
        mediaCid: 'placeholder-cid',
        thumbnailCid: 'placeholder-thumbnail-cid',
        contentType: contentType || 'image',
        message: 'URL import feature coming soon'
      });
    } catch (error) {
      console.error('Import URL error:', error);
      res.status(500).json({ 
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Trading endpoints
  app.post('/api/content-tokens/:address/buy', async (req, res) => {
    try {
      const { address } = req.params;
      const { amount, buyer } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      // Calculate tokens that would be received for the ETH amount
      const tokensReceived = await bondingCurveService.calculateBuyTokens(address, amount);
      
      if (!tokensReceived) {
        throw new Error('Failed to calculate buy amount - curve may not exist');
      }

      // In a real implementation, you would execute the actual buy transaction here
      // For now, return the calculation without executing the transaction
      res.json({
        success: true,
        tokensReceived: tokensReceived.toString(),
        transactionHash: 'Transaction execution not implemented yet',
        message: 'This is a calculation only - actual trading not yet implemented'
      });
    } catch (error) {
      console.error('Buy tokens error:', error);
      res.status(500).json({ 
        error: 'Buy failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/content-tokens/:address/sell', async (req, res) => {
    try {
      const { address } = req.params;
      const { amount, seller } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      // Calculate ETH that would be received for the token amount
      const ethReceived = await bondingCurveService.calculateSellTokens(address, amount);
      
      if (!ethReceived) {
        throw new Error('Failed to calculate sell amount - curve may not exist');
      }

      // In a real implementation, you would execute the actual sell transaction here
      // For now, return the calculation without executing the transaction
      res.json({
        success: true,
        ethReceived: ethReceived.toString(),
        transactionHash: 'Transaction execution not implemented yet',
        message: 'This is a calculation only - actual trading not yet implemented'
      });
    } catch (error) {
      console.error('Sell tokens error:', error);
      res.status(500).json({ 
        error: 'Sell failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('✅ Content token routes setup complete');
}