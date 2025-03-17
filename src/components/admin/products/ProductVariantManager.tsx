import { useState, useEffect, useRef } from 'react';
import { Card, Button, Table, Modal, Form, Input, InputNumber, Popconfirm, Typography, message, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../lib/api'; // Import the client-side api module
import type { ProductVariant } from '../../../types/product';
import ImageWithFallback from '../../common/ImageWithFallback';

const { Title } = Typography;

// Extending the ProductVariant type to include any additional fields we need
interface ExtendedProductVariant extends Omit<ProductVariant, 'id'> {
  id?: string;
  compareAtPrice?: number | null;
}

interface ProductVariantManagerProps {
  productId: string;
  initialVariants?: ProductVariant[];
  onVariantsChange?: (variants: ProductVariant[]) => void;
}

export default function ProductVariantManager({
  productId,
  initialVariants = [],
  onVariantsChange,
}: ProductVariantManagerProps) {
  const [variants, setVariants] = useState<ExtendedProductVariant[]>(initialVariants as ExtendedProductVariant[]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ExtendedProductVariant | null>(null);
  const [attributeKeys, setAttributeKeys] = useState<string[]>(['color', 'size']);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const hasFetchedOnMount = useRef(false);

  const safeFormatPrice = (price: any): string => {
    if (price === null || price === undefined) return '$0.00';
    const numericPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    if (isNaN(numericPrice)) return '$0.00';
    return `$${numericPrice.toFixed(2)}`;
  };

  const normalizeImageUrl = (url: string | null | undefined | any): string => {
    if (!url) return '/images/products/placeholder.svg';
    
    // Handle case where url might be an object from antd Upload component
    if (typeof url === 'object') {
      // Try to extract URL from file object if it exists
      if (url.url) return normalizeImageUrl(url.url);
      if (url.response && url.response.url) return normalizeImageUrl(url.response.url);
      if (url.originFileObj && url.originFileObj.path) return normalizeImageUrl(url.originFileObj.path);
      
      console.warn('Unable to extract URL from object:', url);
      return '/images/products/placeholder.svg';
    }
    
    // Ensure url is a string before using string methods
    if (typeof url !== 'string') {
      console.warn('URL is not a string:', url);
      return '/images/products/placeholder.svg';
    }
    
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
    
    // If URL is just a filename, prepend the products directory path
    return `/images/products/${url}`;
  };

  useEffect(() => {
    if (productId && !hasFetchedOnMount.current) {
      console.log("Initial fetch of variants for product:", productId);
      fetchVariants();
      hasFetchedOnMount.current = true;
    }
  }, [productId]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      console.log(`Fetching variants for product ID: ${productId}`);
      const response = await api.variants.getVariants(productId);
      console.log('Variants response data:', response);
      
      // Process according to the standard Resort Fresh API response format:
      // { "status": "success", "data": { "items": [...], ... } }
      if (response && 
          typeof response === 'object' && 
          response.status === 'success') {
          
        let processedVariants: any[] = [];
        
        // Handle possible data structures based on the API response format memory
        if (response.data) {
          if (Array.isArray(response.data)) {
            // Direct array format
            processedVariants = response.data;
            console.log(`Found ${processedVariants.length} variants in direct array format`);
          } else if (typeof response.data === 'object') {
            const data = response.data as any; // Cast to any to avoid TypeScript errors
            if (data.items && Array.isArray(data.items)) {
              // Standard paginated format: { items: [], total: n, ... }
              processedVariants = data.items;
              console.log(`Found ${processedVariants.length} variants in data.items format`);
            } else if (data.products && Array.isArray(data.products)) {
              // Products array format: { products: [] }
              processedVariants = data.products;
              console.log(`Found ${processedVariants.length} variants in data.products format`);
            } else if (data.variants && Array.isArray(data.variants)) {
              // Variants array format: { variants: [] }
              processedVariants = data.variants;
              console.log(`Found ${processedVariants.length} variants in data.variants format`);
            } else {
              // Assume the data object itself contains the variants
              processedVariants = [data];
              console.log('Found single variant in data object format');
            }
          }
        }
        
        // Process and normalize the variants
        if (processedVariants.length > 0) {
          const normalizedVariants = processedVariants.map(variant => ({
            ...variant,
            price: typeof variant.price === 'string' ? parseFloat(variant.price) : Number(variant.price || 0),
            stock: typeof variant.stock === 'string' ? parseInt(variant.stock) : Number(variant.stock || 0),
            attributes: variant.attributes || {}, // Ensure attributes is an object
            imageUrl: normalizeImageUrl(variant.imageUrl)
          })) as ExtendedProductVariant[];
          
          console.log(`Successfully processed ${normalizedVariants.length} variants:`, normalizedVariants);
          setVariants(normalizedVariants);
        } else {
          console.log('No variants found or empty array received');
          setVariants([]);
        }
      } else {
        console.error('Invalid response format:', response);
        message.error('Failed to load variants: Invalid response format');
        setVariants([]);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      message.error('Failed to load variants');
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  // Separate state to control the visibility of the loading spinner
  const [showSpinner, setShowSpinner] = useState(false);
  
  useEffect(() => {
    // Set a timer to show the spinner only if loading takes longer than 300ms
    // This prevents flickering for quick loads
    let timer: NodeJS.Timeout;
    
    if (loading) {
      timer = setTimeout(() => {
        setShowSpinner(true);
      }, 300);
    } else {
      setShowSpinner(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  const columns: ColumnsType<ExtendedProductVariant> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl: string | undefined | null) => (
        <div style={{ width: 50, height: 50 }}>
          {imageUrl ? (
            <ImageWithFallback
              src={imageUrl}
              alt="Product variant"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
            />
          ) : (
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                background: '#f0f0f0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '20px',
                color: '#999',
                borderRadius: '4px'
              }}
            >
              <PlusOutlined style={{ opacity: 0.5 }} />
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: any) => safeFormatPrice(price),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: 'Attributes',
      dataIndex: 'attributes',
      key: 'attributes',
      render: (attributes: Record<string, any> | null | undefined) => {
        // Ensure attributes is an object (not null or undefined)
        const safeAttributes = attributes || {};
        
        return (
          <div>
            {Object.entries(safeAttributes).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {value}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, variant) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(variant)}
            disabled={loading}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this variant?"
            onConfirm={() => handleDelete(variant.id as string)}
            okText="Yes"
            cancelText="No"
            disabled={loading}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              disabled={loading}
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const handleEdit = (variant: ExtendedProductVariant) => {
    console.log('Edit variant:', variant);
    
    // Normalize image URL before setting in form
    const imageUrl = variant.imageUrl ? normalizeImageUrl(variant.imageUrl) : null;
    
    // Extract attributes or initialize empty object
    const attributes = variant.attributes || {};
    
    // Check if we need to add any missing attribute keys to our known attribute keys
    const variantAttributeKeys = Object.keys(attributes);
    const newAttributeKeys = [...attributeKeys];
    
    variantAttributeKeys.forEach(key => {
      if (!attributeKeys.includes(key)) {
        newAttributeKeys.push(key);
      }
    });
    
    // Update attribute keys if we found new ones
    if (newAttributeKeys.length > attributeKeys.length) {
      setAttributeKeys(newAttributeKeys);
    }
    
    // Set form values for editing
    form.setFieldsValue({
      ...variant,
      imageUrl, // Use normalized imageUrl
      price: variant.price ? Number(variant.price) : 0,
      compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : 0,
      stock: variant.stock,
      attributes // Set the attributes object directly
    });
    
    setEditingVariant(variant);
    setIsModalVisible(true);
  };

  const handleDelete = async (variantId: string) => {
    try {
      setLoading(true);
      
      // Use the API client's deleteVariant method
      const response = await api.variants.deleteVariant(variantId);
      
      if (response.status === 'success') {
        const newVariants = variants.filter(variant => variant.id !== variantId);
        setVariants(newVariants);
        if (onVariantsChange) {
          onVariantsChange(newVariants);
        }
        message.success('Variant deleted successfully');
      } else {
        throw new Error(response.message || 'Failed to delete variant');
      }
    } catch (error) {
      console.error('Failed to delete variant:', error);
      message.error('Failed to delete variant');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate all form fields
      const values = await form.validateFields();
      console.log('Form values:', values);
      
      // Prepare the variant object
      const variantData: Partial<ExtendedProductVariant> = {
        sku: values.sku,
        price: values.price,
        compareAtPrice: values.compareAtPrice || null,
        stock: values.stock,
        attributes: values.attributes || {},
        productId,
      };
      
      // Process the image URL, handling both string and Upload component file objects
      if (values.imageUrl) {
        const normalizedUrl = normalizeImageUrl(values.imageUrl);
        if (normalizedUrl) {
          variantData.imageUrl = normalizedUrl;
        }
      }
      
      let response;
      
      if (editingVariant?.id) {
        // Update existing variant
        console.log(`Updating variant ${editingVariant.id} with:`, variantData);
        response = await api.variants.updateVariant(editingVariant.id, variantData as ProductVariant);
      } else {
        // Create new variant
        console.log(`Creating new variant for product ${productId} with:`, variantData);
        response = await api.variants.createVariant(productId, variantData as Omit<ProductVariant, 'id'>);
      }
      
      if (response.status === 'success' && response.data) {
        // Process the response data
        const updatedVariant: ExtendedProductVariant = {
          ...response.data,
          imageUrl: normalizeImageUrl(response.data.imageUrl),
          attributes: response.data.attributes || {} // Ensure attributes is an object
        };
        
        if (editingVariant?.id) {
          // Update the variant in the local state
          setVariants(prev => prev.map(v => v.id === editingVariant.id ? updatedVariant : v));
          message.success('Variant updated successfully');
        } else {
          // Add the new variant to the local state
          setVariants(prev => [...prev, updatedVariant]);
          message.success('Variant created successfully');
        }
      } else if (response.status === 'error') {
        // Check if response has a message property
        const errorMessage = response.message || 'Failed to save variant';
        throw new Error(errorMessage);
      } else {
        throw new Error('Failed to save variant: Unknown error');
      }
      
      // Close the modal and reset form
      setIsModalVisible(false);
      form.resetFields();
      
      // Refresh the variants list to ensure we have the latest data
      fetchVariants();
      
      // Notify parent component if needed
      if (onVariantsChange) {
        onVariantsChange(variants);
      }
    } catch (error) {
      console.error('Save error:', error);
      message.error('Failed to save variant');
    }
  };

  const handleAddAttribute = () => {
    Modal.confirm({
      title: 'Add New Attribute',
      content: (
        <Input 
          placeholder="Enter attribute name (e.g. material, pattern)" 
          onChange={(e) => {
            (Modal.confirm as any).newAttributeName = e.target.value.toLowerCase().trim();
          }} 
        />
      ),
      onOk: () => {
        const newAttribute = (Modal.confirm as any).newAttributeName;
        if (newAttribute && !attributeKeys.includes(newAttribute)) {
          const newAttributeKeys = [...attributeKeys, newAttribute];
          setAttributeKeys(newAttributeKeys);
          message.success(`Added attribute: ${newAttribute}`);
        } else if (attributeKeys.includes(newAttribute)) {
          message.warning(`Attribute '${newAttribute}' already exists`);
        } else {
          message.warning('Please enter a valid attribute name');
        }
      }
    });
  };

  useEffect(() => {
    // Reset the form when the modal visibility changes to hidden
    if (!isModalVisible) {
      form.resetFields();
    }
  }, [isModalVisible, form]);

  const renderForm = () => {
    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          price: 0,
          compareAtPrice: 0,
          stock: 0,
          imageUrl: null,
          attributes: {
            color: '',
            size: '',
          }
        }}
      >
        <Form.Item
          name="sku"
          label="SKU"
          rules={[
            { required: true, message: 'Please enter a SKU' },
            { max: 100, message: 'SKU cannot exceed 100 characters' },
          ]}
        >
          <Input placeholder="Enter SKU" />
        </Form.Item>

        <Form.Item
          name="price"
          label="Price"
          rules={[
            { required: true, message: 'Please enter a price' },
            { type: 'number', min: 0, message: 'Price must be greater than or equal to 0' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            placeholder="Enter price"
          />
        </Form.Item>

        <Form.Item
          name="compareAtPrice"
          label="Compare At Price (Optional)"
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={value => value ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            placeholder="Enter compare at price"
          />
        </Form.Item>

        <Form.Item
          name="stock"
          label="Stock"
          rules={[
            { required: true, message: 'Please enter stock quantity' },
            { type: 'number', min: 0, message: 'Stock must be greater than or equal to 0' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter stock quantity"
          />
        </Form.Item>

        <Form.Item 
          label="Image" 
          name="imageUrl"
          rules={[{ required: false }]}
        >
          <Upload
            name="image"
            listType="picture-card"
            className="variant-uploader"
            showUploadList={false}
            beforeUpload={() => false} // Prevent auto-upload
            onChange={handleImageChange}
          >
            {form.getFieldValue('imageUrl') ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <ImageWithFallback
                  src={normalizeImageUrl(form.getFieldValue('imageUrl'))}
                  alt="Variant preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {!uploading && (
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      background: 'rgba(0,0,0,0.3)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      cursor: 'pointer'
                    }}
                    className="image-hover-overlay"
                  >
                    <EditOutlined style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                )}
              </div>
            ) : (
              <div>
                {uploading ? <div className="ant-upload-spin"><div className="ant-spin ant-spin-spinning"><span className="ant-spin-dot"><i className="ant-spin-dot-item"></i><i className="ant-spin-dot-item"></i><i className="ant-spin-dot-item"></i><i className="ant-spin-dot-item"></i></span></div></div> : (
                  <>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </>
                )}
              </div>
            )}
          </Upload>
          <div style={{ marginTop: 8, lineHeight: '1.5' }}>
            <small style={{ color: '#888' }}>Upload a specific image for this variant.</small>
          </div>
        </Form.Item>

        {/* Dynamic Attributes Fields */}
        <Form.Item label="Attributes">
          <div style={{ border: '1px solid #d9d9d9', borderRadius: '2px', padding: '16px', marginBottom: '16px' }}>
            {attributeKeys.map(key => (
              <Form.Item
                key={key}
                name={['attributes', key]}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
              >
                <Input placeholder={`Enter ${key}`} />
              </Form.Item>
            ))}
            <Button 
              type="dashed" 
              onClick={handleAddAttribute} 
              block 
              icon={<PlusOutlined />}
              style={{ marginTop: 16 }}
            >
              Add Attribute
            </Button>
          </div>
        </Form.Item>
      </Form>
    );
  };

  const handleImageChange = async (info: any) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    
    if (info.file.originFileObj) {
      setUploading(true);
      
      try {
        console.log('Uploading variant image for product ID:', productId);
        
        // Use the API client's uploadImage method
        const response = await api.products.uploadImage(productId, info.file.originFileObj);
        
        console.log('Image upload response:', response);
        
        if (response.status === 'success' && response.data) {
          const imageUrl = response.data.imageUrl || '';
          
          console.log('Setting image URL in form:', imageUrl);
          form.setFieldsValue({ imageUrl });
          message.success('Image uploaded successfully');
        } else {
          console.error('Failed to upload image:', response);
          message.error('Failed to upload image');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        message.error('Error uploading image');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Product Variants</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            form.resetFields();
            setEditingVariant(null);
            setIsModalVisible(true);
          }}
          disabled={loading}
        >
          Add Variant
        </Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={variants} 
        rowKey="id" 
        loading={showSpinner}
        pagination={false}
      />
      
      <Modal
        title={`${editingVariant ? 'Edit' : 'Add'} Product Variant`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingVariant(null);
        }}
        footer={null}
      >
        {renderForm()}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button 
            onClick={() => {
              setIsModalVisible(false);
              form.resetFields();
              setEditingVariant(null);
            }}
          >
            Cancel
          </Button>
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
