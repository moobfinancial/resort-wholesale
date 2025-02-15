import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Check } from 'lucide-react';

export interface ProductCaptureProps {
  onCapture: (imageUrl: string) => Promise<void>;
  onClose: () => void;
}

export default function ProductCapture({ onCapture, onClose }: ProductCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile devices
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
        stopCamera();
        try {
          await onCapture(imageDataUrl);
        } catch (error) {
          console.error('Error capturing image:', error);
        }
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUrl = reader.result as string;
        setCapturedImage(imageDataUrl);
        try {
          onCapture(imageDataUrl);
        } catch (error) {
          console.error('Error capturing image:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Capture Product Image</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 space-x-4">
              <button
                type="button"
                onClick={captureImage}
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
          </>
        ) : (
          <>
            <img
              src={capturedImage}
              alt="Captured product"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 space-x-4">
              <button
                type="button"
                onClick={retakePhoto}
                className="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700"
              >
                <Check className="w-6 h-6" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Or upload an image</p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200"
        >
          <Upload className="w-5 h-5" />
          Choose File
        </label>
      </div>
    </div>
  );
}
