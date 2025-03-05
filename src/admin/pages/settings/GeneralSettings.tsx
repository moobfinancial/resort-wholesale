import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  TimePicker,
  Switch,
  Space,
  message,
  Typography,
  Divider,
} from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

interface GeneralSettings {
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  businessHours: {
    start: string;
    end: string;
  };
  orderPrefix: string;
  customerPrefix: string;
  enableNotifications: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const GeneralSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/settings/general');
      const data = await response.json();
      form.setFieldsValue({
        ...data,
        businessHours: {
          start: dayjs(data.businessHours.start, 'HH:mm'),
          end: dayjs(data.businessHours.end, 'HH:mm'),
        },
      });
    } catch (error) {
      message.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const formattedValues = {
        ...values,
        businessHours: {
          start: values.businessHours.start.format('HH:mm'),
          end: values.businessHours.end.format('HH:mm'),
        },
      };

      // TODO: Replace with actual API call
      await fetch('/api/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedValues),
      });

      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card loading={loading}>
      <Title level={2}>General Settings</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          enableNotifications: true,
          maintenanceMode: false,
        }}
      >
        <Title level={4}>Company Information</Title>
        <Form.Item
          name="companyName"
          label="Company Name"
          rules={[{ required: true, message: 'Please enter company name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="supportEmail"
          label="Support Email"
          rules={[
            { required: true, message: 'Please enter support email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="supportPhone"
          label="Support Phone"
          rules={[{ required: true, message: 'Please enter support phone' }]}
        >
          <Input />
        </Form.Item>

        <Divider />

        <Title level={4}>Regional Settings</Title>
        <Form.Item
          name="timezone"
          label="Timezone"
          rules={[{ required: true, message: 'Please select timezone' }]}
        >
          <Select
            showSearch
            options={[
              { value: 'America/New_York', label: 'Eastern Time (ET)' },
              { value: 'America/Chicago', label: 'Central Time (CT)' },
              { value: 'America/Denver', label: 'Mountain Time (MT)' },
              { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
            ]}
          />
        </Form.Item>

        <Form.Item label="Business Hours" style={{ marginBottom: 0 }}>
          <Space>
            <Form.Item
              name={['businessHours', 'start']}
              rules={[{ required: true, message: 'Please select start time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <span>to</span>
            <Form.Item
              name={['businessHours', 'end']}
              rules={[{ required: true, message: 'Please select end time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
          </Space>
        </Form.Item>

        <Divider />

        <Title level={4}>System Settings</Title>
        <Form.Item
          name="orderPrefix"
          label="Order Number Prefix"
          rules={[{ required: true, message: 'Please enter order prefix' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="customerPrefix"
          label="Customer ID Prefix"
          rules={[{ required: true, message: 'Please enter customer prefix' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="enableNotifications"
          label="Enable Notifications"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="maintenanceMode"
          label="Maintenance Mode"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) =>
            prev.maintenanceMode !== curr.maintenanceMode
          }
        >
          {({ getFieldValue }) =>
            getFieldValue('maintenanceMode') ? (
              <Form.Item
                name="maintenanceMessage"
                label="Maintenance Message"
                rules={[
                  {
                    required: true,
                    message: 'Please enter maintenance message',
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default GeneralSettings;
