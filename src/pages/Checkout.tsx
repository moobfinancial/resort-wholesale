import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  Form,
  Select,
  Divider,
  Typography,
  Radio,
  Spin,
  Alert,
  message
} from 'antd';
import { CreditCardOutlined, FileTextOutlined, BankOutlined, DollarOutlined } from '@ant-design/icons';
import { useCartStore } from '../stores/cartStore';
import { useCustomerAuthStore } from '../stores/customerAuth';
import { formatPrice } from '../utils/formatters';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// Extract Title component from Typography
const { Title, Text } = Typography;

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Payment form component
const PaymentForm = ({ onSubmit, processing, error, useCredit, availableCredit, total, onUseCredit }: {
  onSubmit: (event: React.FormEvent) => void;
  processing: boolean;
  error: string | null;
  useCredit: boolean;
  availableCredit: number;
  total: number;
  onUseCredit: (checked: boolean) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string | null>(null);
  
  // Calculate how much will be charged to the credit card
  const amountToCharge = useCredit ? Math.max(0, total - availableCredit) : total;
  const creditAmount = useCredit ? Math.min(total, availableCredit) : 0;
  
  // Check if we need to show the credit card form
  const showCreditCardForm = !useCredit || amountToCharge > 0;

  return (
    <form onSubmit={onSubmit}>
      {availableCredit > 0 && (
        <div className="mb-6">
          <Radio 
            checked={useCredit} 
            onChange={(e) => onUseCredit(e.target.checked)}
          >
            Use available store credit (${formatPrice(availableCredit)})
          </Radio>
          
          {useCredit && (
            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <Text>
                ${formatPrice(creditAmount)} will be charged to your store credit.
                {amountToCharge > 0 && (
                  <span> Remaining ${formatPrice(amountToCharge)} will be charged to your credit card.</span>
                )}
              </Text>
            </div>
          )}
        </div>
      )}
      
      {showCreditCardForm && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Details
            </label>
            <div className="p-3 border rounded-md">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
                onChange={(e) => {
                  setCardError(e.error ? e.error.message : null);
                }}
              />
            </div>
            {cardError && (
              <div className="mt-2 text-red-500 text-sm">{cardError}</div>
            )}
          </div>
        </>
      )}
      
      {error && (
        <div className="mb-4 text-red-500">{error}</div>
      )}
      
      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        icon={<CreditCardOutlined />}
        loading={processing}
        disabled={(!stripe || !elements) && showCreditCardForm}
      >
        {useCredit && amountToCharge === 0 
          ? 'Complete Purchase with Store Credit' 
          : 'Pay Now'}
      </Button>
    </form>
  );
};

// Credit application form
const CreditApplicationForm = ({ onApply, processing }: {
  onApply: (values: any) => void;
  processing: boolean;
}) => {
  return (
    <Form layout="vertical" onFinish={onApply}>
      <Form.Item
        name="amount"
        label="Credit Amount Requested"
        rules={[{ required: true, message: 'Please enter the credit amount' }]}
      >
        <Input prefix="$" type="number" min="100" />
      </Form.Item>
      
      <Form.Item
        name="term"
        label="Credit Term"
        rules={[{ required: true, message: 'Please select a credit term' }]}
      >
        <Select placeholder="Select a term">
          <Option value="DAYS_30">30 Days</Option>
          <Option value="DAYS_90">90 Days</Option>
          <Option value="DAYS_180">180 Days</Option>
        </Select>
      </Form.Item>
      
      <Form.Item
        name="businessType"
        label="Business Type"
        rules={[{ required: true, message: 'Please enter your business type' }]}
      >
        <Input />
      </Form.Item>
      
      <Form.Item
        name="taxId"
        label="Tax ID / EIN"
        rules={[{ required: true, message: 'Please enter your Tax ID' }]}
      >
        <Input />
      </Form.Item>
      
      <Form.Item
        name="agreementAccepted"
        valuePropName="checked"
        rules={[
          { 
            validator: (_, value) => 
              value ? Promise.resolve() : Promise.reject(new Error('You must accept the terms and conditions')),
          },
        ]}
      >
        <Radio>
          I agree to the <a href="/terms-and-conditions" target="_blank">Terms and Conditions</a> and <a href="/credit-agreement" target="_blank">Credit Agreement</a>
        </Radio>
      </Form.Item>
      
      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        icon={<DollarOutlined />}
        loading={processing}
      >
        Apply for Credit
      </Button>
    </Form>
  );
};

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    items, 
    loading: cartLoading, 
    getCartTotal, 
    createStripeCheckoutSession, 
    submitOrder
  } = useCartStore();
  
  // Get authentication state and user data with reactive updates
  const isAuthenticated = useCustomerAuthStore(state => state.isAuthenticated);
  const user = useCustomerAuthStore(state => state.user);
  
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [useCredit, setUseCredit] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCreditApplication, setShowCreditApplication] = useState<boolean>(false);
  const [applyingForCredit, setApplyingForCredit] = useState<boolean>(false);
  const [orderNotes, setOrderNotes] = useState<string>('');
  
  // Redirect to cart if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('Please sign in to checkout');
      // Redirect back to cart instead of login page
      // The cart page will show the auth modal
      navigate('/cart', { state: { showAuthModal: true } });
    }
  }, [isAuthenticated, navigate]);
  
  // Redirect to cart if no items
  useEffect(() => {
    if (items.length === 0 && !cartLoading) {
      navigate('/cart');
    }
  }, [items, cartLoading, navigate]);
  
  // Handle payment method change
  const handlePaymentMethodChange = (e: any) => {
    setPaymentMethod(e.target.value);
    setPaymentError(null);
  };
  
  // Handle use of available credit
  const handleUseCredit = (checked: boolean) => {
    setUseCredit(checked);
  };
  
  // Toggle credit application form
  const handleToggleCreditApplication = () => {
    setShowCreditApplication(!showCreditApplication);
  };
  
  // Handle credit application submission
  const handleCreditApplication = async (values: any) => {
    setApplyingForCredit(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/credit/apply`, values);
      
      if (!response.data.success) {
        const error = response.data.error;
        throw new Error(error.message || 'Failed to submit credit application');
      }
      
      message.success('Credit application submitted successfully!');
      setShowCreditApplication(false);
    } catch (error) {
      console.error('Credit application error:', error);
      message.error('Failed to submit credit application. Please try again.');
    } finally {
      setApplyingForCredit(false);
    }
  };
  
  // Handle order payment submission
  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);
    setPaymentError(null);
    
    try {
      if (paymentMethod === 'credit_card') {
        // Process Stripe payment
        const session = await createStripeCheckoutSession();
        if (session && session.sessionId) {
          // Redirect to Stripe checkout
          const stripe = await stripePromise;
          if (stripe) {
            const { error } = await stripe.redirectToCheckout({
              sessionId: session.sessionId
            });
            
            if (error) {
              throw new Error(error.message || 'Failed to redirect to checkout');
            }
          }
        } else {
          throw new Error('Failed to create checkout session');
        }
      } else if (paymentMethod === 'invoice') {
        // Submit order for invoice payment
        const result = await submitOrder('invoice', orderNotes);
        if (result && result.orderId) {
          message.success('Order submitted successfully!');
          navigate(`/order-confirmation/${result.orderId}`);
        } else {
          throw new Error('Failed to submit order');
        }
      } else if (paymentMethod === 'purchase_order') {
        // Submit order with purchase order
        const result = await submitOrder('purchase_order', orderNotes);
        if (result && result.orderId) {
          message.success('Order submitted successfully!');
          navigate(`/order-confirmation/${result.orderId}`);
        } else {
          throw new Error('Failed to submit order');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  // Calculate totals
  const subtotal = getCartTotal();
  const shippingCost = subtotal > 500 ? 0 : 10; // Free shipping over $500
  const total = subtotal + shippingCost;
  
  // Customer has available credit?
  const availableCredit = user?.creditLimit || 0;
  
  if (cartLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[70vh] flex justify-center items-center">
        <Spin size="large" />
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Title level={2} className="mb-8">Checkout</Title>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left section: Order details */}
        <div className="lg:col-span-2">
          {/* Order Items */}
          <Card className="mb-8" title="Order Items">
            {items.map((item) => {
              const product = item.product;
              const variant = item.variant;
              const price = variant?.price || product.price;
              const itemTotal = price * item.quantity;
              
              return (
                <div key={item.id} className="mb-4 last:mb-0">
                  <div className="flex">
                    <div className="w-16 h-16 mr-4">
                      <img
                        src={variant?.imageUrl || (product.images && product.images.length > 0 ? product.images[0].url : '/images/products/placeholder.svg')}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/products/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <Text className="font-medium">{product.name}</Text>
                        <Text>${formatPrice(itemTotal)}</Text>
                      </div>
                      {variant && (
                        <div className="text-xs text-gray-500">
                          {variant.name && <span className="mr-3">Option: {variant.name}</span>}
                        </div>
                      )}
                      <Text className="text-sm text-gray-500">
                        Qty: {item.quantity} × ${formatPrice(price)}
                      </Text>
                    </div>
                  </div>
                  
                  {item !== items[items.length - 1] && <Divider className="my-4" />}
                </div>
              );
            })}
          </Card>
          
          {/* Payment Method Selection */}
          <Card className="mb-8" title="Payment Method">
            <Radio.Group 
              onChange={handlePaymentMethodChange}
              value={paymentMethod}
              className="flex flex-col gap-4"
            >
              <Radio value="credit_card" className="flex items-start gap-2">
                <CreditCardOutlined className="mt-1" />
                <div>
                  <div className="font-medium">Credit Card</div>
                  <div className="text-gray-500 text-sm">Pay using your credit or debit card</div>
                </div>
              </Radio>
              
              <Radio value="purchase_order" className="flex items-start gap-2">
                <FileTextOutlined className="mt-1" />
                <div>
                  <div className="font-medium">Purchase Order</div>
                  <div className="text-gray-500 text-sm">Use a purchase order number for payment</div>
                </div>
              </Radio>
              
              <Radio value="invoice" className="flex items-start gap-2">
                <BankOutlined className="mt-1" />
                <div>
                  <div className="font-medium">Net 30 Days Credit</div>
                  <div className="text-gray-500 text-sm">
                    Invoice payment with 30-day terms
                    {!user?.hasCreditAccount && (
                      <div className="mt-1">
                        <Link to="/customer/credit/apply" className="text-blue-500 hover:underline">
                          Apply for Credit Terms
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </Radio>
            </Radio.Group>
            
            {(paymentMethod === 'invoice' || paymentMethod === 'purchase_order') && (
              <div className="mt-6">
                <Form.Item label="Order Notes" className="mb-0">
                  <Input.TextArea 
                    rows={4} 
                    placeholder="Add any special instructions or your PO number here"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                  />
                </Form.Item>
              </div>
            )}
          </Card>
          
          {/* Credit Application Form */}
          {showCreditApplication && (
            <Card className="mb-8" title="Credit Application">
              <CreditApplicationForm 
                onApply={handleCreditApplication}
                processing={applyingForCredit}
              />
            </Card>
          )}
        </div>
        
        {/* Right section: Order summary */}
        <div>
          <Card title="Order Summary" className="mb-8 sticky top-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Text>Subtotal</Text>
                <Text className="font-medium">${formatPrice(subtotal)}</Text>
              </div>
              
              <div className="flex justify-between">
                <Text>Shipping</Text>
                <Text className="font-medium">
                  {shippingCost === 0 ? 'Free' : `$${formatPrice(shippingCost)}`}
                </Text>
              </div>
              
              <Divider className="my-2" />
              
              <div className="flex justify-between">
                <Text className="font-bold">Total</Text>
                <Text className="font-bold">${formatPrice(total)}</Text>
              </div>
            </div>
            
            <div className="mt-6">
              {paymentMethod === 'credit_card' ? (
                <Elements stripe={stripePromise}>
                  <PaymentForm 
                    onSubmit={handlePayment}
                    processing={processing}
                    error={paymentError}
                    useCredit={useCredit}
                    availableCredit={availableCredit}
                    total={total}
                    onUseCredit={handleUseCredit}
                  />
                </Elements>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handlePayment}
                  loading={processing}
                >
                  {paymentMethod === 'invoice' ? 'Submit Order for Invoicing' : 'Generate Purchase Order'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
