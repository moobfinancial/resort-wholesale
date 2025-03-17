import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { uploadToCloud } from '../services/cloudStorage';
import { v4 as uuidv4 } from 'uuid';
import { validate as uuidValidate } from 'uuid';

// UUID validation helper
const isValidUUID = (uuid: string) => {
  return uuidValidate(uuid);
};

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log('File will be uploaded to:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFilename = 'product-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', newFilename);
    cb(null, newFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    console.log('Multer processing file:', file.originalname, file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Debug route to check file upload
router.post('/debug-upload', upload.single('image'), (req, res) => {
  console.log('DEBUG UPLOAD ENDPOINT CALLED');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded',
      details: 'The image field is missing from the request'
    });
  }
  
  return res.status(200).json({
    status: 'success',
    data: {
      message: 'File upload debug successful',
      file: req.file
    }
  });
});

// Get all images for a product
router.get('/:productId/images', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId is a valid UUID
    if (!isValidUUID(productId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID format'
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Get all images for the product
    const images = await prisma.productImage.findMany({
      where: { 
        productId,
        variantId: null
      } as any, // Type assertion for the entire where clause
      orderBy: { sortOrder: 'asc' }
    });

    // Return the results using standardized format
    return res.json({
      status: 'success',
      data: {
        items: images,
        total: images.length
      }
    });
  } catch (error) {
    console.error('Error retrieving product images:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving product images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST a new image for a product
router.post('/:productId/images', optionalAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('Received image upload request');
    const { productId } = req.params;
    const file = req.file;
    
    // Check if product exists first
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Validate file upload
    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file uploaded'
      });
    }

    // Extract other form data
    const { altText, isDefault, sortOrder } = req.body;
    
    console.log('Upload details:', {
      productId,
      altText,
      isDefault,
      sortOrder,
      fileName: file.originalname,
      fileSize: file.size,
      mimetype: file.mimetype
    });

    // Upload to cloud storage
    const filename = `product-${Date.now()}-${Math.floor(Math.random() * 100000000)}.${file.originalname.split('.').pop()}`;
    const destinationPath = `images/products/${filename}`;
    const imageUrl = await uploadToCloud(file.path, destinationPath);
    
    console.log('Image uploaded to cloud storage:', imageUrl);

    // Create database record
    const newImage = await prisma.productImage.create({
      data: {
        url: imageUrl,
        // Use type assertion to avoid TypeScript errors
        altText: (altText || null) as any,
        isDefault: isDefault === 'true' || isDefault === true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        product: {
          connect: {
            id: productId
          }
        }
      } as any,
    });

    console.log('Image record created in database');

    // Return success response using standardized format
    return res.status(201).json({
      status: 'success',
      data: {
        item: newImage
      }
    });
  } catch (error) {
    console.error('Error uploading product image:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error uploading product image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT (update) a product image
router.put('/:productId/images/:imageId', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const { altText, isDefault, sortOrder } = req.body;
    const file = req.file;

    // Find the image
    const existingImage = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId
      }
    });

    if (!existingImage) {
      return res.status(404).json({
        status: 'error',
        message: 'Image not found'
      });
    }

    // Prepare update data
    const updateData: any = {
      altText: altText || null,
      isDefault: isDefault === 'true' || isDefault === true,
      sortOrder: sortOrder ? parseInt(sortOrder) : existingImage.sortOrder
    };

    // Upload new image if provided
    if (file) {
      const filename = `product-${Date.now()}-${Math.floor(Math.random() * 100000000)}.${file.originalname.split('.').pop()}`;
      const destinationPath = `images/products/${filename}`;
      updateData.url = await uploadToCloud(file.path, destinationPath);
    }

    // Update the image
    const updatedImage = await prisma.productImage.update({
      where: {
        id: imageId
      },
      data: updateData
    });

    // Return using standardized format
    return res.json({
      status: 'success',
      data: {
        item: updatedImage
      }
    });
  } catch (error) {
    console.error('Error updating product image:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error updating product image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE a product image
router.delete('/:productId/images/:imageId', optionalAuth, async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    
    console.log(`Attempting to delete image with id: ${imageId} from product: ${productId}`);

    // Add validation for UUID formats
    if (!isValidUUID(productId) || !isValidUUID(imageId)) {
      console.error(`Invalid UUID format - productId: ${productId}, imageId: ${imageId}`);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid ID format'
      });
    }

    // Find the image
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId
      }
    });
    
    console.log(`Image query result:`, image ? 'Found' : 'Not found');

    if (!image) {
      // Try to find the image without the product ID constraint to see if it exists
      const anyImage = await prisma.productImage.findUnique({
        where: { id: imageId }
      });
      
      console.log(`Secondary image query:`, anyImage ? 
        `Found but belongs to product ${anyImage.productId}` : 
        'Image does not exist at all');
      
      return res.status(404).json({
        status: 'error',
        message: 'Image not found',
        details: anyImage ? 'Image exists but may belong to a different product' : 'Image does not exist'
      });
    }

    // Delete the image
    console.log(`Deleting image with id: ${imageId}`);
    await prisma.productImage.delete({
      where: {
        id: imageId
      }
    });
    console.log(`Image ${imageId} deleted successfully`);

    // Return success using standardized format
    return res.json({
      status: 'success',
      data: { 
        message: 'Image deleted successfully' 
      }
    });
  } catch (error) {
    console.error('Error deleting product image:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error deleting product image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET variant images
router.get('/:productId/variants/:variantId/images', optionalAuth, async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    
    // Use type casting to avoid TypeScript errors
    const images = await (prisma as any).productImage.findMany({
      where: { 
        productId,
        variantId
      },
      orderBy: { 
        sortOrder: 'asc' 
      }
    });
    
    return res.json({
      status: 'success',
      data: {
        items: images,
        total: images.length
      }
    });
  } catch (error) {
    console.error('Error fetching variant images:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch variant images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST variant image
router.post('/:productId/variants/:variantId/images', optionalAuth, upload.single('image'), async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { altText, isDefault, sortOrder } = req.body;
    
    // Check if variant exists
    const variant = await (prisma as any).productVariant.findUnique({
      where: { 
        id: variantId,
        productId
      }
    });
    
    if (!variant) {
      return res.status(404).json({
        status: 'error',
        message: 'Product variant not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Image file is required'
      });
    }
    
    console.log(`Uploading image for variant: ${variantId} of product: ${productId}`);
    console.log('File info:', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    // Copy to public directory for frontend access
    const publicDir = path.join(process.cwd(), 'public', 'images', 'products');
    const publicPath = path.join(publicDir, req.file.filename);
    
    // Ensure the public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    console.log('Copying file to public directory:');
    console.log(`From: ${path.join(process.cwd(), 'uploads', 'products', req.file.filename)}`);
    console.log(`To: ${publicPath}`);
    
    // Copy the file from uploads to public
    fs.copyFileSync(
      path.join(process.cwd(), 'uploads', 'products', req.file.filename),
      publicPath
    );
    
    // Set the imageUrl to the publicly accessible path for frontend
    const imageUrl = `/images/products/${req.file.filename}`;
    
    // If setting as default, update existing default images
    if (isDefault === 'true' || isDefault === true) {
      // Use type casting to avoid TypeScript errors  
      await (prisma as any).productImage.updateMany({
        where: { 
          productId,
          variantId,
        },
        data: { isDefault: false }
      });
    }
    
    // Create the image record
    // Use type casting to avoid TypeScript errors
    const newImage = await (prisma as any).productImage.create({
      data: {
        url: imageUrl,
        altText: altText || null,
        isDefault: isDefault === 'true' || isDefault === true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        productId,
        variantId,
      },
    });
    
    console.log(`Variant image created with ID: ${newImage.id}, URL: ${imageUrl}`);
    
    // Format response to include absolute URL for the image
    const response = {
      ...newImage,
      url: newImage.url.startsWith('http') 
        ? newImage.url 
        : `${req.protocol}://${req.get('host')}${newImage.url}`
    };
    
    return res.status(201).json({
      status: 'success',
      data: response
    });
  } catch (error) {
    console.error('Error creating variant image:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create variant image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT (update) a variant image
router.put('/:productId/variants/:variantId/images/:imageId', optionalAuth, async (req, res) => {
  try {
    const { productId, variantId, imageId } = req.params;
    const { altText, isDefault, sortOrder } = req.body;
    
    // Check if image exists
    // Use type casting to avoid TypeScript errors
    const existingImage = await (prisma as any).productImage.findUnique({
      where: { 
        id: imageId,
        productId,
        variantId
      }
    });
    
    if (!existingImage) {
      return res.status(404).json({
        status: 'error',
        message: 'Image not found'
      });
    }
    
    // If setting as default, update existing default images
    if ((isDefault === 'true' || isDefault === true) && !existingImage.isDefault) {
      // Use type casting to avoid TypeScript errors
      await (prisma as any).productImage.updateMany({
        where: { 
          productId,
          variantId,
          id: { not: imageId }
        },
        data: { isDefault: false }
      });
    }
    
    // Update the image
    // Use type casting to avoid TypeScript errors
    const updatedImage = await (prisma as any).productImage.update({
      where: { id: imageId },
      data: {
        altText: altText || null,
        isDefault: isDefault === 'true' || isDefault === true,
        sortOrder: sortOrder ? parseInt(sortOrder) : existingImage.sortOrder,
      },
    });
    
    // Format response to include absolute URL for the image
    const response = {
      ...updatedImage,
      url: updatedImage.url.startsWith('http') 
        ? updatedImage.url 
        : `${req.protocol}://${req.get('host')}${updatedImage.url}`
    };
    
    return res.json({
      status: 'success',
      data: {
        item: response
      }
    });
  } catch (error) {
    console.error('Error updating variant image:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update variant image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE a variant image
router.delete('/:productId/variants/:variantId/images/:imageId', optionalAuth, async (req, res) => {
  try {
    const { productId, variantId, imageId } = req.params;
    
    console.log(`Deleting image ${imageId} for product ${productId} variant ${variantId}`);
    
    // Get the image first to check if it exists and get its file path
    const image = await prisma.productImage.findUnique({
      where: {
        id: imageId,
      },
    });
    
    if (!image) {
      return res.status(404).json({
        status: 'error',
        message: 'Image not found',
        details: `No image with ID ${imageId} found`
      });
    }
    
    // Verify image belongs to the specified product and variant
    // Use type assertion to avoid TypeScript errors
    const typedImage = image as any;
    if (typedImage.productId !== productId || typedImage.variantId !== variantId) {
      return res.status(403).json({
        status: 'error',
        message: 'Image does not belong to this product variant',
        details: 'Permission denied'
      });
    }
    
    // Delete the database record
    await prisma.productImage.delete({
      where: {
        id: imageId,
      },
    });
    
    // Try to remove the actual file from disk if possible
    if (image.url && !image.url.startsWith('http')) {
      try {
        const filePath = path.join(process.cwd(), 'public', image.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file from ${filePath}`);
        }
      } catch (fileError) {
        console.error('Error deleting image file:', fileError);
        // Continue with success response since DB record was deleted successfully
      }
    }
    
    console.log(`Image ${imageId} successfully deleted`);
    
    // Return standardized success response
    return res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error deleting variant image:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete variant image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
