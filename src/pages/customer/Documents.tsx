import React, { useState, useEffect } from 'react';
import { Upload, Button, Card, List, Typography, message, Modal } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useCustomerAuthStore } from '../../stores/customerAuth';
import { API_BASE_URL } from '../../config';

const { Title, Text } = Typography;

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  createdAt: string;
}

const Documents: React.FC = () => {
  const { token } = useCustomerAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      message.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch(`${API_BASE_URL}/customers/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const newDocument = await response.json();
      setDocuments([...documents, newDocument]);
      message.success('Document uploaded successfully');
    } catch (error) {
      message.error('Failed to upload document');
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Delete failed');

      setDocuments(documents.filter((doc) => doc.id !== documentId));
      message.success('Document deleted successfully');
    } catch (error) {
      message.error('Failed to delete document');
    }
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewVisible(true);
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isValidType = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.type);

      if (!isValidType) {
        message.error('You can only upload PDF, JPEG, PNG, or DOC files!');
        return Upload.LIST_IGNORE;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return Upload.LIST_IGNORE;
      }

      handleUpload(file);
      return false;
    },
    showUploadList: false,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Business Documents</Title>
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} type="primary" size="large">
            Upload Document
          </Button>
        </Upload>
      </div>

      <Card loading={loading}>
        <List
          itemLayout="horizontal"
          dataSource={documents}
          renderItem={(doc) => (
            <List.Item
              actions={[
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => handlePreview(doc.url)}
                  type="link"
                >
                  View
                </Button>,
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(doc.id)}
                  type="link"
                  danger
                >
                  Delete
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={doc.name}
                description={
                  <>
                    <Text type="secondary">
                      Type: {doc.type} | Uploaded:{' '}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
      >
        <iframe
          src={previewUrl}
          style={{ width: '100%', height: '80vh' }}
          title="Document Preview"
        />
      </Modal>
    </div>
  );
};

export default Documents;
