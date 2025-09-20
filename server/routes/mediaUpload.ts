
import { Express } from 'express';
import multer from 'multer';
import { uploadFileToIPFS } from '../ipfs';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

export default function setupMediaUploadRoutes(app: Express) {
  // Upload media to IPFS
  app.post('/api/upload-media', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      console.log('📤 Uploading media to IPFS...', {
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });

      // Convert buffer to File object for IPFS upload
      const file = new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      });

      const cid = await uploadFileToIPFS(file);
      console.log('✅ Media uploaded to IPFS:', cid);

      res.json({
        success: true,
        cid,
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        url: `https://gateway.pinata.cloud/ipfs/${cid}`
      });

    } catch (error: any) {
      console.error('❌ Media upload failed:', error);
      res.status(500).json({
        error: 'Failed to upload media',
        message: error.message
      });
    }
  });
}
