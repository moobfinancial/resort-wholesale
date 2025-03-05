import React from 'react';
import { Card, Timeline, Tag, Space, Typography, Select } from 'antd';
import { 
  ShoppingCartOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  TruckOutlined,
  InboxOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  timeline: {
    status: string;
    timestamp: string;
    description: string;
  }[];
  estimatedDelivery: string;
  trackingNumber?: string;
  carrier?: string;
}

interface OrderTrackingProps {
  orders: Order[];
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ orders }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ORDERED':
        return <ShoppingCartOutlined style={{ color: '#1890ff' }} />;
      case 'PROCESSING':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'SHIPPED':
        return <TruckOutlined style={{ color: '#52c41a' }} />;
      case 'DELIVERED':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default:
        return <InboxOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ORDERED':
        return 'blue';
      case 'PROCESSING':
        return 'gold';
      case 'SHIPPED':
        return 'green';
      case 'DELIVERED':
        return 'green';
      default:
        return 'default';
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Select
        style={{ width: 200 }}
        placeholder="Filter by status"
        allowClear
      >
        <Option value="ORDERED">Ordered</Option>
        <Option value="PROCESSING">Processing</Option>
        <Option value="SHIPPED">Shipped</Option>
        <Option value="DELIVERED">Delivered</Option>
      </Select>

      {orders.map(order => (
        <Card key={order.id}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Title level={4}>Order #{order.orderNumber}</Title>
              <Tag color={getStatusColor(order.status)}>{order.status}</Tag>
            </Space>

            {order.trackingNumber && (
              <Space>
                <Text strong>Tracking Number:</Text>
                <Text copyable>{order.trackingNumber}</Text>
                <Text strong>Carrier:</Text>
                <Text>{order.carrier}</Text>
              </Space>
            )}

            <Text strong>Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</Text>

            <Timeline mode="left">
              {order.timeline.map((event, index) => (
                <Timeline.Item
                  key={index}
                  dot={getStatusIcon(event.status)}
                  color={getStatusColor(event.status)}
                >
                  <Space direction="vertical">
                    <Text strong>{event.status}</Text>
                    <Text>{event.description}</Text>
                    <Text type="secondary">
                      {new Date(event.timestamp).toLocaleString()}
                    </Text>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </Space>
        </Card>
      ))}
    </Space>
  );
};

export default OrderTracking;
