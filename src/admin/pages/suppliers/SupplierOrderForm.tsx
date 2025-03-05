import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Space,
  Table,
  InputNumber,
  Typography,
  message,
  Descriptions,
  Select,
  Spin,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../utils/api';
import dayjs from 'dayjs';

const { Title } = Typography;

interface SupplierOrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const SupplierOrderForm: React.FC = () => {
  const { supplierId, orderId } = useParams<{ supplierId: string; orderId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [orderItems, setOrderItems] = useState<SupplierOrderItem[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchSupplier();
    if (orderId) {
      fetchOrder();
    }
  }, [supplierId, orderId]);

  useEffect(() => {
    const values = form.getFieldValue('items');
    if (values && Array.isArray(values) && values.length > 0) {
      const updatedItems = updateItemTotals(values);
      setOrderItems(updatedItems);
    }
  }, [form.getFieldValue('items')]);

  const fetchSupplier = async () => {
    try {
      const response = await api.get(`/suppliers/${supplierId}`);
      setSupplier(response.data);
    } catch (error) {
      console.error('Failed to fetch supplier:', error);
      message.error('Failed to fetch supplier details');
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/suppliers/${supplierId}/orders/${orderId}`);
      const order = response.data;
      
      // Ensure items have proper numeric values
      const processedItems = order.items.map((item: any) => ({
        ...item,
        quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0,
        totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : parseFloat(item.totalPrice) || 0,
      }));
      
      form.setFieldsValue({
        ...order,
        expectedDeliveryDate: order.expectedDeliveryDate ? dayjs(order.expectedDeliveryDate) : undefined,
        deliveredDate: order.deliveredDate ? dayjs(order.deliveredDate) : undefined,
        items: processedItems,
      });
      
      setOrderItems(processedItems);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      message.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Ensure items have proper numeric values and calculate totals
      const processedItems = updateItemTotals(values.items);
      const totalAmount = calculateTotal(processedItems);
      
      const data = {
        ...values,
        items: processedItems,
        expectedDeliveryDate: values.expectedDeliveryDate?.toISOString(),
        deliveredDate: values.deliveredDate?.toISOString(),
        totalAmount: totalAmount,
      };

      console.log('Submitting order with data:', data);

      if (orderId) {
        await api.put(`/suppliers/${supplierId}/orders/${orderId}`, data);
        message.success('Order updated successfully');
      } else {
        await api.post(`/suppliers/${supplierId}/orders`, data);
        message.success('Order created successfully');
      }

      startTransition(() => {
        navigate(`/admin/suppliers`);
      });
    } catch (error) {
      console.error('Failed to save order:', error);
      message.error('Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (items: SupplierOrderItem[]) => {
    if (!items || !Array.isArray(items)) return 0;
    const total = items.reduce((sum, item) => {
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
      return sum + (quantity * unitPrice);
    }, 0);
    
    // Round to 2 decimal places to ensure consistency
    return Math.round(total * 100) / 100;
  };

  const updateItemTotals = (items: any[]) => {
    if (!items || !Array.isArray(items)) return [];
    const updatedItems = items.map(item => {
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
      const totalPrice = Math.round(quantity * unitPrice * 100) / 100; // Round to 2 decimal places
      
      return {
        ...item,
        quantity,
        unitPrice,
        totalPrice,
      };
    });
    
    // Update the orderItems state
    setOrderItems(updatedItems);
    
    return updatedItems;
  };

  const itemColumns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => quantity || 0,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number) => {
        return typeof price === 'number' ? `$${price.toFixed(2)}` : '$0.00';
      },
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => {
        return typeof price === 'number' ? `$${price.toFixed(2)}` : '$0.00';
      },
    },
  ];

  return (
    <Card>
      <Title level={2}>{orderId ? 'Edit Order' : 'Create New Order'}</Title>
      
      {supplier && (
        <Descriptions title="Supplier Information" bordered className="mb-6">
          <Descriptions.Item label="Name">{supplier.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{supplier.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{supplier.phone}</Descriptions.Item>
        </Descriptions>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'PENDING',
          items: [],
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="expectedDeliveryDate"
            label="Expected Delivery Date"
            rules={[{ required: true, message: 'Please select expected delivery date' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          {orderId && (
            <>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select>
                  <Select.Option value="PENDING">Pending</Select.Option>
                  <Select.Option value="CONFIRMED">Confirmed</Select.Option>
                  <Select.Option value="SHIPPED">Shipped</Select.Option>
                  <Select.Option value="DELIVERED">Delivered</Select.Option>
                  <Select.Option value="CANCELLED">Cancelled</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="deliveredDate"
                label="Delivered Date"
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="notes"
            label="Notes"
            className="md:col-span-2"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </div>

        <Form.List
          name="items"
          rules={[
            {
              validator: async (_, items) => {
                if (!items || items.length === 0) {
                  return Promise.reject(new Error('At least one item is required'));
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'productName']}
                    rules={[{ required: true, message: 'Missing product name' }]}
                  >
                    <Input placeholder="Product Name" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    rules={[{ required: true, message: 'Missing quantity' }]}
                  >
                    <InputNumber
                      min={1}
                      placeholder="Quantity"
                      onChange={() => {
                        const items = form.getFieldValue('items');
                        form.setFieldsValue({ items: updateItemTotals(items) });
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'unitPrice']}
                    rules={[{ required: true, message: 'Missing unit price' }]}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      placeholder="Unit Price"
                      onChange={() => {
                        const items = form.getFieldValue('items');
                        form.setFieldsValue({ items: updateItemTotals(items) });
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'notes']}
                  >
                    <Input placeholder="Notes" />
                  </Form.Item>

                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Item
                </Button>
              </Form.Item>

              <Form.ErrorList errors={errors} />
            </>
          )}
        </Form.List>

        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <Typography.Title level={4}>Order Summary</Typography.Title>
            <Typography.Title level={4}>
              Total: ${calculateTotal(orderItems).toFixed(2)}
            </Typography.Title>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button type="primary" htmlType="submit" loading={loading || isPending}>
            Save Order
          </Button>
          <Button onClick={() => startTransition(() => navigate(`/admin/suppliers`))} style={{ marginLeft: 8 }} disabled={isPending}>
            Cancel
          </Button>
          {isPending && <Spin size="small" style={{ marginLeft: 8 }} />}
        </div>
      </Form>
    </Card>
  );
};

export default SupplierOrderForm;
