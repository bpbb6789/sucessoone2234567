
import { Router } from 'express';
import { db } from '../db';
import { creatorCoins } from '../../shared/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { zoraTradingService } from '../services/zoraTradingService';

const router = Router();

// Get creator coin by address/ID
router.get('/:addressOrId', async (req, res) => {
  try {
    const { addressOrId } = req.params;
    
    // Check if it's an address or ID
    const isAddress = addressOrId.startsWith('0x') && addressOrId.length === 42;
    
    const coin = await db
      .select()
      .from(creatorCoins)
      .where(isAddress ? eq(creatorCoins.coinAddress, addressOrId) : eq(creatorCoins.id, addressOrId))
      .limit(1);

    if (coin.length === 0) {
      return res.status(404).json({ error: 'Creator coin not found' });
    }

    res.json(coin[0]);
  } catch (error) {
    console.error('Error fetching creator coin:', error);
    res.status(500).json({ error: 'Failed to fetch creator coin' });
  }
});

// Get holders for a token
router.get('/:addressOrId/holders', async (req, res) => {
  try {
    const { addressOrId } = req.params;
    
    // Get the coin first
    const isAddress = addressOrId.startsWith('0x') && addressOrId.length === 42;
    const coin = await db
      .select()
      .from(creatorCoins)
      .where(isAddress ? eq(creatorCoins.coinAddress, addressOrId) : eq(creatorCoins.id, addressOrId))
      .limit(1);

    if (coin.length === 0) {
      return res.status(404).json({ error: 'Creator coin not found' });
    }

    // For now, return mock holders until we implement blockchain scanning
    const mockHolders = [
      {
        address: coin[0].creatorAddress,
        balance: '500000000.000000',
        percentage: 50.0
      },
      {
        address: '0x742d35Cc6637C0532e2Bb7553B24C1B5F4Dc0b1c',
        balance: '250000000.000000',
        percentage: 25.0
      },
      {
        address: '0x1234567890123456789012345678901234567890',
        balance: '100000000.000000',
        percentage: 10.0
      }
    ];

    res.json(mockHolders);
  } catch (error) {
    console.error('Error fetching holders:', error);
    res.status(500).json({ error: 'Failed to fetch holders' });
  }
});

// Get trade activity for a token
router.get('/:addressOrId/trades', async (req, res) => {
  try {
    const { addressOrId } = req.params;
    
    // Get the coin first
    const isAddress = addressOrId.startsWith('0x') && addressOrId.length === 42;
    const coin = await db
      .select()
      .from(creatorCoins)
      .where(isAddress ? eq(creatorCoins.coinAddress, addressOrId) : eq(creatorCoins.id, addressOrId))
      .limit(1);

    if (coin.length === 0) {
      return res.status(404).json({ error: 'Creator coin not found' });
    }

    // For now, return mock trades until we implement trade tracking
    const mockTrades = [
      {
        id: '1',
        userAddress: '0x742d35Cc6637C0532e2Bb7553B24C1B5F4Dc0b1c',
        ethAmount: '0.1',
        tokenAmount: '10000.0',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        type: 'buy',
        pricePerToken: '0.00001'
      },
      {
        id: '2',
        userAddress: '0x1234567890123456789012345678901234567890',
        ethAmount: '0.05',
        tokenAmount: '5000.0',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        type: 'buy',
        pricePerToken: '0.00001'
      }
    ];

    res.json(mockTrades);
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get comments for a token
router.get('/:addressOrId/comments', async (req, res) => {
  try {
    const { addressOrId } = req.params;
    
    // Get the coin first
    const isAddress = addressOrId.startsWith('0x') && addressOrId.length === 42;
    const coin = await db
      .select()
      .from(creatorCoins)
      .where(isAddress ? eq(creatorCoins.coinAddress, addressOrId) : eq(creatorCoins.id, addressOrId))
      .limit(1);

    if (coin.length === 0) {
      return res.status(404).json({ error: 'Creator coin not found' });
    }

    // For now, return mock comments until we implement comment system
    const mockComments = [
      {
        id: '1',
        userAddress: '0x742d35Cc6637C0532e2Bb7553B24C1B5F4Dc0b1c',
        content: 'Great content! Just bought some tokens 🚀',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        type: 'buy',
        ethAmount: '0.1'
      },
      {
        id: '2',
        userAddress: '0x1234567890123456789012345678901234567890',
        content: 'Love this creator coin concept!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        type: 'comment'
      }
    ];

    res.json(mockComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment
router.post('/:addressOrId/comments', async (req, res) => {
  try {
    const { addressOrId } = req.params;
    const { content, userAddress } = req.body;

    if (!content || !userAddress) {
      return res.status(400).json({ error: 'Content and user address are required' });
    }

    // Get the coin first
    const isAddress = addressOrId.startsWith('0x') && addressOrId.length === 42;
    const coin = await db
      .select()
      .from(creatorCoins)
      .where(isAddress ? eq(creatorCoins.coinAddress, addressOrId) : eq(creatorCoins.id, addressOrId))
      .limit(1);

    if (coin.length === 0) {
      return res.status(404).json({ error: 'Creator coin not found' });
    }

    // For now, just return success - implement actual comment storage later
    const newComment = {
      id: Date.now().toString(),
      userAddress,
      content,
      timestamp: new Date(),
      type: 'comment'
    };

    res.json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get trading status for a token
router.get('/:addressOrId/trading-status', async (req, res) => {
  try {
    const { addressOrId } = req.params;
    
    // Get the coin first
    const isAddress = addressOrId.startsWith('0x') && addressOrId.length === 42;
    const coin = await db
      .select()
      .from(creatorCoins)
      .where(isAddress ? eq(creatorCoins.coinAddress, addressOrId) : eq(creatorCoins.id, addressOrId))
      .limit(1);

    if (coin.length === 0) {
      return res.status(404).json({ error: 'Creator coin not found' });
    }

    const tradingStatus = zoraTradingService.getTradingStatus();
    
    res.json({
      ...tradingStatus,
      tokenAddress: coin[0].coinAddress,
      isDeployed: !!coin[0].coinAddress,
      deploymentNetwork: coin[0].coinAddress ? 'base-sepolia' : null
    });
  } catch (error) {
    console.error('Error fetching trading status:', error);
    res.status(500).json({ error: 'Failed to fetch trading status' });
  }
});

export default router;
