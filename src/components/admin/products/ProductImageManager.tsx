import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, Input, Upload, Table, Space, Switch, InputNumber, message, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../lib/api';
import { useAdminAuthStore } from '../../../stores/adminAuth';

// Define interface for product images
interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  isDefault: boolean;
  sortOrder: number;
  productId: string;
  variantId: string | null;
}

interface ProductImageManagerProps {
  productId: string;
  variantId?: string;
  onUpdate?: (images: ProductImage[]) => void;
}

const ProductImageManager: React.FC<ProductImageManagerProps> = ({ 
  productId,
  variantId,
  onUpdate = () => {}
}) => {
  const { token } = useAdminAuthStore();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // Check if we have a valid token and product ID before fetching
    if (productId && token) {
      console.log('ProductImageManager: Have productId and token, fetching images');
      fetchImages();
    } else {
      console.warn('ProductImageManager: Missing productId or token', { 
        hasProductId: !!productId, 
        hasToken: !!token 
      });
    }
  }, [productId, variantId, token]);

  const fetchImages = async () => {
    if (!productId) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Fetching images for product:', productId);
      // Access the dedicated endpoint with a leading slash
      const response = await api.get(`/products/${productId}/images`);
      console.log('Image fetch response:', response);
      
      // Update the response handling with type guards
      if (response.data && typeof response.data === 'object' && 'status' in response.data) {
        if (response.data.status === 'success' && 'data' in response.data) {
          if (Array.isArray(response.data.data)) {
            console.log('Setting images from direct array:', response.data.data);
            setImages(response.data.data);
          } else if (response.data.data?.items) {
            console.log('Setting images from items array:', response.data.data.items);
            setImages(response.data.data.items);
          }
        } else {
          console.error('API Error:', response.data);
        }
      } else {
        console.error('Invalid response:', response);
        message.error('Failed to fetch images');
        setImages([]);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      message.error('Error loading images');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeImageUrl = (url: string | null): string => {
    if (!url) return '/images/products/placeholder.svg';
    
    // If URL is already a full URL, return it
    if (url.startsWith('http')) {
      return url;
    }
    
    // If URL is already an absolute path with the correct prefix, return it
    if (url.startsWith('/images/products/')) {
      return url;
    }
    
    // If URL is a relative path starting with images/ but missing the leading slash
    if (url.startsWith('images/products/')) {
      return '/' + url;
    }
    
    // If URL is from the old uploads path format
    if (url.startsWith('/uploads/products/') || url.startsWith('uploads/products/')) {
      const filename = url.split('/').pop();
      return `/images/products/${filename || 'placeholder.svg'}`;
    }
    
    // Otherwise, extract the filename and prepend the correct path
    const filename = url.split('/').pop();
    return `/images/products/${filename || 'placeholder.svg'}`;
  };

  const columns: ColumnsType<ProductImage> = [
    {
      title: 'Image',
      key: 'image',
      render: (_, image) => (
        <img 
          src={normalizeImageUrl(image.url)} 
          alt={image.altText || 'Product image'} 
          style={{ width: '80px', height: '80px', objectFit: 'cover' }} 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('/images/products/placeholder.svg')) {
              console.log('Image load error, trying fallback path:', target.src);
              target.src = '/images/products/placeholder.svg';
            }
          }}
        />
      ),
    },
    {
      title: 'Alt Text',
      dataIndex: 'altText',
      key: 'altText',
      render: (altText) => altText || '-',
    },
    {
      title: 'Default',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault) => isDefault ? 'Yes' : 'No',
    },
    {
      title: 'Order',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, image) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(image)}
            size="small"
          />
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(image.id)}
            size="small"
            danger
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (image: ProductImage) => {
    setEditingImage(image);
    form.setFieldsValue({
      altText: image.altText || '',
      isDefault: image.isDefault,
      sortOrder: image.sortOrder,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (imageId: string) => {
    try {
      setLoading(true);
      
      const endpoint = variantId
        ? `/products/${productId}/variants/${variantId}/images/${imageId}`
        : `/products/${productId}/images/${imageId}`;
      
      // Ensure token is properly formatted for the Authorization header
      // Only add 'Bearer ' if it's not already included
      const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      console.log('Using auth token for deletion:', authToken ? 'Token available' : 'No token');
      
      const response = await api.delete(endpoint, {
        headers: {
          Authorization: authToken
        }
      });
      
      console.log('Delete response:', response);
      
      // Update the response handling with type guards
      if (response.data && typeof response.data === 'object' && 'status' in response.data) {
        if (response.data.status === 'success') {
          // Success case - remove the image from the UI
          const newImages = images.filter(image => image.id !== imageId);
          setImages(newImages);
          onUpdate(newImages);
          message.success('Image deleted successfully');
        } else {
          console.error('API Error:', response.data);
          throw new Error('Failed to delete image');
        }
      } else {
        console.error('Invalid response:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      message.error('Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: {
    image?: any;
    altText?: string;
    isDefault: boolean;
    sortOrder: number;
  }) => {
    try {
      console.log('Form values:', values);
      if (!values.image && !editingImage) {
        message.error('Please select an image to upload');
        return;
      }
  
      const formData = new FormData();
      
      // Add all form fields to formData
      if (values.altText) formData.append('altText', values.altText);
      formData.append('isDefault', String(values.isDefault));
      formData.append('sortOrder', String(values.sortOrder || 0));
      
      // Add image file if we have one (for new uploads)
      if (values.image && values.image[0]?.originFileObj) {
        const file = values.image[0].originFileObj;
        console.log('Adding file to FormData:', file.name, file.type, file.size);
        formData.append('image', file);
      }
      
      let endpoint = '';
      let method: 'post' | 'put' = 'post';
      
      // Determine endpoint and method based on whether we're editing or adding
      if (editingImage) {
        if (variantId) {
          endpoint = `/products/${productId}/variants/${variantId}/images/${editingImage.id}`;
        } else {
          endpoint = `/products/${productId}/images/${editingImage.id}`;
        }
        method = 'put';
      } else {
        if (variantId) {
          endpoint = `/products/${productId}/variants/${variantId}/images`;
        } else {
          endpoint = `/products/${productId}/images`;
        }
      }
      
      console.log(`Submitting image to endpoint: ${endpoint} with method: ${method}`);
      
      // Log the form data for debugging
      const entries = Array.from(formData.entries()).map(
        ([key, value]) => `${key}: ${value instanceof File ? `File (${value.name}, ${value.type}, ${value.size} bytes)` : value}`
      );
      console.log('Form data entries:', entries);
      
      // Prepare headers - only include Authorization if we have a token
      const headers: Record<string, string> = {};
      if (token) {
        console.log('Using auth token for upload:', token.substring(0, 10) + '...');
        headers.Authorization = `Bearer ${token}`;
      }
      
      // Make the API request with proper method
      const response = await (method === 'post' 
        ? api.post(endpoint, formData, { headers }) 
        : api.put(endpoint, formData, { headers }));
      
      console.log('Upload response:', response?.data);
      console.log('Upload response (detailed):', JSON.stringify(response?.data, null, 2));
      
      // Update the response handling with type guards
      if (response.data && typeof response.data === 'object' && 'status' in response.data) {
        if (response.data.status === 'success' && 'data' in response.data) {
          if (Array.isArray(response.data.data)) {
            console.log('Successfully uploaded/updated image with standardized response');
          } else if (response.data.data?.item || (response.data.data?.id && typeof response.data.data.id === 'string')) {
            console.log('Successfully uploaded/updated image with non-standardized response');
          } else {
            console.error('Unexpected response structure:', response.data);
            throw new Error('Unexpected response format');
          }
          
          // Update the UI and fetch the latest images
          await fetchImages();
          setIsModalVisible(false);
          form.resetFields();
          setEditingImage(null);
          message.success(`Image ${editingImage ? 'updated' : 'added'} successfully`);
        } else {
          console.error('API Error:', response.data);
          throw new Error('Failed to save image');
        }
      } else {
        console.error('Invalid response:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      message.error('Failed to save image. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingImage(null);
  };

  const handleAdd = () => {
    setEditingImage(null);
    form.resetFields();
    form.setFieldsValue({
      isDefault: false,
      sortOrder: images.length,
    });
    setIsModalVisible(true);
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Product Images</h3>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
        >
          Add Image
        </Button>
      </div>
      
      {loading && !isModalVisible ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table 
          dataSource={images} 
          columns={columns} 
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'No images uploaded yet' }}
        />
      )}
      
      <Modal
        title={editingImage ? 'Edit Image' : 'Add Image'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!editingImage && (
            <Form.Item
              name="image"
              label="Image"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[{ required: true, message: 'Please upload an image' }]}
            >
              <Upload
                name="image"
                listType="picture-card"
                maxCount={1}
                beforeUpload={() => false}
                accept="image/*"
              >
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              </Upload>
            </Form.Item>
          )}
          
          <Form.Item
            name="altText"
            label="Alt Text"
          >
            <Input placeholder="Describe the image" />
          </Form.Item>
          
          <Form.Item
            name="isDefault"
            label="Default Image"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="sortOrder"
            label="Sort Order"
            tooltip={{ title: 'Lower numbers will appear first in the image gallery', placement: 'topRight' }}
            rules={[{ required: true, message: 'Please enter a sort order' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingImage ? 'Update' : 'Upload'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductImageManager;
