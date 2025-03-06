import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuthStore } from '../../stores/customerAuth';
import { API_BASE_URL } from '../../config';
import { 
  Button, 
  Card, 
  Checkbox, 
  Divider, 
  Form, 
  Input, 
  Radio, 
  Select, 
  Steps, 
  Typography, 
  Upload, 
  message 
} from 'antd';
import { 
  BankOutlined, 
  CreditCardOutlined, 
  DollarOutlined, 
  FileTextOutlined, 
  InboxOutlined, 
  UserOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { Dragger } = Upload;

enum CreditApplicationStep {
  BUSINESS_INFO = 0,
  FINANCIAL_INFO = 1,
  DOCUMENTS = 2,
  TERMS = 3,
  REVIEW = 4,
}

interface BusinessInfo {
  businessName: string;
  businessType: string;
  yearsInBusiness: string;
  taxId: string;
  annualRevenue: string;
}

interface FinancialInfo {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  creditAmount: string;
  creditTerm: '30' | '90' | '180';
}

interface DocumentInfo {
  businessLicense: any[];
  taxReturns: any[];
  bankStatements: any[];
  financialStatements: any[];
}

const CreditApplication: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useCustomerAuthStore();
  const [currentStep, setCurrentStep] = useState<CreditApplicationStep>(CreditApplicationStep.BUSINESS_INFO);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [financialInfo, setFinancialInfo] = useState<FinancialInfo | null>(null);
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
    businessLicense: [],
    taxReturns: [],
    bankStatements: [],
    financialStatements: [],
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if user is authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      message.error('Please sign in to apply for credit');
      navigate('/login', { state: { from: '/customer/credit/apply' } });
    }
  }, [isAuthenticated, navigate]);

  // Handle business info form submission
  const handleBusinessInfoSubmit = (values: BusinessInfo) => {
    setBusinessInfo(values);
    setCurrentStep(CreditApplicationStep.FINANCIAL_INFO);
  };

  // Handle financial info form submission
  const handleFinancialInfoSubmit = (values: FinancialInfo) => {
    setFinancialInfo(values);
    setCurrentStep(CreditApplicationStep.DOCUMENTS);
  };

  // Handle document upload
  const handleDocumentUpload = () => {
    // Validate that at least one document of each type has been uploaded
    if (
      documentInfo.businessLicense.length === 0 ||
      documentInfo.taxReturns.length === 0 ||
      documentInfo.bankStatements.length === 0
    ) {
      message.error('Please upload all required documents');
      return;
    }

    setCurrentStep(CreditApplicationStep.TERMS);
  };

  // Handle terms acceptance
  const handleTermsAccept = () => {
    if (!termsAccepted) {
      message.error('Please accept the terms and conditions');
      return;
    }

    setCurrentStep(CreditApplicationStep.REVIEW);
  };

  // Handle application submission
  const handleSubmitApplication = async () => {
    if (!businessInfo || !financialInfo) return;

    setSubmitting(true);
    
    try {
      // In a real implementation, we would:
      // 1. Upload all documents
      // 2. Create the credit application in the database
      
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      message.success('Credit application submitted successfully!');
      
      // Redirect to dashboard
      navigate('/customer/dashboard');
    } catch (error) {
      console.error('Error submitting credit application:', error);
      message.error('Failed to submit credit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render business info form
  const renderBusinessInfoForm = () => (
    <Card className="mb-8">
      <Form layout="vertical" onFinish={handleBusinessInfoSubmit} initialValues={businessInfo || {}}>
        <Title level={4} className="mb-6">Business Information</Title>
        
        <Form.Item
          name="businessName"
          label="Business Name"
          rules={[{ required: true, message: 'Please enter your business name' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Your Business Name" />
        </Form.Item>
        
        <Form.Item
          name="businessType"
          label="Business Type"
          rules={[{ required: true, message: 'Please select your business type' }]}
        >
          <Select placeholder="Select Business Type">
            <Option value="sole_proprietorship">Sole Proprietorship</Option>
            <Option value="partnership">Partnership</Option>
            <Option value="llc">Limited Liability Company (LLC)</Option>
            <Option value="corporation">Corporation</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="yearsInBusiness"
          label="Years in Business"
          rules={[{ required: true, message: 'Please enter years in business' }]}
        >
          <Select placeholder="Select Years in Business">
            <Option value="less_than_1">Less than 1 year</Option>
            <Option value="1_to_3">1-3 years</Option>
            <Option value="3_to_5">3-5 years</Option>
            <Option value="5_to_10">5-10 years</Option>
            <Option value="more_than_10">More than 10 years</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="taxId"
          label="Tax ID / EIN"
          rules={[{ required: true, message: 'Please enter your Tax ID' }]}
        >
          <Input placeholder="XX-XXXXXXX" />
        </Form.Item>
        
        <Form.Item
          name="annualRevenue"
          label="Annual Revenue"
          rules={[{ required: true, message: 'Please select your annual revenue' }]}
        >
          <Select placeholder="Select Annual Revenue">
            <Option value="less_than_100k">Less than $100,000</Option>
            <Option value="100k_to_500k">$100,000 - $500,000</Option>
            <Option value="500k_to_1m">$500,000 - $1 million</Option>
            <Option value="1m_to_5m">$1 million - $5 million</Option>
            <Option value="more_than_5m">More than $5 million</Option>
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" className="mt-4">
            Continue
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  // Render financial info form
  const renderFinancialInfoForm = () => (
    <Card className="mb-8">
      <Form layout="vertical" onFinish={handleFinancialInfoSubmit} initialValues={financialInfo || {}}>
        <Title level={4} className="mb-6">Financial Information</Title>
        
        <Form.Item
          name="bankName"
          label="Bank Name"
          rules={[{ required: true, message: 'Please enter your bank name' }]}
        >
          <Input prefix={<BankOutlined />} placeholder="Bank Name" />
        </Form.Item>
        
        <Form.Item
          name="accountNumber"
          label="Account Number (last 4 digits)"
          rules={[{ required: true, message: 'Please enter the last 4 digits of your account number' }]}
        >
          <Input placeholder="XXXX" maxLength={4} />
        </Form.Item>
        
        <Form.Item
          name="routingNumber"
          label="Routing Number (last 4 digits)"
          rules={[{ required: true, message: 'Please enter the last 4 digits of your routing number' }]}
        >
          <Input placeholder="XXXX" maxLength={4} />
        </Form.Item>
        
        <Form.Item
          name="creditAmount"
          label="Requested Credit Amount"
          rules={[{ required: true, message: 'Please enter the credit amount you are requesting' }]}
        >
          <Select placeholder="Select Credit Amount">
            <Option value="5000">$5,000</Option>
            <Option value="10000">$10,000</Option>
            <Option value="25000">$25,000</Option>
            <Option value="50000">$50,000</Option>
            <Option value="100000">$100,000</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="creditTerm"
          label="Credit Term"
          rules={[{ required: true, message: 'Please select a credit term' }]}
        >
          <Radio.Group>
            <Radio value="30">30 Days</Radio>
            <Radio value="90">90 Days</Radio>
            <Radio value="180">180 Days</Radio>
          </Radio.Group>
        </Form.Item>
        
        <div className="flex justify-between mt-6">
          <Button onClick={() => setCurrentStep(CreditApplicationStep.BUSINESS_INFO)}>
            Back
          </Button>
          
          <Button type="primary" htmlType="submit" size="large">
            Continue
          </Button>
        </div>
      </Form>
    </Card>
  );

  // Render document upload form
  const renderDocumentUploadForm = () => (
    <Card className="mb-8">
      <Title level={4} className="mb-6">Required Documents</Title>
      
      <div className="space-y-8">
        <div>
          <Text strong className="block mb-2">Business License *</Text>
          <Dragger
            name="businessLicense"
            multiple={false}
            beforeUpload={(file) => {
              setDocumentInfo(prev => ({
                ...prev,
                businessLicense: [file],
              }));
              return false; // Prevent actual upload
            }}
            fileList={documentInfo.businessLicense}
            onRemove={() => {
              setDocumentInfo(prev => ({
                ...prev,
                businessLicense: [],
              }));
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Upload a copy of your business license or registration
            </p>
          </Dragger>
        </div>
        
        <div>
          <Text strong className="block mb-2">Tax Returns (Last 2 Years) *</Text>
          <Dragger
            name="taxReturns"
            multiple={true}
            beforeUpload={(file) => {
              setDocumentInfo(prev => ({
                ...prev,
                taxReturns: [...prev.taxReturns, file],
              }));
              return false; // Prevent actual upload
            }}
            fileList={documentInfo.taxReturns}
            onRemove={(file) => {
              setDocumentInfo(prev => ({
                ...prev,
                taxReturns: prev.taxReturns.filter(f => f.uid !== file.uid),
              }));
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag files to this area to upload</p>
            <p className="ant-upload-hint">
              Upload your business tax returns for the last 2 years
            </p>
          </Dragger>
        </div>
        
        <div>
          <Text strong className="block mb-2">Bank Statements (Last 3 Months) *</Text>
          <Dragger
            name="bankStatements"
            multiple={true}
            beforeUpload={(file) => {
              setDocumentInfo(prev => ({
                ...prev,
                bankStatements: [...prev.bankStatements, file],
              }));
              return false; // Prevent actual upload
            }}
            fileList={documentInfo.bankStatements}
            onRemove={(file) => {
              setDocumentInfo(prev => ({
                ...prev,
                bankStatements: prev.bankStatements.filter(f => f.uid !== file.uid),
              }));
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag files to this area to upload</p>
            <p className="ant-upload-hint">
              Upload your business bank statements for the last 3 months
            </p>
          </Dragger>
        </div>
        
        <div>
          <Text strong className="block mb-2">Financial Statements (Optional)</Text>
          <Dragger
            name="financialStatements"
            multiple={true}
            beforeUpload={(file) => {
              setDocumentInfo(prev => ({
                ...prev,
                financialStatements: [...prev.financialStatements, file],
              }));
              return false; // Prevent actual upload
            }}
            fileList={documentInfo.financialStatements}
            onRemove={(file) => {
              setDocumentInfo(prev => ({
                ...prev,
                financialStatements: prev.financialStatements.filter(f => f.uid !== file.uid),
              }));
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag files to this area to upload</p>
            <p className="ant-upload-hint">
              Upload any additional financial statements (balance sheet, income statement, etc.)
            </p>
          </Dragger>
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button onClick={() => setCurrentStep(CreditApplicationStep.FINANCIAL_INFO)}>
          Back
        </Button>
        
        <Button type="primary" size="large" onClick={handleDocumentUpload}>
          Continue
        </Button>
      </div>
    </Card>
  );

  // Render terms and conditions
  const renderTermsAndConditions = () => (
    <Card className="mb-8">
      <Title level={4} className="mb-6">Terms and Conditions</Title>
      
      <div className="h-64 overflow-y-auto border border-gray-200 rounded-md p-4 mb-6">
        <Title level={5}>Credit Agreement</Title>
        
        <Paragraph>
          This Credit Agreement (the "Agreement") is entered into by and between Resort Fresh (the "Company") and the customer applying for credit (the "Customer").
        </Paragraph>
        
        <Title level={5}>1. Credit Terms</Title>
        <Paragraph>
          Subject to approval, the Company may extend credit to the Customer for the purchase of products. The credit limit and terms will be determined by the Company based on the Customer's application and supporting documents.
        </Paragraph>
        
        <Title level={5}>2. Payment Terms</Title>
        <Paragraph>
          Customer agrees to pay all invoices within the approved credit term (30, 90, or 180 days) from the invoice date. Failure to pay within the agreed term may result in late fees, suspension of credit privileges, and/or legal action.
        </Paragraph>
        
        <Title level={5}>3. Late Payments</Title>
        <Paragraph>
          Any payment not received within the agreed credit term will be considered late. Late payments will incur a late fee of 1.5% per month (18% per annum) on the outstanding balance.
        </Paragraph>
        
        <Title level={5}>4. Default</Title>
        <Paragraph>
          Customer will be in default if any of the following occurs: (a) failure to pay any amount when due; (b) breach of any term of this Agreement; (c) bankruptcy or insolvency of Customer; (d) any representation or information provided by Customer is false or misleading.
        </Paragraph>
        
        <Title level={5}>5. Collection Costs</Title>
        <Paragraph>
          In the event of default, Customer agrees to pay all costs of collection, including reasonable attorney fees, court costs, and collection agency fees.
        </Paragraph>
        
        <Title level={5}>6. Credit Information</Title>
        <Paragraph>
          Customer authorizes the Company to obtain credit information from credit reporting agencies, banks, and other references provided by Customer. Customer agrees that the Company may report Customer's payment history to credit reporting agencies.
        </Paragraph>
        
        <Title level={5}>7. Change in Terms</Title>
        <Paragraph>
          The Company reserves the right to change the terms of this Agreement at any time by providing written notice to Customer. Customer's continued use of credit after such notice constitutes acceptance of the new terms.
        </Paragraph>
        
        <Title level={5}>8. Governing Law</Title>
        <Paragraph>
          This Agreement shall be governed by and construed in accordance with the laws of the state of Florida, without regard to its conflict of laws principles.
        </Paragraph>
      </div>
      
      <Form.Item>
        <Checkbox checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}>
          I have read and agree to the terms and conditions
        </Checkbox>
      </Form.Item>
      
      <div className="flex justify-between mt-6">
        <Button onClick={() => setCurrentStep(CreditApplicationStep.DOCUMENTS)}>
          Back
        </Button>
        
        <Button type="primary" size="large" onClick={handleTermsAccept}>
          Continue
        </Button>
      </div>
    </Card>
  );

  // Render application review
  const renderApplicationReview = () => (
    <Card className="mb-8">
      <Title level={4} className="mb-6">Review Your Application</Title>
      
      <div className="space-y-6">
        <div>
          <Title level={5}>Business Information</Title>
          <div className="grid grid-cols-2 gap-4">
            {businessInfo && (
              <>
                <Text strong>Business Name:</Text>
                <Text>{businessInfo.businessName}</Text>
                
                <Text strong>Business Type:</Text>
                <Text>{businessInfo.businessType}</Text>
                
                <Text strong>Years in Business:</Text>
                <Text>{businessInfo.yearsInBusiness}</Text>
                
                <Text strong>Tax ID:</Text>
                <Text>{businessInfo.taxId}</Text>
                
                <Text strong>Annual Revenue:</Text>
                <Text>{businessInfo.annualRevenue}</Text>
              </>
            )}
          </div>
        </div>
        
        <Divider />
        
        <div>
          <Title level={5}>Financial Information</Title>
          <div className="grid grid-cols-2 gap-4">
            {financialInfo && (
              <>
                <Text strong>Bank Name:</Text>
                <Text>{financialInfo.bankName}</Text>
                
                <Text strong>Account Number:</Text>
                <Text>XXXX-XXXX-XXXX-{financialInfo.accountNumber}</Text>
                
                <Text strong>Routing Number:</Text>
                <Text>XXXXX{financialInfo.routingNumber}</Text>
                
                <Text strong>Requested Credit Amount:</Text>
                <Text>${financialInfo.creditAmount}</Text>
                
                <Text strong>Credit Term:</Text>
                <Text>{financialInfo.creditTerm} Days</Text>
              </>
            )}
          </div>
        </div>
        
        <Divider />
        
        <div>
          <Title level={5}>Uploaded Documents</Title>
          <div className="grid grid-cols-2 gap-4">
            <Text strong>Business License:</Text>
            <Text>{documentInfo.businessLicense.length} file(s)</Text>
            
            <Text strong>Tax Returns:</Text>
            <Text>{documentInfo.taxReturns.length} file(s)</Text>
            
            <Text strong>Bank Statements:</Text>
            <Text>{documentInfo.bankStatements.length} file(s)</Text>
            
            <Text strong>Financial Statements:</Text>
            <Text>{documentInfo.financialStatements.length} file(s)</Text>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <Text className="block mb-2">
          <FileTextOutlined className="mr-2" />
          By submitting this application, you confirm that all information provided is accurate and complete.
        </Text>
        <Text>
          Your application will be reviewed by our credit team, and you will be notified of the decision within 3-5 business days.
        </Text>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button onClick={() => setCurrentStep(CreditApplicationStep.TERMS)}>
          Back
        </Button>
        
        <Button 
          type="primary" 
          size="large" 
          onClick={handleSubmitApplication}
          loading={submitting}
        >
          Submit Application
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center mb-8">
        <CreditCardOutlined className="text-2xl text-blue-600 mr-3" />
        <Title level={2} className="mb-0">Credit Application</Title>
      </div>
      
      <div className="mb-8">
        <Steps current={currentStep} responsive>
          <Step title="Business Info" icon={<UserOutlined />} />
          <Step title="Financial Info" icon={<DollarOutlined />} />
          <Step title="Documents" icon={<FileTextOutlined />} />
          <Step title="Terms" icon={<FileTextOutlined />} />
          <Step title="Review" icon={<FileTextOutlined />} />
        </Steps>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {currentStep === CreditApplicationStep.BUSINESS_INFO && renderBusinessInfoForm()}
          {currentStep === CreditApplicationStep.FINANCIAL_INFO && renderFinancialInfoForm()}
          {currentStep === CreditApplicationStep.DOCUMENTS && renderDocumentUploadForm()}
          {currentStep === CreditApplicationStep.TERMS && renderTermsAndConditions()}
          {currentStep === CreditApplicationStep.REVIEW && renderApplicationReview()}
        </div>
        
        <div className="lg:col-span-1">
          <Card title="Application Information" className="sticky top-8">
            <div className="space-y-4">
              <div>
                <Text strong className="block mb-2">Why Apply for Credit?</Text>
                <Text className="block text-gray-600">
                  Our credit program allows qualified businesses to purchase products now and pay later, helping you manage cash flow and grow your business.
                </Text>
              </div>
              
              <div>
                <Text strong className="block mb-2">Credit Terms</Text>
                <Text className="block text-gray-600">
                  We offer flexible credit terms of 30, 90, or 180 days, depending on your business needs and credit approval.
                </Text>
              </div>
              
              <div>
                <Text strong className="block mb-2">Application Process</Text>
                <Text className="block text-gray-600">
                  Complete the application form, upload required documents, and agree to the terms and conditions. Our credit team will review your application and notify you of the decision within 3-5 business days.
                </Text>
              </div>
              
              <div>
                <Text strong className="block mb-2">Need Help?</Text>
                <Text className="block text-gray-600">
                  Contact our credit department at credit@resortfresh.com or call (555) 123-4567.
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreditApplication;
