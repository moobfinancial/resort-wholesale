import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Result, Typography } from 'antd';
import { CheckCircleOutlined, ShoppingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const OrderConfirmation: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="mb-8">
        <Result
          status="success"
          icon={<CheckCircleOutlined className="text-green-500" />}
          title="Order Placed Successfully!"
          subTitle={`Order number: ${orderNumber}`}
          extra={[
            <Link to="/products" key="shop">
              <Button type="primary" icon={<ShoppingOutlined />} size="large">
                Continue Shopping
              </Button>
            </Link>,
            <Link to="/customer/dashboard" key="dashboard">
              <Button size="large">
                View Order History
              </Button>
            </Link>,
          ]}
        />
        
        <div className="text-center mt-8">
          <Title level={4} className="mb-4">Thank you for your order!</Title>
          <Text className="block mb-2">
            We've received your order and will begin processing it right away.
          </Text>
          <Text className="block mb-6">
            You will receive an email confirmation shortly.
          </Text>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-md inline-block">
            <Text className="text-blue-600">
              Need help? Contact our customer service at support@resortfresh.com
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderConfirmation;
