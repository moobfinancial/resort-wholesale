import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { 
  Button, 
  Card, 
  Col, 
  Descriptions, 
  Divider, 
  Image, 
  Input, 
  Modal, 
  Row, 
  Space, 
  Spin, 
  Steps, 
  Tag, 
  Typography, 
  message 
} from 'antd';
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  DollarOutlined, 
  DownloadOutlined, 
  FileTextOutlined, 
  UserOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

interface CreditApplication {
  id: string;
  customerId: string;
  customerName: string;
  companyName: string;
  businessType: string;
  yearsInBusiness: string;
  taxId: string;
  annualRevenue: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  amount: number;
  term: '30' | '90' | '180';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  documents: {
    businessLicense: string[];
    taxReturns: string[];
    bankStatements: string[];
    financialStatements: string[];
  };
  createdAt: string;
  updatedAt: string;
  notes: string;
}

const CreditApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<CreditApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch credit application details
  useEffect(() => {
    // In a real implementation, we would fetch from the API
    // For now, we'll use mock data
    const mockData: CreditApplication = {
      id: id || '1',
      customerId: 'cust_001',
      customerName: 'John Smith',
      companyName: 'Beach Resorts Inc.',
      businessType: 'Corporation',
      yearsInBusiness: '5-10 years',
      taxId: '12-3456789',
      annualRevenue: '$1 million - $5 million',
      bankName: 'Coastal Bank',
      accountNumber: '****4321',
      routingNumber: '****5678',
      amount: 25000,
      term: '90',
      status: 'PENDING',
      documents: {
        businessLicense: ['business-license.pdf'],
        taxReturns: ['tax-return-2023.pdf', 'tax-return-2024.pdf'],
        bankStatements: ['bank-statement-jan.pdf', 'bank-statement-feb.pdf', 'bank-statement-mar.pdf'],
        financialStatements: ['balance-sheet.pdf', 'income-statement.pdf'],
      },
      createdAt: '2025-03-01T12:00:00Z',
      updatedAt: '2025-03-01T12:00:00Z',
      notes: 'Customer has been with us for 3 years. Good payment history.',
    };

    setTimeout(() => {
      setApplication(mockData);
      setNotes(mockData.notes);
      setCreditLimit(mockData.amount);
      setLoading(false);
    }, 1000);
  }, [id]);

  // Handle approve application
  const handleApprove = async () => {
    if (!application) return;

    setSubmitting(true);
    
    try {
      // In a real implementation, we would call the API
      // For now, we'll just update the local state
      setApplication((prev) => {
        if (!prev) return null;
        return { ...prev, status: 'APPROVED' };
      });

      message.success('Credit application approved successfully');
      setApproveModalVisible(false);
    } catch (error) {
      console.error('Error approving credit application:', error);
      message.error('Failed to approve credit application');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reject application
  const handleReject = async () => {
    if (!application) return;

    setSubmitting(true);
    
    try {
      // In a real implementation, we would call the API
      // For now, we'll just update the local state
      setApplication((prev) => {
        if (!prev) return null;
        return { ...prev, status: 'REJECTED' };
      });

      message.success('Credit application rejected');
      setRejectModalVisible(false);
    } catch (error) {
      console.error('Error rejecting credit application:', error);
      message.error('Failed to reject credit application');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle save notes
  const handleSaveNotes = async () => {
    if (!application) return;

    try {
      // In a real implementation, we would call the API
      // For now, we'll just update the local state
      setApplication((prev) => {
        if (!prev) return null;
        return { ...prev, notes };
      });

      message.success('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      message.error('Failed to save notes');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <Title level={3}>Credit Application Not Found</Title>
        <Link to="/admin/credit/applications">
          <Button type="primary" icon={<ArrowLeftOutlined />}>
            Back to Applications
          </Button>
        </Link>
      </div>
    );
  }

  // Determine current step based on status
  let currentStep = 0;
  switch (application.status) {
    case 'APPROVED':
      currentStep = 1;
      break;
    case 'REJECTED':
      currentStep = 2;
      break;
    default:
      currentStep = 0;
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link to="/admin/credit/applications" className="mr-4">
          <Button icon={<ArrowLeftOutlined />}>Back</Button>
        </Link>
        <Title level={2} className="mb-0">
          Credit Application: {application.companyName}
        </Title>
      </div>

      <Row gutter={16}>
        <Col span={18}>
          <Card className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Title level={4} className="mb-1">
                  {application.companyName}
                </Title>
                <Text className="text-gray-500">
                  Application ID: {application.id}
                </Text>
              </div>

              <div>
                <Tag
                  color={
                    application.status === 'APPROVED'
                      ? 'green'
                      : application.status === 'REJECTED'
                      ? 'red'
                      : 'blue'
                  }
                  icon={
                    application.status === 'APPROVED' ? (
                      <CheckCircleOutlined />
                    ) : application.status === 'REJECTED' ? (
                      <CloseCircleOutlined />
                    ) : null
                  }
                  className="text-base px-3 py-1"
                >
                  {application.status}
                </Tag>
              </div>
            </div>

            <Steps current={currentStep} className="mb-8">
              <Step title="Under Review" />
              <Step
                title="Approved"
                status={
                  application.status === 'REJECTED' ? 'error' : undefined
                }
              />
              <Step
                title="Rejected"
                status={
                  application.status === 'REJECTED' ? 'finish' : 'wait'
                }
              />
            </Steps>

            <Divider />

            <Title level={5} className="mb-4">
              <UserOutlined className="mr-2" />
              Business Information
            </Title>
            <Descriptions bordered column={2} className="mb-8">
              <Descriptions.Item label="Company Name">
                {application.companyName}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Name">
                {application.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Business Type">
                {application.businessType}
              </Descriptions.Item>
              <Descriptions.Item label="Years in Business">
                {application.yearsInBusiness}
              </Descriptions.Item>
              <Descriptions.Item label="Tax ID / EIN">
                {application.taxId}
              </Descriptions.Item>
              <Descriptions.Item label="Annual Revenue">
                {application.annualRevenue}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5} className="mb-4">
              <DollarOutlined className="mr-2" />
              Financial Information
            </Title>
            <Descriptions bordered column={2} className="mb-8">
              <Descriptions.Item label="Bank Name">
                {application.bankName}
              </Descriptions.Item>
              <Descriptions.Item label="Account Number">
                {application.accountNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Routing Number">
                {application.routingNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Requested Amount">
                ${application.amount.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Credit Term">
                {application.term} Days
              </Descriptions.Item>
              <Descriptions.Item label="Application Date">
                {new Date(application.createdAt).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5} className="mb-4">
              <FileTextOutlined className="mr-2" />
              Documents
            </Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card title="Business License" size="small">
                {application.documents.businessLicense.map((doc) => (
                  <div
                    key={doc}
                    className="flex justify-between items-center py-2"
                  >
                    <Text>{doc}</Text>
                    <Button
                      type="text"
                      icon={<DownloadOutlined />}
                      onClick={() => message.info('Download functionality would be implemented here')}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </Card>

              <Card title="Tax Returns" size="small">
                {application.documents.taxReturns.map((doc) => (
                  <div
                    key={doc}
                    className="flex justify-between items-center py-2"
                  >
                    <Text>{doc}</Text>
                    <Button
                      type="text"
                      icon={<DownloadOutlined />}
                      onClick={() => message.info('Download functionality would be implemented here')}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </Card>

              <Card title="Bank Statements" size="small">
                {application.documents.bankStatements.map((doc) => (
                  <div
                    key={doc}
                    className="flex justify-between items-center py-2"
                  >
                    <Text>{doc}</Text>
                    <Button
                      type="text"
                      icon={<DownloadOutlined />}
                      onClick={() => message.info('Download functionality would be implemented here')}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </Card>

              <Card title="Financial Statements" size="small">
                {application.documents.financialStatements.length > 0 ? (
                  application.documents.financialStatements.map((doc) => (
                    <div
                      key={doc}
                      className="flex justify-between items-center py-2"
                    >
                      <Text>{doc}</Text>
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={() => message.info('Download functionality would be implemented here')}
                      >
                        Download
                      </Button>
                    </div>
                  ))
                ) : (
                  <Text className="text-gray-500">No financial statements provided</Text>
                )}
              </Card>
            </div>

            <Divider />

            <Title level={5} className="mb-4">Notes</Title>
            <div className="mb-4">
              <TextArea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this application..."
              />
            </div>
            <Button type="primary" onClick={handleSaveNotes}>
              Save Notes
            </Button>
          </Card>
        </Col>

        <Col span={6}>
          <Card title="Actions" className="sticky top-8">
            <div className="space-y-4">
              {application.status === 'PENDING' && (
                <>
                  <Button
                    type="primary"
                    block
                    size="large"
                    className="bg-green-600 hover:bg-green-500"
                    onClick={() => setApproveModalVisible(true)}
                  >
                    Approve Application
                  </Button>
                  <Button
                    danger
                    block
                    size="large"
                    onClick={() => setRejectModalVisible(true)}
                  >
                    Reject Application
                  </Button>
                </>
              )}

              {application.status === 'APPROVED' && (
                <div className="p-4 bg-green-50 rounded-md">
                  <Text className="block mb-2 text-green-600 font-medium">
                    <CheckCircleOutlined className="mr-2" />
                    Application Approved
                  </Text>
                  <Text className="block text-green-600">
                    Credit limit: ${application.amount.toLocaleString()}
                  </Text>
                  <Text className="block text-green-600">
                    Term: {application.term} days
                  </Text>
                </div>
              )}

              {application.status === 'REJECTED' && (
                <div className="p-4 bg-red-50 rounded-md">
                  <Text className="block mb-2 text-red-600 font-medium">
                    <CloseCircleOutlined className="mr-2" />
                    Application Rejected
                  </Text>
                  <Text className="block text-red-600">
                    Reason: Insufficient documentation
                  </Text>
                </div>
              )}

              <Divider />

              <Button
                block
                icon={<UserOutlined />}
                onClick={() => navigate(`/admin/customers/${application.customerId}`)}
              >
                View Customer Profile
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Approve Modal */}
      <Modal
        title="Approve Credit Application"
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setApproveModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={submitting}
            onClick={handleApprove}
            className="bg-green-600 hover:bg-green-500"
          >
            Approve
          </Button>,
        ]}
      >
        <div className="mb-4">
          <Text>
            You are about to approve the credit application for{' '}
            <strong>{application.companyName}</strong>.
          </Text>
        </div>

        <div className="mb-4">
          <Text strong>Credit Limit</Text>
          <Input
            prefix="$"
            type="number"
            value={creditLimit}
            onChange={(e) => setCreditLimit(Number(e.target.value))}
            className="mt-1"
          />
        </div>

        <div className="mb-4">
          <Text strong>Credit Term</Text>
          <div className="mt-1">
            <Text>{application.term} days</Text>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-md">
          <Text className="text-blue-600">
            This will grant the customer a credit line of ${creditLimit.toLocaleString()} with a term of {application.term} days.
          </Text>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Credit Application"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRejectModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="reject"
            danger
            loading={submitting}
            onClick={handleReject}
          >
            Reject
          </Button>,
        ]}
      >
        <div className="mb-4">
          <Text>
            You are about to reject the credit application for{' '}
            <strong>{application.companyName}</strong>.
          </Text>
        </div>

        <div className="mb-4">
          <Text strong>Reason for Rejection</Text>
          <TextArea
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Provide a reason for rejecting this application..."
            className="mt-1"
          />
        </div>

        <div className="p-4 bg-red-50 rounded-md">
          <Text className="text-red-600">
            This action cannot be undone. The customer will be notified of the rejection.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default CreditApplicationDetail;
