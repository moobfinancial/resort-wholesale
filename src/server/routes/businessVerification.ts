import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import debug from 'debug';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const log = debug('app:business-verification');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../uploads/business-documents');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (error) {
  console.error('Error ensuring upload directory exists:', error);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error in destination handler:', error);
      cb(error as any, '');
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueId = uuidv4();
      const ext = path.extname(file.originalname);
      const filename = `${uniqueId}${ext}`;
      log('Generated filename:', filename, 'for original:', file.originalname);
      cb(null, filename);
    } catch (error) {
      console.error('Error in filename handler:', error);
      cb(error as any, '');
    }
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    try {
      log('Processing file:', file.originalname, 'mimetype:', file.mimetype);
      const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
      }
    } catch (error) {
      console.error('Error in file filter:', error);
      cb(error as any);
    }
  },
});

// Submit verification documents
router.post('/', (req, res) => {
  log('Received verification request');
  log('Request headers:', req.headers);
  log('Files in request:', req.files);

  // Set JSON content type early
  res.setHeader('Content-Type', 'application/json');

  // Handle the file upload
  upload.array('documents', 4)(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          status: 'rejected',
          message: `Upload error: ${err.message}`
        });
      } else {
        return res.status(500).json({
          status: 'rejected',
          message: `Server error: ${err.message}`
        });
      }
    }

    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          status: 'rejected',
          message: 'No files uploaded'
        });
      }

      const processedFiles = req.files.map(file => ({
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      }));

      log('Successfully processed files:', processedFiles);

      return res.json({
        status: 'submitted',
        message: 'Documents submitted successfully',
        files: processedFiles
      });
    } catch (error) {
      console.error('Error processing upload:', error);
      return res.status(500).json({
        status: 'rejected',
        message: 'Error processing upload'
      });
    }
  });
});

// Check verification status
router.get('/status', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.json({
      status: 'pending',
      message: 'Verification is pending review'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      status: 'rejected',
      message: error instanceof Error ? error.message : 'Failed to check status'
    });
  }
});

export default router;
