import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Typography,
  Popconfirm,
  Upload,
  Switch,
  Image,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import api from '../../../utils/api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { TextArea } = Input;

interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

const CollectionManagement: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [imageFile, setImageFile] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      // Use the API_BASE_URL from config or fallback to the environment variable
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/collections`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.status === 'success') {
        if (Array.isArray(data.data)) {
          setCollections(data.data);
        } else if (data.data && Array.isArray(data.data.collections)) {
          setCollections(data.data.collections);
        } else {
          console.warn('Unexpected data structure:', data);
          setCollections([]);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch collections');
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      message.error('Failed to fetch collections');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEdit = async (values: any) => {
    try {
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (key !== 'image') {
          formData.append(key, values[key]);
        }
      });

      if (imageFile.length > 0 && imageFile[0].originFileObj) {
        formData.append('image', imageFile[0].originFileObj);
      }

      let response;
      if (editingCollection) {
        response = await api.put(`/api/collections/${editingCollection.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        message.success('Collection updated successfully');
      } else {
        response = await api.post('/api/collections', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        message.success('Collection created successfully');
      }

      // Immediately fetch the updated collection list
      await fetchCollections();

      setModalVisible(false);
      form.resetFields();
      setImageFile([]);
    } catch (error) {
      console.error('Failed to save collection:', error);
      message.error('Failed to save collection');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/collections/${id}`);
      message.success('Collection deleted successfully');
      fetchCollections();
    } catch (error) {
      console.error('Failed to delete collection:', error);
      message.error('Failed to delete collection');
    }
  };

  const showModal = (collection?: Collection) => {
    setEditingCollection(collection || null);
    
    if (collection) {
      form.setFieldsValue({
        name: collection.name,
        description: collection.description,
        isActive: collection.isActive,
      });
      
      if (collection.imageUrl) {
        setImageFile([
          {
            uid: '-1',
            name: 'image.png',
            status: 'done',
            url: collection.imageUrl,
          },
        ]);
      } else {
        setImageFile([]);
      }
    } else {
      form.resetFields();
      setImageFile([]);
    }
    
    setModalVisible(true);
  };

  const columns: ColumnsType<Collection> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (imageUrl: string) => (
        imageUrl ? (
          <Image
            src={imageUrl}
            alt="Collection"
            style={{ width: 50, height: 50, objectFit: 'cover' }}
            preview={false}
          />
        ) : (
          <div style={{ width: 50, height: 50, background: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            No Image
          </div>
        )
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      render: (productCount: number) => productCount || 0,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span>
          {isActive ? (
            <span style={{ color: 'green' }}>Active</span>
          ) : (
            <span style={{ color: 'red' }}>Inactive</span>
          )}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<ShoppingOutlined />}
            onClick={() => navigate(`/admin/collections/${record.id}/products`)}
            title="Manage products within this collection"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            title="Edit collection details"
          />
          <Popconfirm
            title="Are you sure you want to delete this collection?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              title="Delete this collection permanently"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>Collections</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            title="Create a new collection to organize your products"
          >
            Add Collection
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={collections}
          rowKey="id"
          loading={loading}
        />

        <Modal
          title={editingCollection ? 'Edit Collection' : 'Add Collection'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
            setImageFile([]);
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddEdit}
            initialValues={{
              isActive: true,
            }}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter collection name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Active"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Image"
            >
              <Upload
                listType="picture-card"
                fileList={imageFile}
                onChange={({ fileList }) => setImageFile(fileList)}
                beforeUpload={() => false}
                maxCount={1}
              >
                {imageFile.length === 0 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Form.Item className="mb-0 text-right">
              <Space>
                <Button onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setImageFile([]);
                }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingCollection ? 'Update' : 'Create'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default CollectionManagement;
