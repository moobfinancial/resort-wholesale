import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Typography,
  DatePicker,
  Input,
  message,
  Select,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  createdAt: string;
  items: number;
}

const { Title } = Typography;
const { RangePicker } = DatePicker;

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      message.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'gold', text: 'Pending' },
      PROCESSING: { color: 'blue', text: 'Processing' },
      SHIPPED: { color: 'cyan', text: 'Shipped' },
      DELIVERED: { color: 'green', text: 'Delivered' },
      CANCELLED: { color: 'red', text: 'Cancelled' },
    };

    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getPaymentStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'warning', text: 'Pending' },
      PAID: { color: 'success', text: 'Paid' },
      FAILED: { color: 'error', text: 'Failed' },
    };

    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => <a onClick={() => navigate(`/admin/orders/${text}`)}>{text}</a>,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (_: any, record: Order) => (
        <Space direction="vertical" size="small">
          <span>{record.customerName}</span>
          <span className="text-gray-500 text-sm">{record.customerEmail}</span>
        </Space>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      sorter: (a: Order, b: Order) => a.items - b.items,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => `$${amount.toFixed(2)}`,
      sorter: (a: Order, b: Order) => a.total - b.total,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: 'Pending', value: 'PENDING' },
        { text: 'Processing', value: 'PROCESSING' },
        { text: 'Shipped', value: 'SHIPPED' },
        { text: 'Delivered', value: 'DELIVERED' },
        { text: 'Cancelled', value: 'CANCELLED' },
      ],
      onFilter: (value: any, record: Order) => record.status === value,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => getPaymentStatusTag(status),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: Order, b: Order) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Button
            type="primary"
            onClick={() => navigate(`/admin/orders/${record.id}`)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates) {
      setDateRange([dates[0]?.toDate() || null, dates[1]?.toDate() || null]);
    } else {
      setDateRange([null, null]);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchText.toLowerCase());

    const matchesDateRange =
      !dateRange[0] ||
      !dateRange[1] ||
      (new Date(order.createdAt) >= dateRange[0] &&
        new Date(order.createdAt) <= dateRange[1]);

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(order.status);

    return matchesSearch && matchesDateRange && matchesStatus;
  });

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Orders</Title>
          <Space>
            <RangePicker onChange={handleDateRangeChange} />
            <Select
              mode="multiple"
              placeholder="Filter by status"
              style={{ width: 200 }}
              onChange={setStatusFilter}
              allowClear
            >
              <Select.Option value="PENDING">Pending</Select.Option>
              <Select.Option value="PROCESSING">Processing</Select.Option>
              <Select.Option value="SHIPPED">Shipped</Select.Option>
              <Select.Option value="DELIVERED">Delivered</Select.Option>
              <Select.Option value="CANCELLED">Cancelled</Select.Option>
            </Select>
            <Input
              placeholder="Search orders..."
              allowClear
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredOrders.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Space>
    </Card>
  );
};

export default OrderList;
