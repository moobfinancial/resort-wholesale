import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { useCustomerAuthStore } from '../../stores/customerAuth';

const { Title } = Typography;
const { Item } = Form;

interface FormValues {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  taxId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const CustomerProfile: React.FC = () => {
  const { user, updateProfile } = useCustomerAuthStore();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
    }
  }, [user, form]);

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      await updateProfile(values);
      message.success('Profile updated successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <Title level={2}>Business Profile</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Item
              name="companyName"
              label="Company Name"
              rules={[{ required: true, message: 'Please enter company name' }]}
            >
              <Input />
            </Item>

            <Item
              name="contactName"
              label="Contact Name"
              rules={[{ required: true, message: 'Please enter contact name' }]}
            >
              <Input />
            </Item>

            <Item
              name="email"
              label="Business Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input disabled />
            </Item>

            <Item
              name="phone"
              label="Phone Number"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input />
            </Item>

            <Item
              name="businessType"
              label="Business Type"
              rules={[{ required: true, message: 'Please enter business type' }]}
            >
              <Input disabled />
            </Item>

            <Item
              name="taxId"
              label="Tax ID"
              rules={[{ required: true, message: 'Please enter tax ID' }]}
            >
              <Input disabled />
            </Item>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Item
                name={['address', 'street']}
                label="Street Address"
                rules={[{ required: true, message: 'Please enter street address' }]}
              >
                <Input />
              </Item>

              <Item
                name={['address', 'city']}
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input />
              </Item>

              <Item
                name={['address', 'state']}
                label="State/Province"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input />
              </Item>

              <Item
                name={['address', 'zipCode']}
                label="ZIP/Postal Code"
                rules={[{ required: true, message: 'Please enter ZIP code' }]}
              >
                <Input />
              </Item>

              <Item
                name={['address', 'country']}
                label="Country"
                rules={[{ required: true, message: 'Please enter country' }]}
              >
                <Input />
              </Item>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="primary" htmlType="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CustomerProfile;
