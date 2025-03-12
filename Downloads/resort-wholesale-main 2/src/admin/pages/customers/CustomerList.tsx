import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Space,
  Typography,
  message,
  Dropdown,
  Empty,
} from 'antd';
import {
  FilterOutlined,
  MoreOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../api/api';

const { Title } = Typography;
const { Search } = Input;

interface BusinessCustomer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  registrationDate: string;
  lastOrderDate: string | null;
  totalOrders: number;
}

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<BusinessCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pageSize: 10,
    current: 1,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.customers.list();
      if (response && response.data) {
        setCustomers(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers. Please try again later.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (customerId: string, newStatus: string) => {
    try {
      await api.customers.update(customerId, { status: newStatus });
      message.success('Customer status updated successfully');
      fetchCustomers();
    } catch (error) {
      message.error('Failed to update customer status');
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'gold', icon: <ClockCircleOutlined /> },
      VERIFIED: { color: 'green', icon: <CheckCircleOutlined /> },
      REJECTED: { color: 'red', icon: <StopOutlined /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Tag color={config.color} icon={config.icon}>
        {status}
      </Tag>
    );
  };

  const actionMenu = (record: BusinessCustomer): MenuProps => ({
    items: [
      {
        key: '1',
        label: 'View Details',
        icon: <UserOutlined />,
        onClick: () => navigate(`/admin/customers/${record.id}`),
      },
      {
        key: '2',
        label: 'Change Status',
        icon: <FilterOutlined />,
        children: [
          {
            key: '2-1',
            label: 'Verify',
            onClick: () => handleStatusChange(record.id, 'VERIFIED'),
          },
          {
            key: '2-2',
            label: 'Reject',
            onClick: () => handleStatusChange(record.id, 'REJECTED'),
          },
        ],
      },
    ],
  });

  const columns: ColumnsType<BusinessCustomer> = [
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      sorter: (a, b) => a.companyName.localeCompare(b.companyName),
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactName',
      key: 'contactName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: 'Pending', value: 'PENDING' },
        { text: 'Verified', value: 'VERIFIED' },
        { text: 'Rejected', value: 'REJECTED' },
      ],
      onFilter: (value: any, record: BusinessCustomer) => record.status === value,
    },
    {
      title: 'Registration Date',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime(),
    },
    {
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: (a, b) => a.totalOrders - b.totalOrders,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BusinessCustomer) => (
        <Dropdown menu={actionMenu(record)} trigger={['click']}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredCustomers = customers?.filter(customer => {
    const searchLower = searchText.toLowerCase();
    return (
      customer.companyName.toLowerCase().includes(searchLower) ||
      customer.contactName.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
    fetchCustomers();
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Business Customers</Title>
          <Space>
            <Search
              placeholder="Search customers..."
              allowClear
              onSearch={value => setSearchText(value)}
              style={{ width: 300 }}
            />
            <Button
              type="primary"
              onClick={() => navigate('/admin/customers/verification')}
            >
              Verification Queue
            </Button>
          </Space>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          locale={{
            emptyText: <Empty description="No customers found" />
          }}
        />
      </Space>
    </Card>
  );
};

export default CustomerList;
