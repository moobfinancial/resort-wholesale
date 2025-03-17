import { useState, useEffect, useTransition } from 'react';
import { Button, Table, Modal, Form, InputNumber, message, Typography, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../../lib/api';

const { Title } = Typography;

interface BulkPricing {
  minQuantity: number;
  price: number;
  id?: string;
  productId?: string;
}

interface BulkPricingFormData {
  minQuantity: number;
  price: number;
}

interface BulkPricingResponse {
  status: 'success';
  data: BulkPricing[] | BulkPricing | { tiers?: BulkPricing[] } | any;
}

interface BulkPricingManagerProps {
  productId: string;
  initialPricingTiers?: BulkPricing[];
  onUpdate: (tiers: BulkPricing[]) => Promise<void>;
}

export default function BulkPricingManager({
  productId,
  initialPricingTiers = [],
  onUpdate,
}: BulkPricingManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [tiers, setTiers] = useState<BulkPricing[]>(initialPricingTiers);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTier, setEditingTier] = useState<BulkPricing | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Helper function to normalize API response data
  const normalizeTiersData = (data: any): BulkPricing[] => {
    if (!data) return [];
    
    // Check for the consistent API response format first
    if (data.status === 'success' && data.data) {
      // Handle the data field
      if (Array.isArray(data.data)) {
        return data.data;
      } else if (data.data.tiers && Array.isArray(data.data.tiers)) {
        return data.data.tiers;
      } else if (typeof data.data === 'object' && 'minQuantity' in data.data && 'price' in data.data) {
        return [data.data];
      } else {
        console.warn('Unexpected data structure in success response:', data);
        return [];
      }
    }
    
    // Legacy format handling
    // If it's already an array, return it
    if (Array.isArray(data)) return data;
    
    // If it has a tiers property that's an array, return that
    if (data.tiers && Array.isArray(data.tiers)) return data.tiers;
    
    // If it's a single object with minQuantity and price, wrap it in an array
    if (typeof data === 'object' && 'minQuantity' in data && 'price' in data) {
      return [data];
    }
    
    // Default to empty array
    console.warn('Unexpected bulk pricing data format:', data);
    return [];
  };

  // Effect to fetch pricing tiers if not provided
  useEffect(() => {
    if (initialPricingTiers.length === 0 && productId) {
      fetchPricingTiers();
    }
  }, [productId, initialPricingTiers]);

  const fetchPricingTiers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`products/${productId}/bulk-pricing`);
      startTransition(() => {
        // Use the helper function to normalize the data
        const tiersData = normalizeTiersData(response.data);
        console.log('Bulk pricing tiers fetched:', tiersData);
        setTiers(tiersData);
      });
    } catch (error) {
      console.error(`Error fetching bulk pricing tiers for product ${productId}:`, error);
      message.error('Failed to load bulk pricing tiers');
      // Return empty array rather than failing
      setTiers([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Minimum Quantity',
      dataIndex: 'minQuantity',
      key: 'minQuantity',
    },
    {
      title: 'Price per Unit',
      dataIndex: 'price',
      key: 'price',
      render: (price: any) => {
        // Handle different types - check if price is a string, number, or Decimal object
        if (price === null || price === undefined) {
          return '$0.00';
        }
        
        // Handle Prisma Decimal object
        if (typeof price === 'object' && price !== null) {
          return `$${parseFloat(price.toString()).toFixed(2)}`;
        }
        
        // Handle string or number
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return `$${numPrice.toFixed(2)}`;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BulkPricing) => (
        <>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Modal
            title="Are you sure you want to delete this pricing tier?"
            open={false}
            onOk={() => handleDelete(record.id || '')}
            onCancel={() => {}}
            okText="Yes"
            cancelText="No"
          >
          </Modal>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id || '')} />
        </>
      ),
    },
  ];

  const handleEdit = (tier: BulkPricing) => {
    setEditingTier(tier);
    form.setFieldsValue({
      minQuantity: tier.minQuantity,
      price: Number(tier.price),
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (tierId: string) => {
    try {
      setLoading(true);
      const response = await api.delete(`products/${productId}/bulk-pricing/tier/${tierId}`);
      
      // Check if response follows success format
      if (response && response.data && response.data.status === 'success') {
        const newTiers = tiers.filter(tier => tier.id !== tierId);
        setTiers(newTiers);
        await onUpdate(newTiers);
        message.success('Pricing tier deleted successfully');
      } else {
        console.error('Unexpected response format:', response);
        message.error('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Failed to delete pricing tier:', error);
      message.error('Failed to delete pricing tier');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: BulkPricingFormData) => {
    try {
      setLoading(true);
      
      if (editingTier) {
        // Update existing tier
        const response = await api.put(`products/${productId}/bulk-pricing/tier/${editingTier.id}`, {
          ...values,
          id: editingTier.id
        });
        
        // Use helper to normalize the response data
        const normalizedData = normalizeTiersData(response.data);
        const updatedTierData = normalizedData.length > 0 ? normalizedData[0] : {
          ...values,
          id: editingTier.id,
          productId
        };
        
        const updatedTiers = tiers.map(tier =>
          tier.id === editingTier.id ? updatedTierData : tier
        );
        
        setTiers(updatedTiers);
        await onUpdate(updatedTiers);
      } else {
        // Add new tier
        const response = await api.post(`products/${productId}/bulk-pricing/tier`, {
          ...values,
          productId
        });
        
        // Use helper to normalize the response data
        const normalizedData = normalizeTiersData(response.data);
        const newTierData = normalizedData.length > 0 ? normalizedData[0] : {
          ...values,
          id: Date.now().toString(), // Fallback ID
          productId
        };
        
        const newTiers = [...tiers, newTierData];
        setTiers(newTiers);
        await onUpdate(newTiers);
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setEditingTier(null);
      message.success(`Pricing tier ${editingTier ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Failed to save pricing tier:', error);
      message.error('Failed to save pricing tier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Bulk Pricing Tiers</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTier(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
          loading={loading}
        >
          Add Pricing Tier
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tiers}
        rowKey="id"
        loading={loading || isPending}
        pagination={false}
        locale={{ emptyText: "No bulk pricing tiers yet. Add tiers to offer volume discounts." }}
      />

      <Modal
        title={`${editingTier ? 'Edit' : 'Add'} Pricing Tier`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingTier(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="minQuantity"
            label="Minimum Quantity"
            rules={[
              { required: true, message: 'Please enter minimum quantity' },
              { type: 'number', min: 1, message: 'Quantity must be greater than 0' },
            ]}
          >
            <InputNumber type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price per Unit"
            rules={[
              { required: true, message: 'Please enter price per unit' },
              { type: 'number', min: 0, message: 'Price must be greater than or equal to 0' },
            ]}
          >
            <InputNumber type="number" step="0.01" min={0} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingTier ? 'Update' : 'Add'} Tier
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
