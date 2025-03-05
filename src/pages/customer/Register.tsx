import React from 'react';
import { Form, Input, Select, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuthStore } from '../../stores/customerAuth';

const { Item } = Form;

const businessTypes = [
  'Wholesale',
  'Retail',
  'Distribution',
  'Manufacturing',
  'Import/Export',
  'Other',
];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useCustomerAuthStore();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      await register(values);
      message.success('Registration successful! Please check your email for verification.');
    } catch (error: any) {
      message.error(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          Business Account Registration
        </h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark="optional"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Item
              name="companyName"
              label="Company Name"
              rules={[{ required: true, message: 'Please enter company name' }]}
            >
              <Input size="large" />
            </Item>

            <Item
              name="contactName"
              label="Contact Name"
              rules={[{ required: true, message: 'Please enter contact name' }]}
            >
              <Input size="large" />
            </Item>

            <Item
              name="email"
              label="Business Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input size="large" />
            </Item>

            <Item
              name="phone"
              label="Phone Number"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input size="large" />
            </Item>

            <Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password size="large" />
            </Item>

            <Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Passwords do not match');
                  },
                }),
              ]}
            >
              <Input.Password size="large" />
            </Item>

            <Item
              name="businessType"
              label="Business Type"
              rules={[{ required: true, message: 'Please select business type' }]}
            >
              <Select size="large">
                {businessTypes.map((type) => (
                  <Select.Option key={type} value={type}>
                    {type}
                  </Select.Option>
                ))}
              </Select>
            </Item>

            <Item
              name="taxId"
              label="Tax ID / Business Registration Number"
              rules={[{ required: true, message: 'Please enter tax ID' }]}
            >
              <Input size="large" />
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
                <Input size="large" />
              </Item>

              <Item
                name={['address', 'city']}
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input size="large" />
              </Item>

              <Item
                name={['address', 'state']}
                label="State/Province"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input size="large" />
              </Item>

              <Item
                name={['address', 'zipCode']}
                label="ZIP/Postal Code"
                rules={[{ required: true, message: 'Please enter ZIP code' }]}
              >
                <Input size="large" />
              </Item>

              <Item
                name={['address', 'country']}
                label="Country"
                rules={[{ required: true, message: 'Please enter country' }]}
              >
                <Input size="large" />
              </Item>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button type="link" onClick={() => navigate('/login')}>
              Already have an account? Login
            </Button>
            <Button type="primary" htmlType="submit" size="large">
              Register
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
