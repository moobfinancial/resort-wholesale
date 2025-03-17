import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Typography,
  Timeline,
  Tag,
  Tabs,
  Table,
  message,
  Modal,
  Form,
  Input,
  Select,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import UserSettings from './tabs/UserSettings';
import PaymentDetails from './tabs/PaymentDetails';
import OrderTracking from './tabs/OrderTracking';
import DocumentUpload from './tabs/DocumentUpload';

const { Title, Text } = Typography;

interface BusinessCustomer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  registrationDate: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  businessType: string;
  taxId: string;
  documents: {
    id: string;
    type: string;
    url: string;
    uploadDate: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  }[];
  creditLimit: number;
  paymentMethods?: any[];
  paymentTerms?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notificationPreferences?: string[];
  language?: string;
  timezone?: string;
}

interface Order {
  id: string;
  orderDate: string;
  total: number;
  status: string;
  items: number;
}

interface ActivityLog {
  id: string;
  action: string;
  date: string;
  user: string;
  details: string;
}

const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<BusinessCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
      fetchOrders();
      fetchActivityLog();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/business-customers/${id}`);
      const result = await response.json();
      
      if (result && result.status === 'success' && result.data) {
        // Single resources are returned under data.item property according to API standard
        if (result.data.item) {
          setCustomer(result.data.item);
        } else {
          // Fallback for legacy API format or direct data objects
          setCustomer(result.data);
        }
      } else if (result && !result.status) {
        // Direct data without the standard API wrapper
        setCustomer(result);
      } else {
        console.error('Unexpected customer data structure:', result);
        message.error('Failed to fetch customer details: Invalid data format');
        setCustomer(null);
      }
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
      message.error('Failed to fetch customer details');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/business-customers/${id}/orders`);
      const result = await response.json();
      
      if (result && result.status === 'success' && Array.isArray(result.data)) {
        setOrders(result.data);
      } else if (result && result.status === 'success' && result.data) {
        // If data is not an array but contains the data we need
        setOrders(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('Unexpected orders data structure:', result);
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      message.error('Failed to fetch orders');
      setOrders([]);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const response = await fetch(`/api/business-customers/${id}/activity`);
      const result = await response.json();
      
      if (result && result.status === 'success' && Array.isArray(result.data)) {
        setActivityLog(result.data);
      } else if (result && result.status === 'success' && result.data) {
        // If data is not an array but contains the data we need
        setActivityLog(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('Unexpected activity log data structure:', result);
        setActivityLog([]);
      }
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      message.error('Failed to fetch activity log');
      setActivityLog([]);
    }
  };

  const handleUpdateCustomer = async (values: Partial<BusinessCustomer>) => {
    try {
      // TODO: Replace with actual API call
      await fetch(`/api/business-customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Customer information updated successfully');
      setIsEditModalVisible(false);
      fetchCustomerDetails();
    } catch (error) {
      message.error('Failed to update customer information');
    }
  };

  const orderColumns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'COMPLETED' ? 'green' : 'gold'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Button
          type="link"
          onClick={() => navigate(`/admin/orders/${record.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (!customer) {
    return null;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<UserOutlined />}
            onClick={() => navigate('/admin/customers')}
          >
            Back to Customers
          </Button>
          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => setIsEditModalVisible(true)}
          >
            Edit Customer
          </Button>
        </Space>

        <Descriptions title="Customer Information" bordered>
          <Descriptions.Item label="Company Name">{customer.companyName}</Descriptions.Item>
          <Descriptions.Item label="Contact Name">{customer.contactName}</Descriptions.Item>
          <Descriptions.Item label="Email">{customer.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{customer.phone}</Descriptions.Item>
          <Descriptions.Item label="Business Type">{customer.businessType || 'Not specified'}</Descriptions.Item>
          <Descriptions.Item label="Tax ID">{customer.taxId || 'Not specified'}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={customer.status === 'VERIFIED' ? 'green' : 'gold'}>
              {customer.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Registration Date">
            {customer.registrationDate ? new Date(customer.registrationDate).toLocaleDateString() : 'Not available'}
          </Descriptions.Item>
          <Descriptions.Item label="Address" span={3}>
            {customer.address ? (
              <>
                {customer.address.street}<br />
                {customer.address.city}, {customer.address.state} {customer.address.zipCode}<br />
                {customer.address.country}
              </>
            ) : (
              'No address provided'
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs defaultActiveKey="overview">
          <Tabs.TabPane tab="Overview" key="overview">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Card title="Recent Orders">
                <Table
                  columns={orderColumns}
                  dataSource={orders}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                />
              </Card>
              <Card title="Activity Log">
                <Timeline>
                  {activityLog.map((log) => (
                    <Timeline.Item key={log.id}>
                      <p>{log.action}</p>
                      <p>{log.details}</p>
                      <small>{new Date(log.date).toLocaleString()}</small>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            </Space>
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="User Settings" key="settings">
            <UserSettings 
              customer={{
                id: customer.id,
                companyName: customer.companyName,
                contactName: customer.contactName,
                email: customer.email,
                phone: customer.phone || '',
                businessType: customer.businessType || '',
                taxId: customer.taxId || '',
                address: customer.address || {
                  street: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: ''
                },
                notificationPreferences: [],
                language: 'en',
                timezone: 'America/New_York'
              }}
              onUpdate={handleUpdateCustomer} 
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Payment Details" key="payment">
            <PaymentDetails 
              customer={{
                id: customer.id,
                paymentMethods: customer.paymentMethods || [],
                creditLimit: customer.creditLimit || 0,
                paymentTerms: customer.paymentTerms || 'Net 30',
                billingAddress: customer.address || {
                  street: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: ''
                }
              }}
              onUpdate={handleUpdateCustomer} 
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Order History" key="orders">
            <Table
              columns={orderColumns}
              dataSource={orders}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Order Tracking" key="tracking">
            <OrderTracking orders={orders} />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Documents" key="documents">
            <DocumentUpload
              customerId={customer.id}
              documents={customer.documents}
              onUpload={async (file) => {
                // Handle document upload
                message.success('Document uploaded successfully');
              }}
              onDelete={async (documentId) => {
                // Handle document deletion
                message.success('Document deleted successfully');
              }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal
        title="Edit Customer"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          initialValues={customer}
          onFinish={handleUpdateCustomer}
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
            rules={[{ required: true, message: 'Please enter email' }]}
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
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select>
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="VERIFIED">Verified</Select.Option>
              <Select.Option value="REJECTED">Rejected</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default CustomerDetails;
