import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select,
  message,
  Typography,
  Alert,
  Popconfirm,
  Upload,
  Spin,
  Tabs,
  Card,
  Tag,
  Empty
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import axiosInstance from '../../../utils/axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

// Define interfaces for our data types
interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address: Address | string;
  logo?: string;
  documents: string[];
  productCount: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
  category?: string;
  subcategory?: string;
  paymentTerms?: string;
  status?: string;
}

interface SupplierOrder {
  id: string;
  supplierId: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    productName: string;
  }>;
}

const initialAddress = {
  street: '',
  city: '',
  state: '',
  zip: '',
  country: '',
};

// Define component
const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [logoFile, setLogoFile] = useState<UploadFile[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);
  
  // Get suppliers data from API
  const fetchSuppliers = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(`/suppliers?page=${page}&limit=${pagination.pageSize}`);
      
      // The api wrapper now extracts data.data for us, so we should get the structured data directly
      if (response && response.data && response.data.items) {
        setSuppliers(response.data.items);
        setPagination({
          current: page,
          pageSize: pagination.pageSize,
          total: response.data.totalPages ? response.data.totalPages * pagination.pageSize : 0
        });
      } else if (Array.isArray(response.data)) {
        // Handle case where response is a direct array (legacy format)
        setSuppliers(response.data);
        setPagination({
          ...pagination,
          total: response.data.length
        });
      } else {
        console.error('Unexpected supplier data format:', response.data);
        setSuppliers([]);
        setPagination({
          ...pagination,
          total: 0
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch suppliers:', err);
      setError(err.message || 'Failed to load suppliers');
      
      // If we get authentication errors, save the current path for redirect after login
      if (err.response?.status === 401) {
        console.log('Saving current path for redirect:', window.location.pathname);
        sessionStorage.setItem('redirectPath', window.location.pathname);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierOrders = async (supplierId: string) => {
    setIsPending(true);
    
    try {
      const response = await axiosInstance.get(`/suppliers/${supplierId}/orders`);
      console.log('Supplier orders response:', response.data);
      
      // Follow standardized API response format
      if (response.data && response.data.status === 'success') {
        if (response.data.data) {
          if (response.data.data.items && Array.isArray(response.data.data.items)) {
            setSupplierOrders(response.data.data.items);
          } else if (Array.isArray(response.data.data)) {
            setSupplierOrders(response.data.data);
          } else if (response.data.data.item) {
            setSupplierOrders([response.data.data.item]);
          } else {
            setSupplierOrders([]);
          }
        } else {
          setSupplierOrders([]);
        }
      } else if (Array.isArray(response.data)) {
        // Legacy format
        setSupplierOrders(response.data);
      } else {
        message.warning('Unexpected format in supplier orders response');
        setSupplierOrders([]);
      }
    } catch (error) {
      console.error('Error fetching supplier orders:', error);
      message.error('Failed to load supplier orders');
      setSupplierOrders([]);
    } finally {
      setIsPending(false);
    }
  };

  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      console.error('Operation failed:', error.message);
      setError(error.message);
      message.error(error.message);
    } else {
      console.error('Operation failed:', error);
      setError('Operation failed. Please try again.');
      message.error('Operation failed. Please try again.');
    }
  };

  const handleAddEdit = async (values: any) => {
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (key !== 'documents' && key !== 'logo' && key !== 'address') {
          formData.append(key, values[key]);
        }
      });

      // Handle address as JSON
      if (values.address) {
        formData.append('address', JSON.stringify(values.address));
      }

      // Handle logo upload
      if (logoFile.length > 0 && logoFile[0].originFileObj) {
        formData.append('logo', logoFile[0].originFileObj as Blob);
      }

      // Handle document uploads
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('documents', file.originFileObj as Blob);
        }
      });

      if (editingSupplier) {
        await axiosInstance.put(`/suppliers/${editingSupplier.id}`, formData);
        message.success('Supplier updated successfully');
      } else {
        await axiosInstance.post('/suppliers', formData);
        message.success('Supplier created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setFileList([]);
      setLogoFile([]);
      fetchSuppliers();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async (supplierId: string) => {
    try {
      await axiosInstance.delete(`/suppliers/${supplierId}`);
      message.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      handleError(error);
    }
  };

  const showModal = (supplier?: any) => {
    if (supplier) {
      setEditingSupplier(supplier);
      form.setFieldsValue({
        ...supplier,
        // Handle address to make sure it's an object
        address: typeof supplier.address === 'string' 
          ? JSON.parse(supplier.address) 
          : supplier.address
      });
      
      // Handle existing documents
      setFileList(
        supplier.documents.map((doc: string, index: number) => ({
          uid: `-${index}`,
          name: doc.split('/').pop() || doc,
          status: 'done',
          url: doc,
        }))
      );
      
      // Handle existing logo
      if (supplier.logo) {
        setLogoFile([
          {
            uid: '-1',
            name: supplier.logo.split('/').pop() || supplier.logo,
            status: 'done',
            url: supplier.logo,
          },
        ]);
      } else {
        setLogoFile([]);
      }
    } else {
      setEditingSupplier(null);
      form.resetFields();
      setFileList([]);
      setLogoFile([]);
    }
    setModalVisible(true);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    console.log('Viewing supplier details:', supplier.id);
    setSelectedSupplier(supplier);
    fetchSupplierOrders(supplier.id);
    setOrderModalVisible(true);
  };

  const handleCreateOrder = (supplierId: string) => {
    navigate(`/admin/suppliers/${supplierId}/orders/new`);
  };

  const columns: ColumnsType<Supplier> = [
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      width: 80,
      render: (logo: string) => (
        logo ? <img src={logo} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} /> : '-'
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text: string, supplier: Supplier) => (
        <div>
          <div className="font-medium">
            <a onClick={() => handleViewSupplier(supplier)}>{text}</a>
          </div>
          <div className="text-xs text-gray-500">{supplier.email}</div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, supplier: Supplier) => (
        <Space direction="vertical" size="small">
          {supplier.phone && (
            <div>
              <PhoneOutlined className="mr-1 text-gray-500" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.email && (
            <div>
              <MailOutlined className="mr-1 text-gray-500" />
              <span>{supplier.email}</span>
            </div>
          )}
          {supplier.website && (
            <div>
              <GlobalOutlined className="mr-1 text-gray-500" />
              <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                {supplier.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'active',
      render: () => (
        <Tag color="green">ACTIVE</Tag>
      ),
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 100,
      render: (_: any, record: Supplier) => (
        <span>{record.productCount || 0}</span>
      )
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 100,
      render: (_: any, record: Supplier) => (
        <span>{record.orderCount || 0}</span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: Supplier) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    },
  ];

  const orderColumns: ColumnsType<SupplierOrder> = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'DELIVERED' ? 'success' :
          status === 'PENDING' ? 'processing' :
          status === 'SHIPPED' ? 'blue' :
          'default'
        }>
          {status}
        </Tag>
      )
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${parseFloat(amount.toString()).toFixed(2)}`
    },
    {
      title: 'Expected Delivery',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Delivered Date',
      dataIndex: 'deliveredDate',
      key: 'deliveredDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SupplierOrder) => (
        <Button
          type="primary"
          size="small"
          onClick={() => navigate(`/admin/suppliers/${selectedSupplier?.id}/orders/${record.id}`)}
        >
          View Details
        </Button>
      )
    },
  ];

  return (
    <div className="supplier-management">
      <div className="supplier-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Title level={2}>Supplier Management</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal()}
        >
          Add Supplier
        </Button>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          style={{ marginBottom: '16px' }}
        />
      )}

      <Card>
        <Table 
          dataSource={suppliers} 
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} suppliers`,
            onChange: (page) => {
              setPagination({
                ...pagination,
                current: page,
              });
              // Don't use startTransition here as it causes navigation issues
              fetchSuppliers(page);
            },
          }}
        />
      </Card>

      <Modal
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEdit}
          initialValues={{
            status: 'ACTIVE',
            address: initialAddress
          }}
        >
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: 'General Information',
                children: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Form.Item
                        name="name"
                        label="Supplier Name"
                        rules={[{ required: true, message: 'Please enter supplier name' }]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                          { required: true, message: 'Please enter email' },
                          { type: 'email', message: 'Please enter a valid email' }
                        ]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        name="phone"
                        label="Phone"
                        rules={[{ required: true, message: 'Please enter phone number' }]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        name="website"
                        label="Website"
                      >
                        <Input />
                      </Form.Item>
                    </div>
                    <div>
                      <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please select category' }]}
                      >
                        <Select>
                          <Select.Option value="Electronics">Electronics</Select.Option>
                          <Select.Option value="Apparel">Apparel</Select.Option>
                          <Select.Option value="Food & Beverage">Food & Beverage</Select.Option>
                          <Select.Option value="Home & Garden">Home & Garden</Select.Option>
                          <Select.Option value="Sports & Outdoors">Sports & Outdoors</Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        name="subcategory"
                        label="Subcategory"
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        name="paymentTerms"
                        label="Payment Terms"
                        rules={[{ required: true, message: 'Please enter payment terms' }]}
                      >
                        <Input placeholder="e.g. Net 30" />
                      </Form.Item>
                      <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true, message: 'Please select status' }]}
                      >
                        <Select>
                          <Select.Option value="ACTIVE">Active</Select.Option>
                          <Select.Option value="INACTIVE">Inactive</Select.Option>
                        </Select>
                      </Form.Item>
                    </div>
                  </div>
                )
              },
              {
                key: '2',
                label: 'Address',
                children: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Form.Item
                        name={['address', 'street']}
                        label="Street"
                        rules={[{ required: true, message: 'Please enter street address' }]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        name={['address', 'city']}
                        label="City"
                        rules={[{ required: true, message: 'Please enter city' }]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        name={['address', 'state']}
                        label="State/Province"
                        rules={[{ required: true, message: 'Please enter state/province' }]}
                      >
                        <Input />
                      </Form.Item>
                    </div>
                    <div>
                      <Form.Item
                        name={['address', 'zip']}
                        label="Zip/Postal Code"
                        rules={[{ required: true, message: 'Please enter zip/postal code' }]}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        name={['address', 'country']}
                        label="Country"
                        rules={[{ required: true, message: 'Please enter country' }]}
                      >
                        <Input />
                      </Form.Item>
                    </div>
                  </div>
                )
              },
              {
                key: '3',
                label: 'Logo & Documents',
                children: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Form.Item
                        label="Logo"
                        name="logo"
                      >
                        <Upload
                          listType="picture-card"
                          fileList={logoFile}
                          maxCount={1}
                          beforeUpload={() => false}
                          onChange={({ fileList }) => setLogoFile(fileList)}
                        >
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                          </div>
                        </Upload>
                      </Form.Item>
                    </div>
                    <div>
                      <Form.Item
                        label="Documents"
                        name="documents"
                      >
                        <Upload
                          listType="text"
                          fileList={fileList}
                          beforeUpload={() => false}
                          onChange={({ fileList }) => setFileList(fileList)}
                        >
                          <Button icon={<UploadOutlined />}>Upload Documents</Button>
                        </Upload>
                      </Form.Item>
                    </div>
                  </div>
                )
              }
            ]}
          />
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button style={{ marginRight: 8 }} onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingSupplier ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={selectedSupplier ? `${selectedSupplier.name} - Orders` : 'Supplier Orders'}
        open={orderModalVisible}
        onCancel={() => setOrderModalVisible(false)}
        width={1000}
        footer={[
          <Button key="back" onClick={() => setOrderModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="create" 
            type="primary" 
            onClick={() => selectedSupplier && handleCreateOrder(selectedSupplier.id)}
          >
            Create Order
          </Button>
        ]}
      >
        {isPending ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
            <div style={{ marginTop: 16 }}>Loading orders...</div>
          </div>
        ) : (
          <>
            {supplierOrders.length === 0 ? (
              <Empty description="No orders found for this supplier" />
            ) : (
              <Table
                columns={orderColumns}
                dataSource={supplierOrders}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default SupplierManagement;
