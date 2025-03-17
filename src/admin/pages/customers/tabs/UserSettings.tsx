import React from 'react';
import { Form, Input, Button, Card, Typography, Select } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

interface UserSettingsProps {
  customer: {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    notificationPreferences: string[];
    language: string;
    timezone: string;
    businessType?: string;
    taxId?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  onUpdate: (values: any) => Promise<void>;
}

const UserSettings: React.FC<UserSettingsProps> = ({ customer, onUpdate }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      await onUpdate(values);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  return (
    <Card>
      <Title level={4}>User Settings</Title>
      <Form
        form={form}
        layout="vertical"
        initialValues={customer}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Company Name"
          name="companyName"
          rules={[{ required: true, message: 'Please enter company name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Contact Name"
          name="contactName"
          rules={[{ required: true, message: 'Please enter contact name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Phone"
          name="phone"
          rules={[{ required: true, message: 'Please enter phone number' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Business Type"
          name="businessType"
          rules={[{ required: true, message: 'Please enter business type' }]}
        >
          <Input placeholder="e.g., Gift Shop, Resort Store" />
        </Form.Item>

        <Form.Item
          label="Tax ID"
          name="taxId"
          rules={[{ required: true, message: 'Please enter tax ID' }]}
        >
          <Input placeholder="Enter tax ID number" />
        </Form.Item>

        <Form.Item
          label="Business Address"
          name={['address', 'street']}
          rules={[{ required: true, message: 'Please enter address' }]}
        >
          <Input placeholder="Street address" />
        </Form.Item>

        <Form.Item
          name={['address', 'city']}
          rules={[{ required: true, message: 'Please enter city' }]}
        >
          <Input placeholder="City" />
        </Form.Item>

        <Form.Item
          name={['address', 'state']}
          rules={[{ required: true, message: 'Please enter state/province' }]}
        >
          <Input placeholder="State/Province" />
        </Form.Item>

        <Form.Item
          name={['address', 'zipCode']}
          rules={[{ required: true, message: 'Please enter ZIP/postal code' }]}
        >
          <Input placeholder="ZIP/Postal Code" />
        </Form.Item>

        <Form.Item
          name={['address', 'country']}
          rules={[{ required: true, message: 'Please enter country' }]}
        >
          <Input placeholder="Country" />
        </Form.Item>

        <Form.Item
          label="Notification Preferences"
          name="notificationPreferences"
        >
          <Select mode="multiple">
            <Option value="email">Email</Option>
            <Option value="sms">SMS</Option>
            <Option value="push">Push Notifications</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Language"
          name="language"
        >
          <Select>
            <Option value="en">English</Option>
            <Option value="es">Spanish</Option>
            <Option value="fr">French</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Timezone"
          name="timezone"
        >
          <Select>
            <Option value="America/New_York">Eastern Time</Option>
            <Option value="America/Chicago">Central Time</Option>
            <Option value="America/Denver">Mountain Time</Option>
            <Option value="America/Los_Angeles">Pacific Time</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserSettings;
