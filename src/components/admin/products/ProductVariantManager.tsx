import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, InputNumber, Popconfirm, Typography, Select, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTransition } from 'react';
import { api } from '../../../lib/api';
import type { ProductVariant } from '../../../types/product';

const { Title } = Typography;
const { Option } = Select;

interface VariantFormData {
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  imageUrl?: string;
}

interface ProductVariantManagerProps {
  productId: string;
  initialVariants?: ProductVariant[];
  onUpdate: (variants: ProductVariant[]) => Promise<void>;
}

export default function ProductVariantManager({
  productId,
  initialVariants = [],
  onUpdate,
}: ProductVariantManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [attributeKeys, setAttributeKeys] = useState<string[]>(['color', 'size']);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Effect to fetch variants if not provided
  useEffect(() => {
    if (initialVariants.length === 0 && productId) {
      fetchVariants();
    }
  }, [productId, initialVariants]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ variants: ProductVariant[] }>(`products/${productId}/variants`);
      startTransition(() => {
        setVariants(response.data.variants || []);
      });
    } catch (error) {
      console.error(`Error fetching variants for product ${productId}:`, error);
      message.error('Failed to load product variants');
      // Return empty array rather than failing
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<ProductVariant> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
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
      render: (attributes: Record<string, any>) => (
        <div>
          {Object.entries(attributes).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
      ),
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

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    
    form.setFieldsValue({
      sku: variant.sku,
      price: Number(variant.price),
      stock: variant.stock,
      imageUrl: variant.imageUrl,
      ...variant.attributes
    });
    
    setIsModalVisible(true);
  };

  const handleDelete = async (variantId: string) => {
    try {
      setLoading(true);
      await api.delete(`products/${productId}/variants/${variantId}`);
      
      const newVariants = variants.filter(variant => variant.id !== variantId);
      setVariants(newVariants);
      onUpdate(newVariants);
      message.success('Variant deleted successfully');
    } catch (error) {
      console.error('Failed to delete variant:', error);
      message.error('Failed to delete variant');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Extract attribute values from form
      const formAttributes: Record<string, any> = {};
      
      // Process attributes
      attributeKeys.forEach(key => {
        if (values[key] !== undefined) {
          formAttributes[key] = values[key];
          delete values[key]; // Remove from values object
        }
      });
      
      const variantData: ProductVariant = {
        ...values,
        attributes: formAttributes,
        productId,
      };
      
      if (editingVariant) {
        // Update existing variant
        variantData.id = editingVariant.id;
        
        const updatedVariant = await api.put<ProductVariant>(`products/${productId}/variants/${editingVariant.id}`, variantData);
        
        const updatedVariants = variants.map(variant =>
          variant.id === editingVariant.id ? updatedVariant.data : variant
        );
        
        setVariants(updatedVariants);
        onUpdate(updatedVariants);
      } else {
        // Add new variant
        const newVariant = await api.post<ProductVariant>(`products/${productId}/variants`, variantData);
        
        const newVariants = [...variants, newVariant.data];
        setVariants(newVariants);
        onUpdate(newVariants);
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingVariant(null);
      message.success(`Variant ${editingVariant ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Failed to save variant:', error);
      message.error('Failed to save variant');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttribute = () => {
    Modal.confirm({
      title: 'Add New Attribute',
      content: (
        <Input 
          placeholder="Enter attribute name (e.g., material, pattern)"
          onChange={e => {
            (Modal.confirm as any).newAttributeName = e.target.value;
          }}
        />
      ),
      onOk: () => {
        const newAttr = (Modal.confirm as any).newAttributeName;
        if (newAttr && !attributeKeys.includes(newAttr)) {
          setAttributeKeys([...attributeKeys, newAttr]);
        }
      }
    });
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Product Variants</Title>
        <div>
          <Button
            onClick={handleAddAttribute}
            style={{ marginRight: 8 }}
            disabled={loading}
          >
            Add Attribute Type
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingVariant(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            loading={loading}
          >
            Add Variant
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={variants}
        rowKey="id"
        loading={loading || isPending}
        pagination={false}
        locale={{ emptyText: "No variants yet. Add variants to offer different product options." }}
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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="SKU"
            name="sku"
            rules={[{ required: true, message: 'Please enter a SKU' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: 'Please enter a price' }]}
          >
            <InputNumber
              min={0}
              formatter={(value): string => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value): string => value!.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Stock"
            name="stock"
            rules={[{ required: true, message: 'Please enter stock quantity' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Image URL"
            name="imageUrl"
          >
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <Typography.Title level={5}>Attributes</Typography.Title>
          
          {attributeKeys.map(attrKey => (
            <Form.Item
              key={attrKey}
              label={attrKey.charAt(0).toUpperCase() + attrKey.slice(1)}
              name={attrKey}
            >
              <Input />
            </Form.Item>
          ))}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingVariant ? 'Update' : 'Add'} Variant
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
