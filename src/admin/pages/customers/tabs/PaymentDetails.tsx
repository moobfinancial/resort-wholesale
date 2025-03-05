import React from 'react';
import { Card, Form, Input, Button, Select, InputNumber, Space, Typography } from 'antd';
import { SaveOutlined, CreditCardOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

interface PaymentDetailsProps {
  customer: {
    id: string;
    paymentMethods: any[];
    creditLimit: number;
    paymentTerms: string;
    billingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  onUpdate: (values: any) => Promise<void>;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ customer, onUpdate }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      await onUpdate(values);
    } catch (error) {
      console.error('Failed to update payment details:', error);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title={<Title level={4}>Payment Methods</Title>}>
        <Form
          form={form}
          layout="vertical"
          initialValues={customer}
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Credit Limit"
            name="creditLimit"
            rules={[{ required: true, message: 'Please enter credit limit' }]}
          >
            <InputNumber
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Payment Terms"
            name="paymentTerms"
            rules={[{ required: true, message: 'Please select payment terms' }]}
          >
            <Select>
              <Option value="NET30">Net 30</Option>
              <Option value="NET60">Net 60</Option>
              <Option value="NET90">Net 90</Option>
            </Select>
          </Form.Item>

          <Title level={5}>Billing Address</Title>

          <Form.Item
            label="Street Address"
            name={['billingAddress', 'street']}
            rules={[{ required: true, message: 'Please enter street address' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="City"
            name={['billingAddress', 'city']}
            rules={[{ required: true, message: 'Please enter city' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="State/Province"
            name={['billingAddress', 'state']}
            rules={[{ required: true, message: 'Please enter state' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="ZIP/Postal Code"
            name={['billingAddress', 'zipCode']}
            rules={[{ required: true, message: 'Please enter ZIP code' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Country"
            name={['billingAddress', 'country']}
            rules={[{ required: true, message: 'Please enter country' }]}
          >
            <Select>
              <Option value="US">United States</Option>
              <Option value="CA">Canada</Option>
              <Option value="MX">Mexico</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title={<Title level={4}>Payment Methods</Title>}>
        <Button type="primary" icon={<CreditCardOutlined />}>
          Add Payment Method
        </Button>
      </Card>
    </Space>
  );
};

export default PaymentDetails;
