import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { productService } from '../services/productService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { googleCloudConfig } from '../config/google-cloud';
import slugify from 'slugify';

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

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure public images directory exists
const publicImagesDir = path.join(process.cwd(), 'public', 'images', 'products');
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

// Initialize Gemini API
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

try {
  if (googleCloudConfig.geminiApiKey) {
    console.log('Initializing Gemini API with key:', googleCloudConfig.geminiApiKey?.substring(0, 4) + '...');
    genAI = new GoogleGenerativeAI(googleCloudConfig.geminiApiKey);
    model = genAI.getGenerativeModel({ model: googleCloudConfig.geminiModel });
    console.log('Gemini API initialized successfully');
  } else {
    console.warn('No Gemini API key found in environment variables');
  }
} catch (error) {
  console.error('Failed to initialize Gemini API:', error);
}

// Copy file from uploads to public directory
const copyFileToPublic = async (filename: string | undefined) => {
  if (!filename) {
    console.error('No filename provided to copy to public directory');
    return false;
  }
  
  try {
    const sourcePath = path.join(uploadDir, filename);
    const targetPath = path.join(publicImagesDir, filename);
    
    console.log(`Copying file from ${sourcePath} to ${targetPath}`);
    
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`Source file does not exist: ${sourcePath}`);
      return false;
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Successfully copied file to public directory: ${filename}`);
    return true;
  } catch (error) {
    console.error(`Failed to copy file to public directory: ${error}`);
    return false;
  }
};

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

// Helper function to generate a SKU
const generateSku = (productName: string, category: string): string => {
  // Extract first 3 letters of category (uppercase)
  const categoryPrefix = (category || 'GEN').substring(0, 3).toUpperCase();
  
  // Extract first 3 letters of product name (uppercase)
  const namePrefix = (productName || 'PROD').substring(0, 3).toUpperCase();
  
  // Add random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  return `${categoryPrefix}-${namePrefix}-${randomNum}`;
};

// Analyze product image
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  let imagePath = '';
  try {
    console.log('Received image analysis request');
    
    if (!req.file) {
      console.log('No image file found in request');
      return res.status(400).json({
        status: 'error',
        message: 'No image file uploaded'
      });
    }

    console.log(`Processing uploaded image: ${req.file.originalname}, size: ${(req.file.size / 1024).toFixed(2)}KB`);
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

    console.log('Sending image to Gemini for analysis. API Key present:', !!googleCloudConfig.geminiApiKey);
    
    // Check if Gemini API key is available and model is initialized
    if (!googleCloudConfig.geminiApiKey || !model) {
      console.log('No Gemini API key found or model not initialized. Skipping image analysis.');
      // Generate a default product name and category for SKU
      const defaultName = path.parse(req.file.originalname).name.replace(/[-_]/g, ' ');
      const defaultCategory = 'Other';
      const sku = generateSku(defaultName, defaultCategory);
      
      // Return a default analysis when no API key is available
      return res.json({
        status: 'success',
        data: {
          productName: defaultName,
          sku: sku,
          category: defaultCategory,
          description: 'A new product in our collection.',
          features: ['Quality materials', 'Handcrafted', 'Unique design'],
          tags: ['new', 'product', 'resort', 'collection']
        }
      });
    }
    
    try {
      const result = await retry(async () => {
        try {
          const genResult = await model.generateContent([
            'You are a product catalog assistant. Analyze this product image and provide the following information:',
            'Name: (product name)',
            'Category: (most appropriate category)',
            'Description: (brief product description)',
            'Tags: (comma-separated list of relevant tags)',
            'Only respond with these exact fields, nothing else.',
            imagePart
          ]);
          
          if (!genResult || !genResult.response || !genResult.response.text) {
            throw new Error('Invalid response from Gemini API');
          }
          
          const text = genResult.response.text();
          console.log('Gemini API response:', text);
          
          // Parse the response
          const lines = text.split('\n').filter((line: string) => line.trim() !== '');
          
          // Ensure req.file is defined (we already checked this above)
          const fileName = req.file ? req.file.originalname : 'unknown';
          
          const name = lines.find((l: string) => l.startsWith('Name:'))?.replace('Name:', '').trim() || path.parse(fileName).name.replace(/[-_]/g, ' ');
          const category = lines.find((l: string) => l.startsWith('Category:'))?.replace('Category:', '').trim() || 'Other';
          const description = lines.find((l: string) => l.startsWith('Description:'))?.replace('Description:', '').trim() || '';
          const tags = lines.find((l: string) => l.startsWith('Tags:'))?.replace('Tags:', '').trim().split(',').map((t: string) => t.trim()) || [];

          const sku = generateSku(name, category);
          
          return {
            name,
            sku,
            category,
            description,
            suggestedTags: tags,
            imageUrl: '', // Add imageUrl property with empty string
            features: [] // Add features property with empty array
          };
        } catch (innerError) {
          console.error('Error in Gemini API call:', innerError);
          throw innerError;
        }
      });
      
      // Save the image to the uploads directory
      const filename = `${Date.now()}-${path.basename(req.file.originalname)}`;
      
      // Ensure directories exist
      const uploadsProductsDir = path.join(process.cwd(), 'uploads', 'products');
      const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      const publicImagesDir = path.join(process.cwd(), 'public', 'images', 'products');
      
      [uploadsProductsDir, publicUploadsDir, publicImagesDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created directory: ${dir}`);
        }
      });
      
      const uploadPath = path.join(uploadsProductsDir, filename);
      
      await fs.promises.copyFile(imagePath, uploadPath);
      console.log(`Image saved to ${uploadPath}`);
      
      // Copy to public/uploads/products for backwards compatibility
      const publicUploadsPath = path.join(publicUploadsDir, filename);
      await fs.promises.copyFile(uploadPath, publicUploadsPath);
      console.log(`Image copied to public uploads directory: ${publicUploadsPath}`);
      
      // Copy to public/images/products for correct path
      const publicImagesPath = path.join(publicImagesDir, filename);
      await fs.promises.copyFile(uploadPath, publicImagesPath);
      console.log(`Image copied to public images directory: ${publicImagesPath}`);
      
      // Add the image URL to the result
      if (result) {
        // Use the correct path format for the frontend
        result.imageUrl = `/images/products/${filename}`;
        console.log(`Setting image URL in analysis result: ${result.imageUrl}`);
      }
      
      // Format the response for the frontend
      return res.json({
        status: 'success',
        data: {
          productName: result.name,
          sku: result.sku,
          category: result.category,
          description: result.description,
          features: result.features || [],
          tags: result.suggestedTags
        }
      });
    } catch (error) {
      console.error('Error in image analysis:', error);
      
      // Generate default values when API fails
      const defaultName = path.parse(req.file.originalname).name.replace(/[-_]/g, ' ');
      const defaultCategory = 'Other';
      const sku = generateSku(defaultName, defaultCategory);
      
      // Save the image to the uploads directory even if analysis fails
      const filename = `${Date.now()}-${path.basename(req.file.originalname)}`;
      
      try {
        await fs.promises.copyFile(imagePath, path.join(uploadDir, filename));
        console.log(`Image saved to ${uploadDir} despite analysis failure`);
        
        // Also copy to public directory for frontend access
        await fs.promises.copyFile(imagePath, path.join(publicImagesDir, filename));
        console.log(`Image copied to public directory: ${publicImagesDir}`);
        
        // Return default values with image URL
        return res.json({
          status: 'success',
          data: {
            productName: defaultName,
            sku: sku,
            category: defaultCategory,
            description: 'A new product in our collection.',
            features: ['Quality materials', 'Handcrafted', 'Unique design'],
            tags: ['new', 'product', 'resort', 'collection'],
            imageUrl: `/images/products/${filename}`
          }
        });
      } catch (saveError) {
        console.error('Error saving image after analysis failure:', saveError);
      }
      
      // Return default values
      return res.json({
        status: 'success',
        data: {
          productName: defaultName,
          sku: sku,
          category: defaultCategory,
          description: 'A new product in our collection.',
          features: ['Quality materials', 'Handcrafted', 'Unique design'],
          tags: ['new', 'product', 'resort', 'collection']
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to analyze image:', error);
    
    // Clean up the uploaded file if it exists
    if (imagePath && fs.existsSync(imagePath)) {
      try {
        await fs.promises.unlink(imagePath);
        console.log(`Deleted temporary image file after error: ${imagePath}`);
      } catch (unlinkError) {
        console.error(`Failed to delete temporary image file ${imagePath}:`, unlinkError);
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// Save product with analyzed data
router.post('/products', upload.single('image'), async (req, res) => {
  try {
    let productData;
    
    // Log the received data for debugging
    console.log('Received form data:', req.body);
    console.log('Received file:', req.file);
    
    try {
      // Check if data field exists
      if (!req.body.data) {
        console.error('No data field found in request body');
        return res.status(400).json({
          status: 'error',
          message: 'Missing product data',
          details: JSON.stringify(req.body)
        });
      }
      
      // Parse the JSON data from the 'data' field
      try {
        productData = JSON.parse(req.body.data);
        console.log('Parsed product data:', productData);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError, 'Data received:', req.body.data);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid JSON in product data',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        });
      }
    } catch (error) {
      console.error('Error processing product data:', error);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product data format',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Check if there's an image file in the request
    if (req.file) {
      const filename = `${Date.now()}-${path.basename(req.file.originalname)}`;
      
      // Ensure all directories exist
      const uploadDir = path.join(process.cwd(), 'uploads', 'products');
      const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      const publicImagesDir = path.join(process.cwd(), 'public', 'images', 'products');
      
      // Create all required directories if they don't exist
      [uploadDir, publicUploadsDir, publicImagesDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created directory: ${dir}`);
        }
      });
      
      // Save the image to the uploads directory
      const uploadPath = path.join(uploadDir, filename);
      
      // Check if req.file has buffer or path
      if (req.file.buffer) {
        await fs.promises.writeFile(uploadPath, req.file.buffer);
      } else if (req.file.path) {
        await fs.promises.copyFile(req.file.path, uploadPath);
      } else {
        throw new Error('No file data available');
      }
      console.log(`Image saved to ${uploadPath}`);
      
      // Copy to public/uploads/products for backwards compatibility
      const publicUploadsPath = path.join(publicUploadsDir, filename);
      await fs.promises.copyFile(uploadPath, publicUploadsPath);
      console.log(`Image copied to public uploads directory: ${publicUploadsPath}`);
      
      // Copy to public/images/products for correct path
      const publicImagesPath = path.join(publicImagesDir, filename);
      await fs.promises.copyFile(uploadPath, publicImagesPath);
      console.log(`Image copied to public images directory: ${publicImagesPath}`);
      
      // Set the image URL in the product data
      productData.imageUrl = `/images/products/${filename}`;
      console.log(`Image URL set to: ${productData.imageUrl}`);
    } else if (productData.imageUrl?.startsWith('data:')) {
      console.log('Processing base64 image data - length:', productData.imageUrl.length);
      
      // Extract the base64 data
      const matches = productData.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        console.error('Invalid base64 image data');
        throw new Error('Invalid image data format');
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate a filename based on product name or random string
      const extension = mimeType.split('/')[1] || 'jpg';
      const filename = `${slugify(productData.name || 'product')}-${Date.now()}.${extension}`;
      
      // Save to uploads directory (for server)
      const uploadPath = path.join(process.cwd(), 'uploads', 'products', filename);
      await fs.promises.writeFile(uploadPath, buffer);
      console.log(`Base64 image saved to uploads directory: ${uploadPath}`);
      
      // Save to public directory (for client)
      const publicPath = path.join(process.cwd(), 'public', 'images', 'products', filename);
      await fs.promises.writeFile(publicPath, buffer);
      console.log(`Base64 image saved to public directory: ${publicPath}`);
      
      // Set the image URL in the product data
      productData.imageUrl = `/images/products/${filename}`;
      console.log(`Image URL set to: ${productData.imageUrl}`);
    } else if (productData.imageUrl === 'placeholder' || !productData.imageUrl) {
      // Set the default placeholder image path
      console.log('Using placeholder image');
      productData.imageUrl = '/images/products/placeholder.svg';
    } else {
      console.log(`Using provided image URL: ${productData.imageUrl}`);
      
      // Special handling for URLs that might be full paths
      if (productData.imageUrl && !productData.imageUrl.startsWith('/images/') && !productData.imageUrl.startsWith('http')) {
        const filename = productData.imageUrl.split('/').pop();
        if (filename) {
          productData.imageUrl = `/images/products/${filename}`;
          console.log(`Normalized image URL to: ${productData.imageUrl}`);
        }
      }
    }
    // No else clause here - if imageUrl is already set and not a data URL, and no file was uploaded,
    // we'll keep the existing imageUrl value

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
      data: {
        item: product
      }
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

    const product = await productService.getProductById(id);
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
      console.log('Processing base64 image data - length:', productData.imageUrl.length);
      
      // Extract the base64 data
      const matches = productData.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        console.error('Invalid base64 image data');
        throw new Error('Invalid image data format');
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate a filename based on product name or random string
      const extension = mimeType.split('/')[1] || 'jpg';
      const filename = `${slugify(productData.name || 'product')}-${Date.now()}.${extension}`;
      
      // Save to uploads directory (for server)
      const uploadPath = path.join(process.cwd(), 'uploads', 'products', filename);
      await fs.promises.writeFile(uploadPath, buffer);
      console.log(`Base64 image saved to uploads directory: ${uploadPath}`);
      
      // Save to public directory (for client)
      const publicPath = path.join(process.cwd(), 'public', 'images', 'products', filename);
      await fs.promises.writeFile(publicPath, buffer);
      console.log(`Base64 image saved to public directory: ${publicPath}`);
      
      // Set the image URL in the product data
      productData.imageUrl = `/images/products/${filename}`;
      console.log(`Image URL set to: ${productData.imageUrl}`);
    } else if (req.file) {
      console.log(`File uploaded: ${req.file.filename}`);
      productData.imageUrl = `/images/products/${req.file.filename}`;
      await copyFileToPublic(req.file.filename);
      console.log(`Image URL set to: ${productData.imageUrl}`);
    } else if (productData.imageUrl === 'placeholder' || !productData.imageUrl) {
      // Set the default placeholder image path
      console.log('Using placeholder image');
      productData.imageUrl = '/images/products/placeholder.svg';
    } else {
      console.log(`Using provided image URL: ${productData.imageUrl}`);
      
      // Special handling for URLs that might be full paths
      if (productData.imageUrl && !productData.imageUrl.startsWith('/images/') && !productData.imageUrl.startsWith('http')) {
        const filename = productData.imageUrl.split('/').pop();
        if (filename) {
          productData.imageUrl = `/images/products/${filename}`;
          console.log(`Normalized image URL to: ${productData.imageUrl}`);
        }
      }
    }
    // No else clause here - if imageUrl is already set and not a data URL, and no file was uploaded,
    // we'll keep the existing imageUrl value

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
    const productResponse = await productService.getProductById(id);
    const productData = productResponse?.data?.item || productResponse;
    
    if (productData && typeof productData === 'object' && 'imageUrl' in productData) {
      const imageUrl = productData.imageUrl as string;
      if (imageUrl) {
        const imagePath = path.join(uploadDir, path.basename(imageUrl));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
        const publicImagePath = path.join(publicImagesDir, path.basename(imageUrl));
        if (fs.existsSync(publicImagePath)) {
          fs.unlinkSync(publicImagePath);
        }
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

// Get product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    
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

// Get all products for admin inventory
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = req.query.sort as string || 'updatedAt';
    const order = req.query.order as string || 'desc';
    const search = req.query.search as string || '';
    const category = req.query.category as string;
    
    // Use listProducts with the correct parameters
    const result = await productService.listProducts({
      page,
      limit,
      where: {
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } }
          ]
        } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { [sort]: order },
    });
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch products' 
    });
  }
});

// Get products with pagination
router.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = req.query.sort as string || 'updatedAt';
    const order = req.query.order as string || 'desc';
    const search = req.query.search as string || '';
    
    // Use listProducts with the correct parameters
    const result = await productService.listProducts({
      page,
      limit,
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ]
      } : undefined,
      orderBy: { [sort]: order },
    });
      
    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

export default router;
