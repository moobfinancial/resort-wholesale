import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface DocumentFile extends File {
  id: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  preview?: string;
}

interface DocumentUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
}

export default function DocumentUpload({
  onFileUpload,
  acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 5
}: DocumentUploadProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedFileTypes.some(type => file.name.toLowerCase().endsWith(type))) {
      return `File type not accepted. Please upload: ${acceptedFileTypes.join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`;
    }
    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newFile: DocumentFile = {
      ...file,
      id: Math.random().toString(36).substring(7),
      status: 'uploading',
      progress: 0
    };

    if (file.type.startsWith('image/')) {
      newFile.preview = URL.createObjectURL(file);
    }

    setFiles(prev => [...prev, newFile]);
    setError(null);

    try {
      await onFileUpload(file);
      setFiles(prev =>
        prev.map(f =>
          f.id === newFile.id ? { ...f, status: 'success', progress: 100 } : f
        )
      );
    } catch (err) {
      setFiles(prev =>
        prev.map(f =>
          f.id === newFile.id ? { ...f, status: 'error', progress: 0 } : f
        )
      );
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={acceptedFileTypes.join(',')}
          onChange={e => e.target.files && handleFile(e.target.files[0])}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop your files here or click to browse
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Accepted files: {acceptedFileTypes.join(', ')} (Max {maxFileSize / 1024 / 1024}MB)
          </p>
        </label>
      </div>

      {error && (
        <div className="flex items-center text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        {files.map(file => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)}KB
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {file.status === 'uploading' && (
                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
              )}
              {file.status === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {file.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <button
                onClick={() => removeFile(file.id)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
