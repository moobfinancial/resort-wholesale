import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, message, Tabs, Modal, Tag, Switch, Typography, InputNumber, Card } from 'antd';
import { UploadOutlined, CameraOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { Product, BulkPricing } from '../../../types/product';
import { useNavigate } from 'react-router-dom';
import BulkPricingManager from './BulkPricingManager';
import ProductCapture from './ProductCapture';
import useImageAnalysis from '../../../hooks/useImageAnalysis';
import { api } from '../../../lib/api';

// Import the ImageAnalysisResult interface from the hook
import { ImageAnalysisResult } from '../../../hooks/useImageAnalysis';

interface ProductFormProps {
  initialValues?: Partial<Product>;
  onSave: (product: any) => Promise<void>;
  isSubmitting?: boolean;
  isEdit?: boolean;
}

// Helper function to convert file to base64
const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

export default function ProductForm({ initialValues, onSave, isSubmitting = false, isEdit = false }: ProductFormProps) {
  const [isPending, startTransition] = React.useTransition();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>(
    initialValues?.imageUrl
      ? [
          {
            uid: '-1',
            name: initialValues.imageUrl.split('/').pop() || 'image.png',
            status: 'done',
            url: initialValues.imageUrl,
          },
        ]
      : []
  );
  const [bulkPricing, setBulkPricing] = useState<BulkPricing[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [productCaptureVisible, setProductCaptureVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const { analyzeImage, isLoading: isAnalyzing, error: analysisError } = useImageAnalysis();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        tags: initialValues.tags?.join(',') || '',
      });

      if (initialValues.id) {
        loadBulkPricing(initialValues.id);
      }
    }
  }, [initialValues, form]);

  useEffect(() => {
    console.log('FileList changed:', fileList);
    
    // When fileList changes and contains a valid image, update the form
    if (fileList.length > 0 && fileList[0].url) {
      form.setFieldsValue({
        imageUrl: fileList[0].url
      });
      console.log('Updated form with image URL:', fileList[0].url);
    }
  }, [fileList, form]);

  const loadBulkPricing = async (productId: string) => {
    try {
      const response = await api.get<{ tiers?: BulkPricing[] }>(`products/${productId}/bulk-pricing`);
      startTransition(() => {
        let pricingTiers: BulkPricing[] = [];
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            pricingTiers = response.data;
          } 
          else if (response.data.tiers && Array.isArray(response.data.tiers)) {
            pricingTiers = response.data.tiers;
          } 
          else if (typeof response.data === 'object' && 'minQuantity' in response.data && 'price' in response.data) {
            pricingTiers = [response.data as unknown as BulkPricing];
          }
        }
        
        console.log('Loaded bulk pricing tiers:', pricingTiers);
        setBulkPricing(pricingTiers);
      });
    } catch (error) {
      console.error(`Error fetching bulk pricing for ${productId}:`, error);
      message.error('Failed to load bulk pricing tiers');
      setBulkPricing([]);
    }
  };

  const handleSubmit = async () => {
    setFormSubmitting(true);

    try {
      const formData = new FormData();
      
      // Append other form fields
      const values = await form.validateFields();
      
      // Convert tags from comma-separated string to array
      if (values.tags && typeof values.tags === 'string') {
        values.tags = values.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
      }
      
      // Convert price and stock to numbers
      if (values.price) {
        values.price = Number(values.price);
      }
      
      if (values.stock) {
        values.stock = Number(values.stock);
      }
      
      if (values.minOrder) {
        values.minOrder = Number(values.minOrder);
      }
      
      // Create a JSON string of the product data
      // Make sure to convert values to a plain object first to avoid circular references
      const productDataObj = { ...values };
      const productDataJson = JSON.stringify(productDataObj);
      formData.append('data', productDataJson);
      
      // Log the form data for debugging
      console.log('Form data prepared:', {
        productData: productDataObj,
        hasImage: fileList.length > 0 && !!fileList[0].originFileObj
      });
      
      // Append files from fileList
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj as Blob);
      } else if (fileList.length > 0 && fileList[0].url) {
        // If we have a URL but no originFileObj, we need to handle it differently
        // Store the URL in the form data
        const imageUrl = fileList[0].url;
        if (imageUrl && !productDataObj.imageUrl) {
          productDataObj.imageUrl = imageUrl;
          // Update the data field with the new productDataObj that includes imageUrl
          formData.set('data', JSON.stringify(productDataObj));
        }
      }
      
      console.log('Submitting form with data:', values);

      // Call the onSave function with the constructed formData
      await onSave(formData);

      message.success(`Product ${initialValues ? 'updated' : 'created'} successfully!`);

      if (!initialValues) {
        form.resetFields();
        setFileList([]);
        setBulkPricing([]);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      message.error('Failed to save product');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleBulkPricingUpdate = async (updatedTiers: any[]) => {
    // Cast to BulkPricing[] for state update
    setBulkPricing(updatedTiers as BulkPricing[]);

    if (initialValues?.id) {
      try {
        await api.post<{ success: boolean }>(`products/${initialValues.id}/bulk-pricing`, {
          tiers: updatedTiers,
        });
      } catch (error) {
        console.error('Failed to sync bulk pricing with server:', error);
        message.error('Failed to update bulk pricing on server');
      }
    }
  };

  const handleImageAnalysis = async (imageDataUrl: string) => {
    message.loading({ content: 'Analyzing image...', key: 'imageAnalysis' });
    console.log('Starting image analysis for uploaded file...');
    try {
      const analysis: ImageAnalysisResult = await analyzeImage(imageDataUrl);
      console.log('Analysis result:', analysis);
      
      if (!analysis) {
        throw new Error('No analysis data received');
      }
      
      // Handle tags from suggestedTags property
      const tagsArray = analysis.suggestedTags || [];
      const tagsString = Array.isArray(tagsArray) ? tagsArray.join(', ') : '';
      
      form.setFieldsValue({
        name: analysis.name || form.getFieldValue('name'),
        sku: analysis.sku || form.getFieldValue('sku'),
        category: analysis.category,
        description: analysis.description,
        tags: tagsString
      });
      
      if (analysis.imageUrl) {
        console.log('Using image URL from analysis:', analysis.imageUrl);
        
        // Simplify the image handling
        const uid = Date.now().toString();
        const fileName = analysis.imageUrl.split('/').pop() || 'analyzed_image.jpg';
        
        // Create an UploadFile object
        const newFile: UploadFile = {
          uid,
          name: fileName,
          status: 'done',
          url: analysis.imageUrl,
        };
        
        console.log('Setting fileList with new file:', newFile);
        setFileList([newFile]);
        
        // Set the imageUrl field directly in the form
        form.setFieldValue('imageUrl', analysis.imageUrl);
        
        console.log('Form values after setting image:', form.getFieldsValue());
      }
      
      message.success({ content: 'Image analyzed successfully!', key: 'imageAnalysis' });
    } catch (error) {
      console.error('Error analyzing image:', error);
      message.error({ 
        content: `Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        key: 'imageAnalysis'
      });
    }
  };

  const handleCameraCapture = async (imageDataUrl: string) => {
    setProductCaptureVisible(false);
    
    try {
      console.log('Image captured successfully. Processing...');
      
      const uid = Date.now().toString();
      const newFile: UploadFile = {
        uid,
        name: `camera_capture_${uid}.jpg`,
        status: 'done',
        url: imageDataUrl,
        thumbUrl: imageDataUrl,
      };
      
      setFileList([newFile]);
      
      await handleImageAnalysis(imageDataUrl);
    } catch (error) {
      console.error('Error handling camera capture:', error);
      message.error('Failed to process captured image');
    }
  };

  const normalizeSrc = (src: string) => {
    if (!src) return '/images/products/placeholder.svg';
    
    // If it's already a full URL or an absolute path, return it
    if (src.startsWith('http') || src.startsWith('/')) {
      return src;
    }
    
    // Otherwise, assume it's a relative path and prepend /images/products/
    return `/images/products/${src}`;
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const tabItems = [
    {
      key: 'basic',
      label: 'Basic Info',
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'DRAFT',
            isActive: true,
            isFeatured: false,
            minOrder: 1,
            ...initialValues,
            tags: initialValues?.tags?.join(',') || '',
          }}
        >
          <Form.Item name="imageUrl" label="Product Image">
            <div style={{ marginBottom: '15px' }}>
              <Typography.Text>
                Take a picture or upload an image of your product to automatically analyze and fill product details
              </Typography.Text>
            </div>
            <div>
              <Upload
                listType="picture-card"
                maxCount={1}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={(file) => {
                  if (fileList.length === 0) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const imageDataUrl = reader.result as string;
                      handleImageAnalysis(imageDataUrl);
                    };
                    reader.readAsDataURL(file);
                  }
                  return false; 
                }}
                onPreview={handlePreview}
              >
                {fileList.length < 1 && <UploadOutlined />}
              </Upload>
              
              <Button 
                icon={<CameraOutlined />} 
                onClick={() => setProductCaptureVisible(true)}
                style={{ marginLeft: '8px' }}
              >
                Capture Photo
              </Button>
            </div>
          </Form.Item>

          <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name="price" label="Price" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="stock" label="Stock Level" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="minOrder" label="Minimum Stock Alert Level">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="tags" label="Tags">
            <Input placeholder="Enter tags separated by commas" />
          </Form.Item>

          <Form.Item name="featured" label="Featured Product" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSubmitting || formSubmitting}>
              {initialValues ? 'Update Product' : 'Create Product'}
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate('/admin/products')} disabled={isSubmitting || formSubmitting}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'images',
      label: 'Images',
      children: (
        <div>
          <Card title="Product Image">
            <div className="flex space-x-4">
              <Upload
                listType="picture-card"
                maxCount={1}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={(file) => {
                  if (fileList.length === 0) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const imageDataUrl = reader.result as string;
                      handleImageAnalysis(imageDataUrl);
                    };
                    reader.readAsDataURL(file);
                  }
                  return false; 
                }}
                onPreview={handlePreview}
              >
                {fileList.length < 1 && <UploadOutlined />}
              </Upload>
              <Button 
                icon={<CameraOutlined />} 
                onClick={() => setProductCaptureVisible(true)}
              >
                Capture
              </Button>
            </div>
          </Card>
        </div>
      )
    }
  ];

  if (initialValues?.id) {
    tabItems.push({
      key: 'pricing',
      label: 'Bulk Pricing',
      children: (
        <>
          <BulkPricingManager
            productId={initialValues.id}
            initialPricingTiers={bulkPricing}
            onUpdate={handleBulkPricingUpdate}
          />
          <div style={{ marginTop: '16px' }}>
            <Button type="primary" onClick={() => navigate('/admin/products')}>
              Done
            </Button>
          </div>
        </>
      )
    });
  }

  return (
    <div className="product-form">
      <React.Suspense fallback={<div>Loading...</div>}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </React.Suspense>
      </React.Suspense>
      <Modal
        title="Capture Product Image"
        open={productCaptureVisible}
        footer={null}
        onCancel={() => setProductCaptureVisible(false)}
        width={600}
      >
        <ProductCapture 
          onCapture={handleCameraCapture} 
          onClose={() => setProductCaptureVisible(false)} 
        />
      </Modal>
      <Modal
        title={previewTitle}
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img src={normalizeSrc(previewImage as string)} style={{ width: '100%' }} />
      </Modal>
    </div>
  );
}
