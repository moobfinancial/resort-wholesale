import React, { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import DocumentUpload from './DocumentUpload';

export type VerificationStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

interface BusinessVerificationProps {
  currentStatus: VerificationStatus;
  onSubmit: (files: File[]) => Promise<void>;
}

export default function BusinessVerification({ currentStatus, onSubmit }: BusinessVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      setUploadedFiles(prev => [...prev, file]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    }
  };

  const handleSubmitVerification = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(uploadedFiles);
      setUploadedFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    switch (currentStatus) {
      case 'verified':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Your business is verified</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Verification rejected. Please submit new documents.</span>
          </div>
        );
      case 'submitted':
        return (
          <div className="flex items-center text-blue-600">
            <Shield className="h-5 w-5 mr-2" />
            <span>Verification in progress</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-600">
            <Shield className="h-5 w-5 mr-2" />
            <span>Verification required</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Business Verification</h3>
          {getStatusDisplay()}
        </div>

        {currentStatus !== 'verified' && (
          <>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Required Documents
              </h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Business License or Permit</li>
                <li>Tax Registration Certificate</li>
                <li>Government-issued ID of Business Owner</li>
                <li>Proof of Business Address</li>
              </ul>
            </div>

            <DocumentUpload
              onFileUpload={handleFileUpload}
              acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              maxFileSize={5 * 1024 * 1024} // 5MB
              maxFiles={4}
            />

            {error && (
              <div className="mt-4 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            <div className="mt-6">
              <button
                disabled={isSubmitting || currentStatus === 'submitted' || uploadedFiles.length === 0}
                className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmitVerification}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
