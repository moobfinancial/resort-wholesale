import React, { useState } from 'react';
import {
  Card,
  Steps,
  Button,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Space,
  Timeline,
  Tag
} from 'antd';
import {
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { Product, ProductStatus } from '@prisma/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface StatusChange {
  id: string;
  status: ProductStatus;
  comment: string;
  timestamp: Date;
  changedBy: string;
}

interface ProductStatusManagerProps {
  product: Product;
  statusHistory: StatusChange[];
  onStatusUpdate: (newStatus: ProductStatus, comment: string) => Promise<void>;
}

const statusSteps = {
  DRAFT: 0,
  PENDING_REVIEW: 1,
  APPROVED: 2,
  PUBLISHED: 3,
  ARCHIVED: 4,
};

const statusColors = {
  DRAFT: 'default',
  PENDING_REVIEW: 'processing',
  APPROVED: 'success',
  PUBLISHED: 'blue',
  ARCHIVED: 'default',
};

const ProductStatusManager: React.FC<ProductStatusManagerProps> = ({
  product,
  statusHistory,
  onStatusUpdate,
}) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ProductStatus | null>(null);

  const getCurrentStep = () => {
    return statusSteps[product.status];
  };

  const getNextStatus = (currentStatus: ProductStatus): ProductStatus | null => {
    switch (currentStatus) {
      case 'DRAFT':
        return 'PENDING_REVIEW';
      case 'PENDING_REVIEW':
        return 'APPROVED';
      case 'APPROVED':
        return 'PUBLISHED';
      case 'PUBLISHED':
        return 'ARCHIVED';
      default:
        return null;
    }
  };

  const handleStatusChange = async (values: { comment: string }) => {
    if (!targetStatus) return;

    try {
      await onStatusUpdate(targetStatus, values.comment);
      message.success('Status updated successfully');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const showStatusChangeModal = (status: ProductStatus) => {
    setTargetStatus(status);
    setIsModalVisible(true);
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Title level={4}>Product Status Workflow</Title>

        <Steps
          current={getCurrentStep()}
          items={[
            {
              title: 'Draft',
              icon: <EditOutlined />,
            },
            {
              title: 'Pending Review',
              icon: <ClockCircleOutlined />,
            },
            {
              title: 'Approved',
              icon: <CheckCircleOutlined />,
            },
            {
              title: 'Published',
              icon: <FileTextOutlined />,
            },
          ]}
        />

        <Card title="Current Status">
          <Space>
            <Text>Status:</Text>
            <Tag color={statusColors[product.status]}>{product.status}</Tag>
            {getNextStatus(product.status) && (
              <Button
                type="primary"
                onClick={() => showStatusChangeModal(getNextStatus(product.status)!)}
              >
                Move to {getNextStatus(product.status)}
              </Button>
            )}
          </Space>
        </Card>

        <Card title="Status History">
          <Timeline
            items={statusHistory.map(change => ({
              children: (
                <>
                  <Tag color={statusColors[change.status]}>{change.status}</Tag>
                  <Text>{change.comment}</Text>
                  <br />
                  <Text type="secondary">
                    Changed by {change.changedBy} on{' '}
                    {new Date(change.timestamp).toLocaleString()}
                  </Text>
                </>
              ),
            }))}
          />
        </Card>

        <Modal
          title="Update Product Status"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleStatusChange}
          >
            <Form.Item
              name="comment"
              label="Status Change Comment"
              rules={[{ required: true, message: 'Please provide a comment' }]}
            >
              <TextArea
                rows={4}
                placeholder="Explain why you're changing the status..."
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Update Status
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Card>
  );
};

export default ProductStatusManager;
