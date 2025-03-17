import { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Upload, message, Tabs, Modal, Switch, Typography, InputNumber, Card, Alert, Select } from 'antd';
import { UploadOutlined, CameraOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { Product, BulkPricing } from '../../../types/product';
import { useNavigate } from 'react-router-dom';
import BulkPricingManager from './BulkPricingManager';
import ProductVariantManager from './ProductVariantManager';
import ProductImageManager from './ProductImageManager';
import ProductCapture from './ProductCapture';
import useImageAnalysis from '../../../hooks/useImageAnalysis';
import { api } from '../../../lib/api';
import ImageWithFallback from '../../common/ImageWithFallback';

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
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [productStatus, setProductStatus] = useState<string>(initialValues?.status || 'PUBLISHED'); // Default to PUBLISHED
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
  const { analyzeImage } = useImageAnalysis();

  // Use a ref to prevent duplicate form submissions
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        tags: initialValues.tags?.join(',') || '',
        status: productStatus,
      });

      if (initialValues.id) {
        loadBulkPricing(initialValues.id);
      }
    }
  }, [initialValues, form, productStatus]);

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
    } catch (error) {
      console.error(`Error fetching bulk pricing for ${productId}:`, error);
      message.error('Failed to load bulk pricing tiers');
      setBulkPricing([]);
    }
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      console.log('Preventing duplicate form submission');
      return;
    }

    isSubmittingRef.current = true;

    setFormSubmitting(true);

    try {
      const formData = new FormData();
      
      // Validate and get form values
      const values = await form.validateFields();
      
      // Convert tags from comma-separated string to array
      if (values.tags && typeof values.tags === 'string') {
        values.tags = values.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
      } else if (!values.tags) {
        values.tags = []; // Ensure tags is at least an empty array
      }
      
      // Set default status if not provided
      if (!values.status) {
        values.status = 'PUBLISHED';
      }

      // Convert price, stock and minOrder to numbers
      values.price = Number(values.price) || 0;
      values.stock = Number(values.stock) || 0;
      values.minOrder = Number(values.minOrder) || 1;
      
      // Create a JSON string of the product data
      // Make sure to convert values to a plain object first to avoid circular references
      const productDataObj = { ...values };
      
      // Ensure required fields are present
      if (!productDataObj.name) {
        throw new Error('Product name is required');
      }
      
      if (!productDataObj.description) {
        throw new Error('Product description is required');
      }
      
      if (!productDataObj.category) {
        throw new Error('Product category is required');
      }
      
      if (!productDataObj.price) {
        throw new Error('Product price is required');
      }
      
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
      isSubmittingRef.current = false;
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
    
    // If it's already a full URL, return it
    if (src.startsWith('http')) {
      return src;
    }
    
    // If it's already an absolute path with the correct prefix, return it
    if (src.startsWith('/images/products/')) {
      return src;
    }
    
    // If it's a relative path starting with images/ but missing the leading slash
    if (src.startsWith('images/products/')) {
      return '/' + src;
    }
    
    // If it's from the old uploads path format
    if (src.startsWith('/uploads/products/') || src.startsWith('uploads/products/')) {
      const filename = src.split('/').pop();
      return `/images/products/${filename || 'placeholder.svg'}`;
    }
    
    // Otherwise, extract the filename and prepend the correct path
    const filename = src.split('/').pop();
    return `/images/products/${filename || 'placeholder.svg'}`;
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="Basic Info" key="basic">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              status: 'PUBLISHED',
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
                  itemRender={(originNode, file) => {
                    // Custom rendering for the uploaded image
                    if (file.status === 'done' && file.url) {
                      const normalizedUrl = normalizeSrc(file.url);
                      return (
                        <div className="ant-upload-list-item-container">
                          <div className="ant-upload-list-item ant-upload-list-item-done">
                            <div className="ant-upload-list-item-thumbnail">
                              <ImageWithFallback
                                src={normalizedUrl}
                                alt={file.name}
                                className="ant-upload-list-item-image"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <span className="ant-upload-list-item-actions">
                              {originNode.props.children[1]}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return originNode;
                  }}
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

            <Form.Item 
              name="status" 
              label="Status" 
              initialValue="PUBLISHED" 
              rules={[{ required: true }]}
              tooltip={{
                title: (
                  <div>
                    <p><strong>Draft</strong>: Product is in development and not visible to customers</p>
                    <p><strong>Pending Review</strong>: Ready for admin review before publishing</p>
                    <p><strong>Approved</strong>: Product is approved but not yet published</p>
                    <p><strong>Published</strong>: Product is visible to customers</p>
                    <p><strong>Archived</strong>: Product is no longer available but kept for records</p>
                  </div>
                ),
                placement: 'right',
              }}
            >
              <Select onChange={(value) => setProductStatus(value)}>
                <Select.Option value="DRAFT">Draft</Select.Option>
                <Select.Option value="PENDING_REVIEW">Pending Review</Select.Option>
                <Select.Option value="APPROVED">Approved</Select.Option>
                <Select.Option value="PUBLISHED">Published</Select.Option>
                <Select.Option value="ARCHIVED">Archived</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item 
              name="isFeatured" 
              label="Featured Product" 
              valuePropName="checked"
              tooltip={{
                title: "Featured products will appear on the homepage. Only products with status 'Approved' or 'Published' can be featured.",
                placement: 'right',
              }}
            >
              <Switch disabled={!['APPROVED', 'PUBLISHED'].includes(productStatus)} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isSubmitting || formSubmitting}>
                {isEdit ? 'Update Product' : 'Create Product'}
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={() => navigate('/admin/products')} disabled={isSubmitting || formSubmitting}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="Images" key="images">
          <Card title="Primary Product Image" style={{ marginBottom: 24 }}>
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
                itemRender={(originNode, file) => {
                  // Custom rendering for the uploaded image
                  if (file.status === 'done' && file.url) {
                    const normalizedUrl = normalizeSrc(file.url);
                    return (
                      <div className="ant-upload-list-item-container">
                        <div className="ant-upload-list-item ant-upload-list-item-done">
                          <div className="ant-upload-list-item-thumbnail">
                            <ImageWithFallback
                              src={normalizedUrl}
                              alt={file.name}
                              className="ant-upload-list-item-image"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <span className="ant-upload-list-item-actions">
                            {originNode.props.children[1]}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return originNode;
                }}
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
          
          {initialValues?.id ? (
            <ProductImageManager
              productId={initialValues.id}
              onUpdate={async (images) => {
                console.log('Updated product images:', images);
                // You might want to update the product form state with the new images
              }}
            />
          ) : (
            <Alert
              message="Save the product first to manage additional images"
              description="You can add multiple images after creating the basic product."
              type="info"
            />
          )}
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="Bulk Pricing" key="pricing">
          {initialValues?.id ? (
            <BulkPricingManager
              productId={initialValues.id}
              initialPricingTiers={bulkPricing}
              onUpdate={handleBulkPricingUpdate}
            />
          ) : (
            <Alert
              message="Save the product first to add bulk pricing"
              description="You can add bulk pricing tiers after creating the basic product."
              type="info"
            />
          )}
        </Tabs.TabPane>
        
        {initialValues?.id && (
          <Tabs.TabPane tab="Variants" key={`variants-${initialValues.id}`}>
            <div className="mb-4">
              <Typography.Text>Add size, color, or other variations of your product.</Typography.Text>
            </div>
            <ProductVariantManager
              productId={initialValues.id}
              initialVariants={[]}
              onVariantsChange={() => {
                // If needed, update parent component when variants change
                console.log('Variants updated');
              }}
            />
          </Tabs.TabPane>
        )}
      </Tabs>

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
        <div style={{ width: '100%', marginTop: '8px' }}>
          <ImageWithFallback 
            src={normalizeSrc(previewImage as string)} 
            style={{ width: '100%' }} 
            alt="Product preview"
          />
        </div>
      </Modal>
    </div>
  );
}
