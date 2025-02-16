import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure upload paths
const UPLOAD_DIR = path.join(__dirname, '../../../public/uploads');

// Ensure upload directories exist
async function ensureUploadDirs() {
  const dirs = ['products', 'collections'];
  for (const dir of dirs) {
    const dirPath = path.join(UPLOAD_DIR, dir);
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Initialize storage
ensureUploadDirs().catch(console.error);

/**
 * Upload a file to local storage
 * @param file - The file object from multer
 * @param folder - The subfolder to store the file in (e.g., 'products', 'collections')
 * @returns The URL path to the uploaded file
 */
export async function uploadToStorage(file: Express.Multer.File, folder: string): Promise<string> {
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '')}`;
  const uploadPath = path.join(UPLOAD_DIR, folder, filename);

  // Ensure the directory exists
  await fs.mkdir(path.dirname(uploadPath), { recursive: true });

  // Write the file
  await fs.writeFile(uploadPath, file.buffer);

  // Return the URL path without double slashes
  return `/uploads/${folder}/${filename}`.replace(/\/+/g, '/');
}

/**
 * Delete a file from storage
 * @param url - The URL path of the file to delete
 */
export async function deleteFromStorage(url: string): Promise<void> {
  if (!url.startsWith('/uploads/')) {
    throw new Error('Invalid file URL');
  }

  // Remove any double slashes and get the file path relative to the public directory
  const relativePath = url.replace('/uploads/', '').replace(/\/+/g, '/');
  const filePath = path.join(UPLOAD_DIR, relativePath);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
