import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  message,
} from 'antd';
import {
  WarningOutlined,
} from '@ant-design/icons';
import type { Product } from '@prisma/client';

const { Title, Text } = Typography;
const { Search } = Input;

interface StockAdjustment {
  id: string;
  quantity: number;
  reason: string;
  date: Date;
}

interface StockManagerProps {
  products: Product[];
  onStockUpdate: (productId: string, newStock: number) => Promise<void>;
}

const StockManager: React.FC<StockManagerProps> = ({ products, onStockUpdate }) => {
  const [searchText, setSearchText] = useState('');
  const [isAdjustmentModalVisible, setIsAdjustmentModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentHistory, setAdjustmentHistory] = useState<Record<string, StockAdjustment[]>>({});
  const [form] = Form.useForm();

  const getLowStockThreshold = (product: Product) => {
    return product.minOrder * 2; // Example threshold calculation
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      sorter: (a: Product, b: Product) => a.sku.localeCompare(b.sku),
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Product, b: Product) => a.name.localeCompare(b.name),
    },
    {
      title: 'Current Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: Product) => {
        const threshold = getLowStockThreshold(record);
        const isLowStock = stock <= threshold;
        
        return (
          <Space>
            <Text>{stock}</Text>
            {isLowStock && (
              <Tag color="error" icon={<WarningOutlined />}>
                Low Stock
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Min. Order Quantity',
      dataIndex: 'minOrder',
      key: 'minOrder',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setSelectedProduct(record);
              setIsAdjustmentModalVisible(true);
            }}
          >
            Adjust Stock
          </Button>
          <Button
            onClick={() => showAdjustmentHistory(record)}
          >
            History
          </Button>
        </Space>
      ),
    },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchText.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleStockAdjustment = async (values: { adjustment: number; reason: string }) => {
    if (!selectedProduct) return;

    try {
      const newStock = selectedProduct.stock + values.adjustment;
      if (newStock < 0) {
        message.error('Stock cannot be negative');
        return;
      }

      await onStockUpdate(selectedProduct.id, newStock);

      // Add to adjustment history
      const newAdjustment: StockAdjustment = {
        id: Date.now().toString(),
        quantity: values.adjustment,
        reason: values.reason,
        date: new Date(),
      };

      setAdjustmentHistory(prev => ({
        ...prev,
        [selectedProduct.id]: [...(prev[selectedProduct.id] || []), newAdjustment],
      }));

      message.success('Stock updated successfully');
      setIsAdjustmentModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to update stock');
    }
  };

  const showAdjustmentHistory = (product: Product) => {
    Modal.info({
      title: `Stock Adjustment History - ${product.name}`,
      width: 600,
      content: (
        <div>
          {adjustmentHistory[product.id]?.length ? (
            <Table
              dataSource={adjustmentHistory[product.id]}
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'date',
                  render: (date: Date) => new Date(date).toLocaleString(),
                },
                {
                  title: 'Adjustment',
                  dataIndex: 'quantity',
                  render: (qty: number) => (
                    <Text type={qty >= 0 ? 'success' : 'danger'}>
                      {qty >= 0 ? '+' : ''}{qty}
                    </Text>
                  ),
                },
                {
                  title: 'Reason',
                  dataIndex: 'reason',
                },
              ]}
              pagination={false}
              rowKey="id"
            />
          ) : (
            <Text>No adjustment history available</Text>
          )}
        </div>
      ),
    });
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Inventory Management</Title>
          <Search
            placeholder="Search by SKU or product name"
            allowClear
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
        />

        <Modal
          title="Adjust Stock Level"
          open={isAdjustmentModalVisible}
          onCancel={() => {
            setIsAdjustmentModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleStockAdjustment}
          >
            <Form.Item
              name="adjustment"
              label="Stock Adjustment"
              rules={[
                { required: true, message: 'Please enter the adjustment amount' },
                { type: 'number', message: 'Please enter a valid number' },
              ]}
              help="Use positive numbers to add stock, negative to remove"
            >
              <Input type="number" />
            </Form.Item>

            <Form.Item
              name="reason"
              label="Reason for Adjustment"
              rules={[{ required: true, message: 'Please provide a reason' }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit Adjustment
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Card>
  );
};

export default StockManager;
