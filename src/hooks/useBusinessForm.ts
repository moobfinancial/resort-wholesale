import { useState, useCallback } from 'react';
import { useCustomerAuthStore } from '../stores/customerAuth';

export interface BusinessFormData {
  businessName: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZipCode: string;
  businessCountry: string;
  businessPhone: string;
  businessEmail: string;
  taxId: string;
  businessType: string;
  registrationNumber?: string;
}

interface ValidationError {
  [key: string]: string;
}

const validateField = (name: string, value: string): string => {
  switch (name) {
    case 'businessName':
      return value.length < 2 ? 'Business name must be at least 2 characters' : '';
    case 'businessAddress':
      return value.length < 5 ? 'Please enter a valid address' : '';
    case 'businessCity':
      return value.length < 2 ? 'Please enter a valid city' : '';
    case 'businessState':
      return value.length < 2 ? 'Please enter a valid state' : '';
    case 'businessZipCode':
      return value.length < 5 ? 'Please enter a valid zip code' : '';
    case 'businessCountry':
      return value.length < 2 ? 'Please enter a valid country' : '';
    case 'businessPhone':
      return /^\+?[\d\s-()]{10,}$/.test(value) ? '' : 'Please enter a valid phone number';
    case 'businessEmail':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Please enter a valid email address';
    case 'taxId':
      return /^[0-9A-Z-]{5,}$/.test(value) ? '' : 'Please enter a valid Tax ID';
    case 'businessType':
      return value.length < 2 ? 'Please specify your business type' : '';
    default:
      return '';
  }
};

interface UseBusinessFormReturn {
  formData: BusinessFormData;
  errors: ValidationError;
  isLoading: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => Promise<void>;
  resetStatus: () => void;
  resetForm: (data?: Partial<BusinessFormData>) => void;
}

export function useBusinessForm(initialData?: Partial<BusinessFormData>): UseBusinessFormReturn {
  const [formData, setFormData] = useState<BusinessFormData>({
    businessName: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZipCode: '',
    businessCountry: '',
    businessPhone: '',
    businessEmail: '',
    taxId: '',
    businessType: '',
    registrationNumber: '',
  });

  const [errors, setErrors] = useState<ValidationError>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: ValidationError = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof BusinessFormData>).forEach((key) => {
      if (key !== 'registrationNumber') {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        throw new Error('Please correct the errors before submitting');
      }

      setIsLoading(true);
      setErrorMessage(null);

      // Get authentication token from store
      const { token } = useCustomerAuthStore.getState();
      
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      // Transform the data to match the server's expected schema
      const transformedData = {
        companyName: formData.businessName,
        phone: formData.businessPhone,
        businessType: formData.businessType,
        taxId: formData.taxId,
        address: {
          street: formData.businessAddress,
          city: formData.businessCity,
          state: formData.businessState,
          zipCode: formData.businessZipCode,
          country: formData.businessCountry
        }
      };

      // Use the proper endpoint
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/customer/auth/business-details`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(transformedData)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update business information');
      }

      if (responseData.status !== 'success') {
        throw new Error(responseData.message || 'Failed to update business information');
      }

      // Update the customer auth store with the latest business information
      const { updateBusinessInfo } = useCustomerAuthStore.getState();
      if (updateBusinessInfo && responseData.data && responseData.data.customer) {
        updateBusinessInfo({
          companyName: responseData.data.customer.companyName,
          businessType: responseData.data.customer.businessType,
          taxId: responseData.data.customer.taxId,
          phone: responseData.data.customer.phone,
          address: responseData.data.customer.address
        });
      }

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetStatus = () => {
    setIsSuccess(false);
    setErrorMessage(null);
  };

  const resetForm = useCallback((data?: Partial<BusinessFormData>) => {
    setFormData({
      businessName: data?.businessName || '',
      businessAddress: data?.businessAddress || '',
      businessCity: data?.businessCity || '',
      businessState: data?.businessState || '',
      businessZipCode: data?.businessZipCode || '',
      businessCountry: data?.businessCountry || '',
      businessPhone: data?.businessPhone || '',
      businessEmail: data?.businessEmail || '',
      taxId: data?.taxId || '',
      businessType: data?.businessType || '',
      registrationNumber: data?.registrationNumber || '',
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    isLoading,
    isSuccess,
    errorMessage,
    handleInputChange,
    handleSubmit,
    resetStatus,
    resetForm
  };
}
