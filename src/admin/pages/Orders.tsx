import { useState, useEffect } from 'react';
import { Button, Table, Tag, Modal, Input, Select, DatePicker, message } from 'antd';
import { EyeOutlined, SearchOutlined, FilterOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { formatPrice } from '../../utils/formatters';
import axios from 'axios';
import type { FilterValue, TablePaginationConfig } from 'antd/es/table/interface';
import type { TableCurrentDataSource } from 'antd/es/table/interface';
import type { SorterResult } from 'antd/es/table/interface';
import type { ColumnType } from 'antd/es/table';
import type { Key } from 'react';

const { Option } = Select;
const { RangePicker } = DatePicker;

// Order status color mapping
const statusColors: Record<string, string> = {
  PENDING: 'orange',
  PROCESSING: 'blue',
  SHIPPED: 'cyan',
  DELIVERED: 'green',
  CANCELLED: 'red',
  RETURNED: 'purple'
};

// Payment status color mapping
const paymentStatusColors: Record<string, string> = {
  PENDING: 'orange',
  PAID: 'green',
  FAILED: 'red',
  REFUNDED: 'purple'
};

// Define our order type
interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  variantId: string | null;
  variant: any;
  quantity: number;
  price: number;
  total: number;
}

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface ShippingAddress {
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: Customer;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress: ShippingAddress | string;
  orderItems: OrderItem[];
}

interface FilterValues {
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  dateRange?: [Dayjs | null, Dayjs | null];
}

export default function Orders() {
  const auth = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<FilterValues>({
    status: undefined,
    paymentMethod: undefined,
    paymentStatus: undefined,
    dateRange: undefined,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch orders from the API
  const fetchOrders = async (page = 1, pageSize = 10, filters: FilterValues = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (searchText) params.append('search', searchText);

      if (filters.dateRange && filters.dateRange.length === 2) {
        const [startDate, endDate] = filters.dateRange;
        if (startDate) params.append('startDate', startDate.format('YYYY-MM-DD'));
        if (endDate) params.append('endDate', endDate.format('YYYY-MM-DD'));
      }

      const token = localStorage.getItem('authToken');

      const response = await axios.get(`${API_BASE_URL}/admin/orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status !== 'success') {
        throw new Error('Failed to fetch orders');
      }

      const data = response.data.data;

      // Handle the response data according to our standard API format
      if (data.items) {
        // Paginated collection
        setOrders(data.items);
        setPagination({
          ...pagination,
          current: page,
          total: data.total || 0
        });
      } else if (Array.isArray(data)) {
        // Direct array
        setOrders(data);
        setPagination({
          ...pagination,
          current: page,
          total: data.length
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Load orders on mount and when filters change
  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize, filters);
  }, [filters]);

  // Handle view order details
  const viewOrder = (order: Order) => {
    setCurrentOrder(order);
    setModalVisible(true);
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await axios.put(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status !== 'success') {
        throw new Error('Failed to update order status');
      }

      message.success('Order status updated successfully');

      // Update the order in the local state
      setOrders(orders.map((order: Order) => {
        if (order.id === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      }));

      // Update current order if open in modal
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder({ ...currentOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      message.error('Failed to update order status');
    }
  };

  // Update payment status
  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await axios.put(`${API_BASE_URL}/admin/orders/${orderId}/payment-status`, {
        paymentStatus: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status !== 'success') {
        throw new Error('Failed to update payment status');
      }

      message.success('Payment status updated successfully');

      // Update the order in the local state
      setOrders(orders.map((order: Order) => {
        if (order.id === orderId) {
          return { ...order, paymentStatus: newStatus };
        }
        return order;
      }));

      // Update current order if open in modal
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder({ ...currentOrder, paymentStatus: newStatus });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      message.error('Failed to update payment status');
    }
  };

  // Handle search and filters
  const handleSearch = () => {
    fetchOrders(1, pagination.pageSize, filters);
  };

  const handleReset = () => {
    setSearchText('');
    setFilters({
      status: undefined,
      paymentMethod: undefined,
      paymentStatus: undefined,
      dateRange: undefined,
    });
    fetchOrders(1, pagination.pageSize, {});
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Order> | SorterResult<Order>[],
    extra: TableCurrentDataSource<Order>
  ) => {
    const { current, pageSize } = pagination;
    setPagination({ current: current || 1, pageSize: pageSize || 10 });
    fetchOrders(current || 1, pageSize || 10);
  };

  // Handle date range change
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setFilters(prev => ({ ...prev, dateRange: dates || undefined }));
  };

  // Table columns
  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="font-mono text-xs">{id}</span>,
      width: 220,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer: Customer) => customer ? `${customer.firstName} ${customer.lastName}` : 'N/A',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM D, YYYY h:mm A'),
      sorter: (a: Order, b: Order) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `$${formatPrice(total)}`,
      sorter: (a: Order, b: Order) => a.total - b.total,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Pending', value: 'PENDING' },
        { text: 'Processing', value: 'PROCESSING' },
        { text: 'Shipped', value: 'SHIPPED' },
        { text: 'Delivered', value: 'DELIVERED' },
        { text: 'Cancelled', value: 'CANCELLED' },
        { text: 'Returned', value: 'RETURNED' },
      ],
      onFilter: (value: Key | boolean, record: Order) => 
        record.status === (value as string),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => method?.replace('_', ' ').toUpperCase() || 'N/A',
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <Tag color={paymentStatusColors[status] || 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Order) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />} 
          onClick={() => viewOrder(record)}
        >
          View
        </Button>
      ),
    },
  ] as ColumnType<Order>[];

  // Helper function to safely access shipping address fields
  const getAddressField = (address: any, field: string): string => {
    if (!address) return '';
    if (typeof address === 'string') {
      try {
        const parsed = JSON.parse(address);
        return parsed[field] || '';
      } catch (e) {
        return '';
      }
    }
    return address[field] || '';
  };

  return (
    <div>
      <div className="sm:flex sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage all customer orders.
          </p>
        </div>
        <Button
          type="primary"
          icon={<SyncOutlined />}
          onClick={() => fetchOrders(pagination.current, pagination.pageSize, filters)}
        >
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-md shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by ID or customer name"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </div>

          <Select
            placeholder="Status"
            style={{ minWidth: 120 }}
            value={filters.status}
            onChange={value => setFilters({ ...filters, status: value })}
            allowClear
          >
            <Option value="PENDING">Pending</Option>
            <Option value="PROCESSING">Processing</Option>
            <Option value="SHIPPED">Shipped</Option>
            <Option value="DELIVERED">Delivered</Option>
            <Option value="CANCELLED">Cancelled</Option>
            <Option value="RETURNED">Returned</Option>
          </Select>

          <Select
            placeholder="Payment Method"
            style={{ minWidth: 150 }}
            value={filters.paymentMethod}
            onChange={value => setFilters({ ...filters, paymentMethod: value })}
            allowClear
          >
            <Option value="credit_card">Credit Card</Option>
            <Option value="invoice">Invoice</Option>
            <Option value="purchase_order">Purchase Order</Option>
          </Select>

          <Select
            placeholder="Payment Status"
            style={{ minWidth: 150 }}
            value={filters.paymentStatus}
            onChange={value => setFilters({ ...filters, paymentStatus: value })}
            allowClear
          >
            <Option value="PENDING">Pending</Option>
            <Option value="PAID">Paid</Option>
            <Option value="FAILED">Failed</Option>
            <Option value="REFUNDED">Refunded</Option>
          </Select>

          <RangePicker
            value={filters.dateRange}
            onChange={handleDateRangeChange}
          />

          <Button type="primary" icon={<FilterOutlined />} onClick={handleSearch}>
            Filter
          </Button>

          <Button onClick={handleReset}>Reset</Button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="mt-4 flow-root">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            className="shadow-sm rounded-md"
          />
        </div>
      </div>

      {/* Order Details Modal */}
      <Modal
        title={`Order Details - #${currentOrder?.id}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium">Customer Information</h3>
                <p className="mt-2">
                  <strong>Name:</strong> {currentOrder.customer ? `${currentOrder.customer.firstName} ${currentOrder.customer.lastName}` : 'N/A'}<br />
                  <strong>Email:</strong> {currentOrder.customer?.email || 'N/A'}<br />
                  <strong>Phone:</strong> {currentOrder.customer?.phone || 'N/A'}<br />
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium">Order Information</h3>
                <p className="mt-2">
                  <strong>Date:</strong> {dayjs(currentOrder.createdAt).format('MMM D, YYYY h:mm A')}<br />
                  <strong>Status:</strong> 
                  <Select
                    value={currentOrder.status}
                    style={{ width: 130, marginLeft: 8 }}
                    onChange={value => updateOrderStatus(currentOrder.id, value)}
                  >
                    <Option value="PENDING">Pending</Option>
                    <Option value="PROCESSING">Processing</Option>
                    <Option value="SHIPPED">Shipped</Option>
                    <Option value="DELIVERED">Delivered</Option>
                    <Option value="CANCELLED">Cancelled</Option>
                    <Option value="RETURNED">Returned</Option>
                  </Select>
                  <br />
                  <strong>Payment Method:</strong> {currentOrder.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}<br />
                  <strong>Payment Status:</strong> 
                  <Select
                    value={currentOrder.paymentStatus}
                    style={{ width: 130, marginLeft: 8 }}
                    onChange={value => updatePaymentStatus(currentOrder.id, value)}
                  >
                    <Option value="PENDING">Pending</Option>
                    <Option value="PAID">Paid</Option>
                    <Option value="FAILED">Failed</Option>
                    <Option value="REFUNDED">Refunded</Option>
                  </Select>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Shipping Address</h3>
              <p className="mt-2">
                {currentOrder.shippingAddress && (
                  <>
                    {getAddressField(currentOrder.shippingAddress, 'fullName')}<br />
                    {getAddressField(currentOrder.shippingAddress, 'addressLine1')}<br />
                    {getAddressField(currentOrder.shippingAddress, 'addressLine2') && (
                      <>
                        {getAddressField(currentOrder.shippingAddress, 'addressLine2')}<br />
                      </>
                    )}
                    {getAddressField(currentOrder.shippingAddress, 'city')}, {getAddressField(currentOrder.shippingAddress, 'state')} {getAddressField(currentOrder.shippingAddress, 'zipCode')}<br />
                    {getAddressField(currentOrder.shippingAddress, 'country')}
                  </>
                )}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium">Order Items</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Product</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Variant</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Price</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentOrder.orderItems?.map((item: OrderItem) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                          {item.product?.name || 'Unknown Product'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.variant ? JSON.stringify(item.variant.attributes) : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${formatPrice(item.price)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                          ${formatPrice(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="pt-4 pr-3 text-sm font-medium text-right text-gray-900">Subtotal</td>
                      <td className="pt-4 px-3 text-sm text-right text-gray-900">${formatPrice(currentOrder.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-1 pr-3 text-sm font-medium text-right text-gray-900">Tax</td>
                      <td className="py-1 px-3 text-sm text-right text-gray-900">${formatPrice(currentOrder.tax)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-1 pr-3 text-sm font-medium text-right text-gray-900">Shipping</td>
                      <td className="py-1 px-3 text-sm text-right text-gray-900">${formatPrice(currentOrder.shipping)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="pt-4 pr-3 text-base font-semibold text-right text-gray-900">Total</td>
                      <td className="pt-4 px-3 text-base font-semibold text-right text-gray-900">${formatPrice(currentOrder.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {currentOrder.notes && (
              <div>
                <h3 className="text-lg font-medium">Notes</h3>
                <p className="mt-2 text-gray-700">{currentOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
