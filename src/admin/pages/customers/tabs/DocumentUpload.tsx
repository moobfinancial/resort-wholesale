import React, { useState } from 'react';
import { 
  Upload, 
  Card, 
  Button, 
  message, 
  Space, 
  Typography, 
  Table,
  Tag,
  Modal
} from 'antd';
import { 
  UploadOutlined, 
  FileOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  notes?: string;
  fileUrl: string;
}

interface DocumentUploadProps {
  customerId: string;
  documents: Document[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  customerId,
  documents,
  onUpload,
  onDelete,
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewVisible(true);
  };

  const columns: ColumnsType<Document> = [
    {
      title: 'Document Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button type="link" onClick={() => handlePreview(record.fileUrl)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Upload Date',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          PENDING: { color: 'gold', icon: <ClockCircleOutlined /> },
          VERIFIED: { color: 'green', icon: <CheckCircleOutlined /> },
          REJECTED: { color: 'red', icon: <CloseCircleOutlined /> },
        }[status];

        return (
          <Tag color={config.color} icon={config.icon}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => handlePreview(record.fileUrl)}
          >
            View
          </Button>
          <Button 
            type="link" 
            danger
            onClick={() => onDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const uploadProps = {
    name: 'file',
    multiple: false,
    action: `/customers/${customerId}/documents`,
    onChange(info: any) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e: React.DragEvent) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={4}>Upload Documents</Title>
        <Text type="secondary">
          Supported file types: PDF, JPG, PNG (Max size: 10MB)
        </Text>
        <Dragger {...uploadProps} style={{ marginTop: 16 }}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Please ensure all documents are clear and legible
          </p>
        </Dragger>
      </Card>

      <Card>
        <Title level={4}>Uploaded Documents</Title>
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="id"
        />
      </Card>

      <Modal
        open={previewVisible}
        title="Document Preview"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <iframe
          src={previewUrl}
          style={{ width: '100%', height: '600px' }}
          title="Document Preview"
        />
      </Modal>
    </Space>
  );
};

export default DocumentUpload;
