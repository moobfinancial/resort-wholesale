import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Descriptions,
  Table,
  Space,
  Tag,
  Typography,
  Steps,
  message,
  Modal,
  Form,
  Input,
  Select,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Step } = Steps;

interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderStatus {
  status: string;
  timestamp: string;
  comment: string;
  user: string;
  action: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  statusHistory: OrderStatus[];
  notes: string;
}

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/orders/${id}`);
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      message.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (values: { status: string; comment: string }) => {
    if (!order) return;

    try {
      // TODO: Replace with actual API call
      await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Order status updated successfully');
      setIsUpdateModalVisible(false);
      form.resetFields();
      fetchOrderDetails();
    } catch (error) {
      message.error('Failed to update order status');
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'gold', text: 'Pending' },
      PROCESSING: { color: 'blue', text: 'Processing' },
      SHIPPED: { color: 'cyan', text: 'Shipped' },
      DELIVERED: { color: 'green', text: 'Delivered' },
      CANCELLED: { color: 'red', text: 'Cancelled' },
      RETURNED: { color: 'purple', text: 'Returned' },
    };

    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  if (!order) {
    return null;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/orders')}
          >
            Back to Orders
          </Button>
          <Button
            type="primary"
            onClick={() => setIsUpdateModalVisible(true)}
          >
            Update Status
          </Button>
        </Space>

        <Title level={2}>
          Order #{order.orderNumber} {getStatusTag(order.status)}
        </Title>
      </Card>

      <Card title="Order Information">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Order Date">
            {new Date(order.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {getStatusTag(order.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Status">
            <Tag color={order.paymentStatus === 'PAID' ? 'green' : 'gold'}>
              {order.paymentStatus}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Payment Method">
            {order.paymentMethod}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Customer Information">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Name">{order.customer.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{order.customer.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{order.customer.phone}</Descriptions.Item>
          <Descriptions.Item label="Shipping Address">
            {`${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Order Items">
        <Table
          dataSource={order.items}
          columns={[
            {
              title: 'Product',
              dataIndex: 'productName',
              key: 'productName',
            },
            {
              title: 'SKU',
              dataIndex: 'sku',
              key: 'sku',
            },
            {
              title: 'Quantity',
              dataIndex: 'quantity',
              key: 'quantity',
            },
            {
              title: 'Unit Price',
              dataIndex: 'unitPrice',
              key: 'unitPrice',
              render: (price: number) => `$${price.toFixed(2)}`,
            },
            {
              title: 'Total',
              dataIndex: 'total',
              key: 'total',
              render: (total: number) => `$${total.toFixed(2)}`,
            },
          ]}
          pagination={false}
          rowKey="id"
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <Text strong>Subtotal</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong>${order.subtotal.toFixed(2)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <Text strong>Shipping</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong>${order.shippingCost.toFixed(2)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <Text strong>Tax</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong>${order.tax.toFixed(2)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong type="danger">${order.total.toFixed(2)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <Card title="Order History">
        <Steps>
          {order.statusHistory.map((status, index) => (
            <Step
              key={index}
              title={status.status}
              description={
                <div>
                  <Typography.Text strong>{status.action}</Typography.Text>
                  <br />
                  <Typography.Text type="secondary">
                    {new Date(status.timestamp).toLocaleString()} by {status.user}
                  </Typography.Text>
                  <br />
                  <Typography.Text>{status.comment}</Typography.Text>
                </div>
              }
            />
          ))}
        </Steps>
      </Card>

      <Modal
        title="Update Order Status"
        open={isUpdateModalVisible}
        onCancel={() => {
          setIsUpdateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateStatus}
        >
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select>
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="PROCESSING">Processing</Select.Option>
              <Select.Option value="SHIPPED">Shipped</Select.Option>
              <Select.Option value="DELIVERED">Delivered</Select.Option>
              <Select.Option value="CANCELLED">Cancelled</Select.Option>
              <Select.Option value="RETURNED">Returned</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label="Comment"
            rules={[{ required: true, message: 'Please enter a comment' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Status
              </Button>
              <Button onClick={() => setIsUpdateModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default OrderDetails;
