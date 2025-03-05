import React from 'react';
import { Form, Input, Button, Card, Space, Typography, Select } from 'antd';
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
