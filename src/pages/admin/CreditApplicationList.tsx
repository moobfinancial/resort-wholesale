import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { 
  Badge, 
  Button, 
  Card, 
  Divider, 
  Input, 
  Select, 
  Space, 
  Table, 
  Tag, 
  Typography, 
  message 
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  SearchOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface CreditApplication {
  id: string;
  customerId: string;
  customerName: string;
  companyName: string;
  amount: number;
  term: '30' | '90' | '180';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const CreditApplicationList: React.FC = () => {
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch credit applications
  useEffect(() => {
    // In a real implementation, we would fetch from the API
    // For now, we'll use mock data
    const mockData: CreditApplication[] = [
      {
        id: '1',
        customerId: 'cust_001',
        customerName: 'John Smith',
        companyName: 'Beach Resorts Inc.',
        amount: 10000,
        term: '30',
        status: 'PENDING',
        createdAt: '2025-03-01T12:00:00Z',
      },
      {
        id: '2',
        customerId: 'cust_002',
        customerName: 'Sarah Johnson',
        companyName: 'Tropical Supplies Co.',
        amount: 25000,
        term: '90',
        status: 'APPROVED',
        createdAt: '2025-02-15T09:30:00Z',
      },
      {
        id: '3',
        customerId: 'cust_003',
        customerName: 'Michael Brown',
        companyName: 'Island Traders LLC',
        amount: 50000,
        term: '180',
        status: 'REJECTED',
        createdAt: '2025-02-10T14:45:00Z',
      },
      {
        id: '4',
        customerId: 'cust_004',
        customerName: 'Emily Davis',
        companyName: 'Coastal Retailers',
        amount: 15000,
        term: '90',
        status: 'PENDING',
        createdAt: '2025-03-03T10:15:00Z',
      },
      {
        id: '5',
        customerId: 'cust_005',
        customerName: 'Robert Wilson',
        companyName: 'Sunset Boutiques',
        amount: 30000,
        term: '180',
        status: 'APPROVED',
        createdAt: '2025-02-20T16:30:00Z',
      },
    ];

    setTimeout(() => {
      setApplications(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter(value);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Filter applications based on search text and status filter
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      searchText === '' ||
      app.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      app.companyName.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = statusFilter === null || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle approve application
  const handleApprove = async (id: string, amount: number) => {
    try {
      // In a real implementation, we would call the API
      // For now, we'll just update the local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: 'APPROVED' } : app
        )
      );

      message.success('Credit application approved successfully');
    } catch (error) {
      console.error('Error approving credit application:', error);
      message.error('Failed to approve credit application');
    }
  };

  // Handle reject application
  const handleReject = async (id: string) => {
    try {
      // In a real implementation, we would call the API
      // For now, we'll just update the local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: 'REJECTED' } : app
        )
      );

      message.success('Credit application rejected');
    } catch (error) {
      console.error('Error rejecting credit application:', error);
      message.error('Failed to reject credit application');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text: string, record: CreditApplication) => (
        <div>
          <Text strong>{text}</Text>
          <div className="text-sm text-gray-500">{record.customerName}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${amount.toLocaleString()}`,
    },
    {
      title: 'Term',
      dataIndex: 'term',
      key: 'term',
      render: (term: string) => `${term} Days`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        let icon = null;

        switch (status) {
          case 'APPROVED':
            color = 'green';
            icon = <CheckCircleOutlined />;
            break;
          case 'REJECTED':
            color = 'red';
            icon = <CloseCircleOutlined />;
            break;
          default:
            color = 'blue';
            icon = null;
        }

        return (
          <Tag color={color} icon={icon}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CreditApplication) => (
        <Space size="small">
          <Link to={`/admin/credit/applications/${record.id}`}>
            <Button type="text" icon={<EyeOutlined />}>
              View
            </Button>
          </Link>

          {record.status === 'PENDING' && (
            <>
              <Button
                type="text"
                className="text-green-600 hover:text-green-500"
                onClick={() => handleApprove(record.id, record.amount)}
              >
                Approve
              </Button>
              <Button
                type="text"
                danger
                onClick={() => handleReject(record.id)}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Credit Applications</Title>
      </div>

      <Card className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <Input
              placeholder="Search by customer or company"
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
            />
          </div>

          <div>
            <Select
              placeholder="Filter by status"
              style={{ width: 200 }}
              allowClear
              onChange={handleStatusFilterChange}
            >
              <Option value="PENDING">Pending</Option>
              <Option value="APPROVED">Approved</Option>
              <Option value="REJECTED">Rejected</Option>
            </Select>
          </div>
        </div>

        <Divider />

        <Table
          dataSource={filteredApplications}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default CreditApplicationList;
