import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, Spin, Alert, Divider, List, Button, Result, Typography } from 'antd';
import { CheckCircleOutlined, PrinterOutlined, ShoppingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { formatPrice } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    description?: string;
  };
  variantId?: string;
  variant?: {
    id: string;
    attributes: Record<string, string>;
  };
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  orderItems: OrderItem[];
}

const OrderConfirmation: React.FC = () => {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      
      try {
        // If we have a session ID from Stripe, first verify it
        if (sessionId) {
          const sessionResponse = await axios.get(`${API_BASE_URL}/checkout/session-status?session_id=${sessionId}`, {
            withCredentials: true
          });
          
          if (sessionResponse.data.status === 'success') {
            // If verification successful, fetch the order details
            const orderId = sessionResponse.data.data?.orderId;
            
            if (!orderId) {
              throw new Error('No order ID found in session');
            }
            
            const orderResponse = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
              withCredentials: true
            });
            
            if (orderResponse.data.status === 'success' && orderResponse.data.data) {
              // Handle new format - look for item property first
              if (orderResponse.data.data.item) {
                setOrder(orderResponse.data.data.item);
              } else {
                // Fall back to direct data object
                setOrder(orderResponse.data.data);
              }
            } else if (orderResponse.data && !orderResponse.data.status) {
              // Handle legacy format
              setOrder(orderResponse.data);
            } else {
              throw new Error('Invalid order response format');
            }
          } else {
            throw new Error(sessionResponse.data.message || 'Invalid session');
          }
        } 
        // If we have an order number directly from the URL
        else if (orderNumber) {
          const orderResponse = await axios.get(`${API_BASE_URL}/orders/by-number/${orderNumber}`, {
            withCredentials: true
          });
          
          if (orderResponse.data.status === 'success' && orderResponse.data.data) {
            // Handle new format - look for item property first
            if (orderResponse.data.data.item) {
              setOrder(orderResponse.data.data.item);
            } else {
              // Fall back to direct data object
              setOrder(orderResponse.data.data);
            }
          } else if (orderResponse.data && !orderResponse.data.status) {
            // Handle legacy format
            setOrder(orderResponse.data);
          } else {
            throw new Error('Invalid order response format');
          }
        } else {
          throw new Error('No order number or session ID provided');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrder();
  }, [orderNumber, sessionId]);
  
  const handlePrintOrder = () => {
    window.print();
  };
  
  const handleContinueShopping = () => {
    navigate('/products');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spin size="large" tip="Loading order details..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto mt-8 px-4">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
        <div className="mt-6 flex justify-center">
          <Button type="primary" icon={<ShoppingOutlined />} onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container mx-auto mt-8 px-4">
        <Alert
          message="Order Not Found"
          description="We couldn't find the order details. Please check your order number or contact customer support."
          type="warning"
          showIcon
        />
        <div className="mt-6 flex justify-center">
          <Button type="primary" icon={<ShoppingOutlined />} onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }
  
  // Format payment method for display
  const formattedPaymentMethod = order.paymentMethod
    ? order.paymentMethod.replace('_', ' ').toUpperCase()
    : 'N/A';
  
  return (
    <div className="container mx-auto mt-8 px-4 mb-12 print:mb-0">
      <Result
        status="success"
        title="Order Successfully Placed!"
        subTitle={`Order ${order.orderNumber || order.id} has been received and is being processed.`}
        extra={
          <>
            <div className="hidden print:block">
              <Text strong>Order Date:</Text> {new Date(order.createdAt).toLocaleDateString()}
            </div>
            <div className="flex gap-4 justify-center print:hidden">
              <Button 
                type="primary" 
                icon={<PrinterOutlined />} 
                onClick={handlePrintOrder}
              >
                Print Order
              </Button>
              <Button 
                icon={<ShoppingOutlined />} 
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card title="Order Information" className="mb-6 md:mb-0">
          <div className="mb-4">
            <Text strong>Order Number:</Text> {order.orderNumber || order.id}
          </div>
          <div className="mb-4">
            <Text strong>Order Date:</Text> {new Date(order.createdAt).toLocaleDateString()}
          </div>
          <div className="mb-4">
            <Text strong>Order Status:</Text> {order.status}
          </div>
          <div className="mb-4">
            <Text strong>Payment Method:</Text> {formattedPaymentMethod}
          </div>
          <div>
            <Text strong>Payment Status:</Text> {order.paymentStatus}
          </div>
        </Card>
        
        <Card title="Order Summary">
          <div className="mb-4">
            <Text strong>Subtotal:</Text> ${formatPrice(order.subtotal)}
          </div>
          <div className="mb-4">
            <Text strong>Tax:</Text> ${formatPrice(order.tax)}
          </div>
          <div className="mb-4">
            <Text strong>Shipping:</Text> ${formatPrice(order.shipping)}
          </div>
          <Divider className="my-2" />
          <div>
            <Text strong>Total:</Text> <Text strong className="text-lg text-green-600">${formatPrice(order.total)}</Text>
          </div>
        </Card>
      </div>
      
      <Card title="Order Items" className="mt-6">
        <List
          dataSource={order.orderItems}
          renderItem={item => (
            <List.Item key={item.id}>
              <div className="w-full grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-3">
                  <Text strong>{item.product.name}</Text>
                  {item.variant && (
                    <div className="text-gray-500 text-sm">
                      Variant: {Object.entries(item.variant.attributes)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </div>
                  )}
                  <div className="text-gray-500 text-sm">SKU: {item.product.sku}</div>
                </div>
                <div className="md:col-span-1 text-center">
                  <div className="md:hidden inline-block mr-2">Quantity:</div>
                  {item.quantity}
                </div>
                <div className="md:col-span-1 text-center">
                  <div className="md:hidden inline-block mr-2">Price:</div>
                  ${formatPrice(item.price)}
                </div>
                <div className="md:col-span-1 text-right">
                  <div className="md:hidden inline-block mr-2">Total:</div>
                  ${formatPrice(item.total)}
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
      
      <div className="mt-6 print:hidden flex justify-center gap-4">
        <Button 
          type="primary" 
          icon={<PrinterOutlined />} 
          onClick={handlePrintOrder}
        >
          Print Order
        </Button>
        <Button 
          icon={<ShoppingOutlined />} 
          onClick={handleContinueShopping}
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
};

export default OrderConfirmation;
