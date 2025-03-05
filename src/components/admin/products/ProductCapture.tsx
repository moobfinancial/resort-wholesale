import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Check } from 'lucide-react';
import { Button, Typography, Alert } from 'antd';

export interface ProductCaptureProps {
  onCapture: (imageUrl: string) => Promise<void>;
  onClose: () => void;
}

export default function ProductCapture({ onCapture, onClose }: ProductCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startCamera = async () => {
    console.log('Starting camera...');
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile devices
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      console.log('Camera access granted');
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error accessing camera:', errorMessage);
      setError('Failed to access camera. Make sure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCaptureClick = async () => {
    setProcessing(true);
    
    try {
      console.log('Capturing image from video stream...');
      
      if (!videoRef.current) {
        setError('Video stream not available');
        return;
      }
      
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      console.log('Image captured successfully, size:', imageDataUrl.length);
      
      // Stop the camera stream
      stopCamera();
      
      // Pass the image data URL back to the parent component
      await onCapture(imageDataUrl);
      
      // Show success message
      setSuccessMessage('Image captured and analyzed successfully!');
      
      // Close dialog after delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to capture image:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture image');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, 'size:', Math.round(file.size / 1024), 'KB');
    setIsCapturing(true);
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        const imageDataUrl = reader.result as string;
        console.log('File loaded as data URL');
        setCapturedImage(imageDataUrl);
        
        await onCapture(imageDataUrl);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error processing uploaded image:', errorMessage);
        setError('Failed to process the uploaded image: ' + errorMessage);
      } finally {
        setIsCapturing(false);
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file:', reader.error);
      setError('Failed to read the uploaded file');
      setIsCapturing(false);
    };
    
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  if (error) {
    return (
      <div className="product-capture error">
        <Alert
          type="error"
          message="Camera Error"
          description={error}
          showIcon
        />
        <div className="actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <Button onClick={retakePhoto} icon={<RefreshCw size={16} />}>Try Again</Button>
          <Button type="primary" onClick={onClose}>Close</Button>
          <div>
            <input
              type="file"
              accept="image/*"
              id="file-upload"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload">
              <Button icon={<Upload size={16} />}>Upload Image Instead</Button>
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Typography.Title level={3}>Capture Product Image</Typography.Title>
        <Button
          type="text"
          onClick={onClose}
          icon={<Check size={16} />}
        />
      </div>

      {error && (
        <Alert
          type="error"
          message="Error"
          description={error}
          showIcon
        />
      )}

      {!capturedImage ? (
        <>
          <div className="relative aspect-video bg-gray-100 rounded overflow-hidden">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Typography.Text type="secondary">Camera loading...</Typography.Text>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <div>
              <input
                type="file"
                accept="image/*"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-upload"
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded flex items-center gap-2 cursor-pointer"
              >
                <Upload size={16} />
                <Typography.Text>Upload Image</Typography.Text>
              </label>
            </div>
            
            <Button
              onClick={handleCaptureClick}
              disabled={!stream || processing}
              loading={processing}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              <Camera size={16} />
              <Typography.Text>Capture</Typography.Text>
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="relative aspect-video bg-gray-100 rounded overflow-hidden">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="flex justify-between">
            <Button
              onClick={retakePhoto}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded flex items-center gap-2"
            >
              <RefreshCw size={16} />
              <Typography.Text>Retake</Typography.Text>
            </Button>
            
            <Button
              onClick={onClose}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
            >
              <Check size={16} />
              <Typography.Text>Use This Image</Typography.Text>
            </Button>
          </div>
        </>
      )}
      {successMessage && (
        <Alert
          type="success"
          message="Success"
          description={successMessage}
          showIcon
        />
      )}
    </div>
  );
}
