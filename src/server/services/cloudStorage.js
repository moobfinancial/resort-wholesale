import path from 'path';
import fs from 'fs';

/**
 * Simple local storage implementation that mimics cloud storage
 * In a production environment, this would upload to cloud storage like AWS S3
 * 
 * @param {string} sourcePath Path to the source file
 * @param {string} destinationPath Path where the file should be stored
 * @returns {string} The public URL for the uploaded file
 */
export async function uploadToCloud(sourcePath, destinationPath) {
  console.log(`Uploading from ${sourcePath} to ${destinationPath}`);
  
  try {
    // Determine destination directory
    const publicDir = path.join(process.cwd(), 'public');
    const fullDestPath = path.join(publicDir, destinationPath);
    const destDir = path.dirname(fullDestPath);
    
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      console.log(`Creating directory: ${destDir}`);
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the file using streams for better error handling
    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(sourcePath);
      const writeStream = fs.createWriteStream(fullDestPath);
      
      readStream.on('error', (err) => {
        console.error('Read stream error:', err);
        reject(err);
      });
      
      writeStream.on('error', (err) => {
        console.error('Write stream error:', err);
        reject(err);
      });
      
      writeStream.on('finish', () => {
        console.log(`File successfully copied to ${fullDestPath}`);
        resolve();
      });
      
      readStream.pipe(writeStream);
    });
    
    // Return the public URL (relative path from public directory)
    return `/${destinationPath.replace(/\\/g, '/')}`;
  } catch (error) {
    console.error('Error in uploadToCloud:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}
