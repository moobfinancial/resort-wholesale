import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Drawer,
  Descriptions,
  Timeline,
  Image,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface VerificationRequest {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  submissionDate: string;
  documents: {
    id: string;
    type: string;
    url: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  }[];
  notes: string[];
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

const VerificationQueue: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectForm] = Form.useForm();

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/business-customers/verification-queue');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      message.error('Failed to fetch verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: VerificationRequest) => {
    try {
      // TODO: Replace with actual API call
      await fetch(`/api/business-customers/${request.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VERIFIED' }),
      });
      message.success('Business customer verified successfully');
      fetchVerificationRequests();
    } catch (error) {
      message.error('Failed to verify business customer');
    }
  };

  const handleReject = async (values: { reason: string }) => {
    if (!selectedRequest) return;

    try {
      // TODO: Replace with actual API call
      await fetch(`/api/business-customers/${selectedRequest.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          reason: values.reason,
        }),
      });
      message.success('Business customer verification rejected');
      setIsRejectModalVisible(false);
      rejectForm.resetFields();
      fetchVerificationRequests();
    } catch (error) {
      message.error('Failed to reject business customer');
    }
  };

  const columns = [
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      sorter: (a: VerificationRequest, b: VerificationRequest) =>
        a.companyName.localeCompare(b.companyName),
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactName',
      key: 'contactName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Submission Date',
      dataIndex: 'submissionDate',
      key: 'submissionDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: VerificationRequest, b: VerificationRequest) =>
        new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime(),
    },
    {
      title: 'Documents',
      key: 'documents',
      render: (_: any, record: VerificationRequest) => (
        <Text>{record.documents.length} documents</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: VerificationRequest) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRequest(record);
              setIsDrawerVisible(true);
            }}
          >
            Review
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record)}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setSelectedRequest(record);
              setIsRejectModalVisible(true);
            }}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/customers')}
          >
            Back to Customers
          </Button>
        </Space>

        <Title level={2}>Verification Queue</Title>
        <Paragraph>
          Review and verify business customer applications. Ensure all required
          documents are valid before approval.
        </Paragraph>

        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Drawer
        title="Review Verification Request"
        placement="right"
        width={720}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
      >
        {selectedRequest && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions title="Business Information" bordered column={1}>
              <Descriptions.Item label="Company Name">
                {selectedRequest.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="Contact Name">
                {selectedRequest.contactName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedRequest.email}
              </Descriptions.Item>
              <Descriptions.Item label="Submission Date">
                {new Date(selectedRequest.submissionDate).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Card title="Submitted Documents">
              {selectedRequest.documents.map(doc => (
                <Card.Grid key={doc.id} style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <FileTextOutlined />
                      <Text strong>{doc.type}</Text>
                      <Tag color={doc.status === 'VERIFIED' ? 'green' : 'gold'}>
                        {doc.status}
                      </Tag>
                    </Space>
                    <Image
                      src={doc.url}
                      alt={doc.type}
                      style={{ maxWidth: '100%' }}
                    />
                  </Space>
                </Card.Grid>
              ))}
            </Card>

            <Card title="Verification Notes">
              <Timeline>
                {selectedRequest.notes.map((note, index) => (
                  <Timeline.Item key={index}>{note}</Timeline.Item>
                ))}
              </Timeline>
            </Card>

            <Space>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(selectedRequest)}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsRejectModalVisible(true);
                  setIsDrawerVisible(false);
                }}
              >
                Reject
              </Button>
            </Space>
          </Space>
        )}
      </Drawer>

      <Modal
        title="Reject Verification Request"
        open={isRejectModalVisible}
        onCancel={() => {
          setIsRejectModalVisible(false);
          rejectForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={handleReject}
        >
          <Form.Item
            name="reason"
            label="Rejection Reason"
            rules={[
              { required: true, message: 'Please provide a reason for rejection' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Explain why this verification request is being rejected..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                Confirm Rejection
              </Button>
              <Button onClick={() => setIsRejectModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default VerificationQueue;
