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
  products?: any[];
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
      const response = await api.get('/collections');
      
      const { data } = response;
      
      if (data && data.status === 'success' && data.data) {
        const collections = data.data.collections || [];
        const processedCollections = collections.map((collection: Collection) => ({
          ...collection,
          imageUrl: processImageUrl(collection.imageUrl),
          productCount: collection.products?.length || 0
        }));
        setCollections(processedCollections);
      } else {
        throw new Error(data?.message || 'Failed to list collections');
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      message.error('Failed to fetch collections');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const processImageUrl = (imageUrl: string | null | undefined): string => {
    if (!imageUrl) {
      return '/images/collections/collection-1741193035768-61315048.jpg'; // Default placeholder
    }
    
    // If URL is already properly formatted, return it
    if (imageUrl.startsWith('/images/collections/') || imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Handle paths starting with /images/categories/ (old format)
    if (imageUrl.startsWith('/images/categories/') || imageUrl.startsWith('images/categories/')) {
      const filename = imageUrl.split('/').pop();
      return `/images/collections/${filename}`;
    }
    
    // If URL is just a filename or path without proper prefix
    if (imageUrl.startsWith('images/collections/')) {
      return '/' + imageUrl;
    }
    
    // Extract filename and add proper prefix
    const filename = imageUrl.split('/').pop();
    return `/images/collections/${filename}`;
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
        // Update existing collection
        response = await api.put(`/collections/${editingCollection.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data?.status === 'success') {
          message.success('Collection updated successfully');
        } else {
          throw new Error(response.data?.message || 'Failed to update collection');
        }
      } else {
        // Create new collection
        response = await api.post('/collections', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data?.status === 'success') {
          message.success('Collection created successfully');
        } else {
          throw new Error(response.data?.message || 'Failed to create collection');
        }
      }

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
      const response = await api.delete(`/collections/${id}`);
      if (response.data?.status === 'success') {
        message.success('Collection deleted successfully');
        fetchCollections();
      } else {
        throw new Error(response.data?.message || 'Failed to delete collection');
      }
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
        // Process the image URL to ensure it's properly formatted
        const processedImageUrl = processImageUrl(collection.imageUrl);
        setImageFile([
          {
            uid: '-1',
            name: 'collection-image.jpg',
            status: 'done',
            url: processedImageUrl,
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
        <Image
          src={imageUrl}
          alt="Collection"
          style={{ width: 50, height: 50, objectFit: 'cover' }}
          preview={false}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Try with collections path
            if (!target.src.includes('/images/collections/')) {
              const filename = imageUrl.split('/').pop();
              target.src = `/images/collections/${filename || 'collection-1741193035768-61315048.jpg'}`;
            } else {
              // Fallback to placeholder
              target.src = '/images/collections/collection-1741193035768-61315048.jpg';
            }
          }}
        />
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
                onPreview={() => {
                  if (imageFile.length > 0 && imageFile[0].url) {
                    window.open(imageFile[0].url);
                  }
                }}
              >
                {imageFile.length === 0 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
              <div className="text-xs text-gray-500 mt-1">
                Recommended size: 600x400 pixels. JPG, PNG, or GIF format.
              </div>
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
