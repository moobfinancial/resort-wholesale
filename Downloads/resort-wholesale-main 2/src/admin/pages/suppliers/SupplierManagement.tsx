import React, { useState, useEffect, Key } from 'react';
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
  Descriptions,
  Card,
  Tag
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { api } from '../../../api/api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { TextArea } = Input;

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: any;
  website?: string;
  logo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  category: string;
  subcategory: string;
  paymentTerms: string;
  documents: string[];
}

interface SupplierOrder {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number | string;
  orderDate: string;
  expectedDeliveryDate?: string;
  deliveredDate?: string;
  notes?: string;
}

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
  const [isPending, startTransition] = React.useTransition();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.suppliers.list();
      if (response && response.data) {
        setSuppliers(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      message.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const fetchSupplierOrders = async (supplierId: string) => {
    try {
      setError(null);
      const response = await api.get(`suppliers/${supplierId}/orders`);
      if (response && response.data) {
        setSupplierOrders(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      message.error('Failed to load supplier orders');
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
        if (key !== 'documents' && key !== 'logo') {
          formData.append(key, values[key]);
        }
      });

      // Handle logo upload
      if (logoFile.length > 0) {
        formData.append('logo', logoFile[0].originFileObj as Blob);
      }

      // Handle document uploads
      fileList.forEach((file) => {
        formData.append('documents', file.originFileObj as Blob);
      });

      if (editingSupplier) {
        await api.suppliers.update(editingSupplier.id, formData);
        message.success('Supplier updated successfully');
      } else {
        await api.suppliers.create(formData);
        message.success('Supplier created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setFileList([]);
      setLogoFile([]);
      loadSuppliers();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async (supplierId: string) => {
    try {
      await api.suppliers.delete(supplierId);
      message.success('Supplier deleted successfully');
      loadSuppliers();
    } catch (error) {
      handleError(error);
    }
  };

  const showModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      form.setFieldsValue(supplier);
      setFileList(
        supplier.documents.map((doc, index) => ({
          uid: `-${index}`,
          name: doc.split('/').pop() || doc,
          status: 'done',
          url: doc,
        }))
      );
      if (supplier.logo) {
        setLogoFile([
          {
            uid: '-1',
            name: supplier.logo.split('/').pop() || supplier.logo,
            status: 'done',
            url: supplier.logo,
          },
        ]);
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
    startTransition(() => {
      setSelectedSupplier(supplier);
      fetchSupplierOrders(supplier.id);
      setOrderModalVisible(true);
    });
  };

  const handleCreateOrder = (supplierId: string) => {
    startTransition(() => {
      navigate(`/admin/suppliers/${supplierId}/orders/new`);
    });
  };

  const columns: ColumnsType<Supplier> = [
    {
      title: 'Logo',
      key: 'logo',
      width: 80,
      render: (_, record) => (
        record.logo ? (
          <img
            src={record.logo}
            alt={record.name}
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }}
          />
        ) : null
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },
    {
      title: 'Contact Info',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <PhoneOutlined />
            {record.phone}
          </Space>
          <Space>
            <MailOutlined />
            {record.email}
          </Space>
          {record.website && (
            <Space>
              <GlobalOutlined />
              <a href={record.website} target="_blank" rel="noopener noreferrer">
                Website
              </a>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Electronics', value: 'Electronics' },
        { text: 'Apparel', value: 'Apparel' },
        { text: 'Food & Beverage', value: 'Food & Beverage' },
      ],
      onFilter: (value: string | number | boolean, record: Supplier) => record.category === value,
    },
    {
      title: 'Subcategory',
      dataIndex: 'subcategory',
      key: 'subcategory',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Inactive', value: 'INACTIVE' },
      ],
      onFilter: (value: boolean | Key, record: Supplier) => {
        const status = value === true ? 'ACTIVE' : 'INACTIVE';
        return record.status === status;
      },
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<ShoppingCartOutlined />}
            onClick={() => handleCreateOrder(record.id)}
          >
            New Order
          </Button>
          <Button onClick={() => handleViewSupplier(record)}>
            View Details
          </Button>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const orderColumns: ColumnsType<SupplierOrder> = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        switch (status) {
          case 'PENDING':
            color = 'orange';
            break;
          case 'CONFIRMED':
            color = 'blue';
            break;
          case 'SHIPPED':
            color = 'purple';
            break;
          case 'DELIVERED':
            color = 'green';
            break;
          case 'CANCELLED':
            color = 'red';
            break;
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number | string | null | undefined) => amount,
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Expected Delivery',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Not specified',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" onClick={() => navigate(`/admin/orders/${record.id}`)}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <Title level={2}>Supplier Management</Title>
            <p className="mt-2 text-sm text-gray-700">
              Manage your suppliers, their contact information, and documents.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                disabled={isPending}
                onClick={() => showModal()}
                style={{ marginRight: 16 }}
              >
                Add Supplier
              </Button>
              {isPending && <Spin size="small" />}
            </div>
          </div>
        </div>

        <div className="mt-8">
          {error && (
            <div style={{ marginBottom: 16 }}>
              <Alert message={error} type="error" />
            </div>
          )}
          <Table
            columns={columns}
            dataSource={suppliers}
            rowKey="id"
            loading={loading}
          />
        </div>

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
          >
            <Form.Item
              name="logo"
              label="Company Logo"
            >
              <Upload
                listType="picture-card"
                fileList={logoFile}
                onChange={({ fileList }) => setLogoFile(fileList)}
                beforeUpload={() => false}
                maxCount={1}
              >
                {logoFile.length === 0 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload Logo</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter supplier name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="contactPerson"
              label="Contact Person"
              rules={[{ required: true, message: 'Please enter contact person' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' },
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

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select or enter category' }]}
            >
              <Select
                showSearch
                allowClear
                mode="tags"
                placeholder="Select or enter a category"
              >
                <Select.Option value="Electronics">Electronics</Select.Option>
                <Select.Option value="Apparel">Apparel</Select.Option>
                <Select.Option value="Food & Beverage">Food & Beverage</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="subcategory"
              label="Subcategory"
            >
              <Select
                showSearch
                allowClear
                mode="tags"
                placeholder="Select or enter a subcategory"
              >
                <Select.Option value="Components">Components</Select.Option>
                <Select.Option value="Accessories">Accessories</Select.Option>
                <Select.Option value="Raw Materials">Raw Materials</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              initialValue="ACTIVE"
            >
              <Select>
                <Select.Option value="ACTIVE">Active</Select.Option>
                <Select.Option value="INACTIVE">Inactive</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="paymentTerms"
              label="Payment Terms"
              rules={[{ required: true, message: 'Please enter payment terms' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: 'Please enter address' }]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              label="Documents"
            >
              <Upload
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false}
                multiple
              >
                <Button icon={<UploadOutlined />}>Upload Documents</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingSupplier ? 'Update' : 'Create'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Supplier Details"
          open={orderModalVisible}
          onCancel={() => setOrderModalVisible(false)}
          footer={null}
          width={1000}
        >
          {selectedSupplier && (
            <Tabs
              defaultActiveKey="details"
              items={[
                {
                  key: 'details',
                  label: 'Details',
                  children: (
                    <Descriptions bordered column={2}>
                      {selectedSupplier.logo && (
                        <Descriptions.Item label="Logo" span={2}>
                          <img
                            src={selectedSupplier.logo}
                            alt={selectedSupplier.name}
                            style={{ width: 100, height: 100, objectFit: 'cover' }}
                          />
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Name">
                        {selectedSupplier.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="Contact Person">
                        {selectedSupplier.contactPerson}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {selectedSupplier.email}
                      </Descriptions.Item>
                      <Descriptions.Item label="Phone">
                        {selectedSupplier.phone}
                      </Descriptions.Item>
                      <Descriptions.Item label="Website">
                        {selectedSupplier.website || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Category">
                        {selectedSupplier.category}
                      </Descriptions.Item>
                      <Descriptions.Item label="Subcategory">
                        {selectedSupplier.subcategory}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={selectedSupplier.status === 'ACTIVE' ? 'green' : 'red'}>
                          {selectedSupplier.status}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Payment Terms">
                        {selectedSupplier.paymentTerms}
                      </Descriptions.Item>
                      <Descriptions.Item label="Address" span={2}>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                          {JSON.stringify(selectedSupplier.address, null, 2)}
                        </pre>
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'orders',
                  label: 'Order History',
                  children: (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <Button
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          loading={isPending}
                          onClick={() => handleCreateOrder(selectedSupplier.id)}
                        >
                          Create New Order
                        </Button>
                      </div>
                      <Table
                        columns={orderColumns}
                        dataSource={supplierOrders}
                        rowKey="id"
                        loading={loading || isPending}
                      />
                    </>
                  ),
                },
              ]}
            />
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default SupplierManagement;
