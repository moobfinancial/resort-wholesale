import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, message } from 'antd';
import { useCustomerAuthStore } from '../../stores/customerAuth';

interface OrderItem {
  id: string;
  productId: string;
  product: {
    name: string;
  };
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

const CustomerOrders: React.FC = () => {
  const { user } = useCustomerAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/customer/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      message.error('Failed to load orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      const response = await fetch(`/api/customer/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to cancel order');
      
      message.success('Order cancelled successfully');
      fetchOrders();
    } catch (error) {
      message.error('Failed to cancel order');
      console.error('Error cancelling order:', error);
    }
  };

  const showOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string, record: Order) => (
        <Button type="link" onClick={() => showOrderDetails(record)}>
          {id}
        </Button>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'PENDING' ? 'orange' : status === 'CANCELLED' ? 'red' : 'green'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Order) => (
        record.status === 'PENDING' && (
          <Button danger onClick={() => handleCancel(record.id)}>
            Cancel Order
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">My Orders</h2>
      
      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title="Order Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Table
              dataSource={selectedOrder.items}
              columns={[
                {
                  title: 'Product',
                  dataIndex: ['product', 'name'],
                  key: 'product',
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                },
                {
                  title: 'Price',
                  dataIndex: 'price',
                  key: 'price',
                  render: (price: number) => `$${price.toFixed(2)}`,
                },
                {
                  title: 'Total',
                  dataIndex: 'total',
                  key: 'total',
                  render: (total: number) => `$${total.toFixed(2)}`,
                },
              ]}
              pagination={false}
              rowKey="id"
            />
            
            <div className="mt-4 text-right">
              <p>Subtotal: ${selectedOrder.subtotal.toFixed(2)}</p>
              <p>Tax: ${selectedOrder.tax.toFixed(2)}</p>
              <p>Shipping: ${selectedOrder.shipping.toFixed(2)}</p>
              <p className="text-lg font-semibold">
                Total: ${selectedOrder.total.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerOrders;
