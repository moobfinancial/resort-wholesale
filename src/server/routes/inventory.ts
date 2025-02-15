import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { productService } from '../services/productService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { googleCloudConfig } from '../config/google-cloud';

const router = express.Router();

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: './uploads/products',
  filename: (_req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage });

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(googleCloudConfig.geminiApiKey);
const model = genAI.getGenerativeModel({ model: googleCloudConfig.geminiModel });

// Utility function for retrying operations
const retry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a 503 error from Gemini
      if (error instanceof Error && 
          error.message.includes('503') && 
          error.message.includes('overloaded') &&
          attempt < maxAttempts) {
        // Wait before retrying, with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
};

// Analyze product image
router.post('/products/analyze', upload.single('image'), async (req, res) => {
  let imagePath = '';
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file uploaded'
      });
    }

    imagePath = req.file.path;
    
    // Read the image file
    const imageBuffer = await fs.promises.readFile(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    // Prepare image for Gemini
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: req.file.mimetype
      }
    };

    // Generate content using Gemini with retry logic
    const result = await retry(async () => {
      const genResult = await model.generateContent([
        'Analyze this product image and provide a detailed analysis in the following format:',
        'Product Name: [suggest a clear, marketable name]',
        'Category: [single word or short phrase]',
        'Description: [2-3 sentences describing the product]',
        'Key Features:',
        '- [feature 1]',
        '- [feature 2]',
        '- [feature 3]',
        'Tags: [comma-separated list of 5-8 relevant search tags]',
        imagePart
      ]);

      const response = await genResult.response;
      const text = response.text();
      
      // Parse the response
      const lines = text.split('\n');
      const name = lines.find(l => l.startsWith('Product Name:'))?.replace('Product Name:', '').trim() || '';
      const category = lines.find(l => l.startsWith('Category:'))?.replace('Category:', '').trim() || '';
      const description = lines.find(l => l.startsWith('Description:'))?.replace('Description:', '').trim() || '';
      const tags = lines.find(l => l.startsWith('Tags:'))?.replace('Tags:', '').trim().split(',').map(t => t.trim()) || [];

      return {
        name,
        category,
        description,
        suggestedTags: tags
      };
    });

    // Clean up the temporary image file
    await fs.promises.unlink(imagePath);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    // Clean up the temporary image file if it exists
    if (imagePath) {
      try {
        await fs.promises.unlink(imagePath);
      } catch (unlinkError) {
        console.error('Failed to clean up temporary image:', unlinkError);
      }
    }

    console.error('Image analysis error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? 
        error.message : 
        'Failed to analyze image'
    });
  }
});

// Save product with analyzed data
router.post('/products', upload.single('image'), async (req, res) => {
  try {
    let productData;
    try {
      productData = JSON.parse(req.body.data);
    } catch (error) {
      throw new Error('Invalid product data');
    }

    // Handle base64 image if no file was uploaded
    if (!req.file && productData.imageUrl?.startsWith('data:')) {
      const base64Data = productData.imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `${uuidv4()}.jpg`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      productData.imageUrl = `/uploads/products/${filename}`;
    } else if (req.file) {
      productData.imageUrl = `/uploads/products/${req.file.filename}`;
    }

    // Validate required fields
    if (!productData.name || !productData.description || !productData.category) {
      throw new Error('Missing required fields');
    }

    // Ensure numeric fields are valid
    productData.price = parseFloat(productData.price) || 0;
    productData.stock = parseInt(productData.stock) || 0;
    if (productData.minOrder) {
      productData.minOrder = parseInt(productData.minOrder);
    }

    const product = await productService.createProduct(productData);
    
    res.status(201).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Save product error:', error);
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to save product'
    });
  }
});

// Adjust stock level
router.put('/products/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (typeof stock !== 'number' && typeof stock !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Stock must be a number'
      });
    }

    const stockNumber = Number(stock);
    if (isNaN(stockNumber) || stockNumber < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid stock value'
      });
    }

    const product = await productService.getProduct(id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const updatedProduct = await productService.updateProduct(id, { stock: stockNumber });

    res.json({
      status: 'success',
      data: updatedProduct,
      message: `Stock successfully updated to ${stockNumber}`
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to adjust stock'
    });
  }
});

// Update product
router.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    let productData;
    try {
      productData = JSON.parse(req.body.data);
    } catch (error) {
      throw new Error('Invalid product data');
    }

    // Handle base64 image if no file was uploaded
    if (!req.file && productData.imageUrl?.startsWith('data:')) {
      const base64Data = productData.imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `${uuidv4()}.jpg`;
      const filePath = path.join(uploadDir, filename);
      
      // Delete old image if it exists
      const existingProduct = await productService.getProduct(id);
      if (existingProduct?.imageUrl) {
        const oldImagePath = path.join(process.cwd(), existingProduct.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      fs.writeFileSync(filePath, buffer);
      productData.imageUrl = `/uploads/products/${filename}`;
    } else if (req.file) {
      // Delete old image if it exists
      const existingProduct = await productService.getProduct(id);
      if (existingProduct?.imageUrl) {
        const oldImagePath = path.join(process.cwd(), existingProduct.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      productData.imageUrl = `/uploads/products/${req.file.filename}`;
    }

    const product = await productService.updateProduct(id, productData);
    
    res.json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update product'
    });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product to delete its image
    const product = await productService.getProduct(id);
    if (product?.imageUrl) {
      const imagePath = path.join(uploadDir, path.basename(product.imageUrl));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await productService.deleteProduct(id);
    
    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to delete product'
    });
  }
});

// List products
router.get('/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const result = await productService.listProducts({
      skip,
      take,
      category: category?.toString(),
      search: search?.toString()
    });

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch products'
    });
  }
});

// Get product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProduct(id);
    
    if (!product) {
      res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
      return;
    }
    
    res.json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get product'
    });
  }
});

export default router;
