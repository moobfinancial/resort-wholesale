import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useCustomerAuthStore } from '../stores/customerAuth';
import { formatPrice } from '../utils/formatters';
import { Button, Card, Checkbox, Divider, Form, Input, Radio, Select, Spin, Typography, message } from 'antd';
import { CreditCardOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../lib/api';

const { Title, Text } = Typography;
const { Option } = Select;

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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
          <Checkbox 
            checked={useCredit} 
            onChange={(e) => onUseCredit(e.target.checked)}
          >
            Use available store credit (${formatPrice(availableCredit)})
          </Checkbox>
          
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
        <Checkbox>
          I agree to the <a href="/terms-and-conditions" target="_blank">Terms and Conditions</a> and <a href="/credit-agreement" target="_blank">Credit Agreement</a>
        </Checkbox>
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
  const { items, loading: cartLoading, getCartTotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useCustomerAuthStore();
  
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [useCredit, setUseCredit] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCreditApplication, setShowCreditApplication] = useState<boolean>(false);
  const [applyingForCredit, setApplyingForCredit] = useState<boolean>(false);
  
  // Shipping and billing info
  const [shippingInfo, setShippingInfo] = useState({
    name: user?.contactName || '',
    address: user?.address ? JSON.parse(user.address as string) : {},
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  // Calculate totals
  const subtotal = getCartTotal();
  const tax = subtotal * 0.085; // 8.5% tax
  const shipping = 10; // Flat shipping rate
  const total = subtotal + tax + shipping;
  
  // Get available credit
  const availableCredit = user?.availableCredit ? parseFloat(user.availableCredit.toString()) : 0;
  const hasCreditAvailable = availableCredit > 0;
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    }
    
    if (items.length === 0 && !cartLoading) {
      navigate('/cart');
    }
  }, [isAuthenticated, items, cartLoading, navigate]);
  
  const handlePaymentMethodChange = (e: any) => {
    setPaymentMethod(e.target.value);
    
    // Reset useCredit when changing payment method
    if (e.target.value !== 'credit_card') {
      setUseCredit(false);
    }
  };
  
  const handleUseCredit = (checked: boolean) => {
    setUseCredit(checked);
  };
  
  const handleSubmitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (items.length === 0) {
      message.error('Your cart is empty');
      return;
    }
    
    setProcessing(true);
    setPaymentError(null);
    
    try {
      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          variantId: item.variant?.id,
        })),
        paymentMethod,
        useCredit,
      };
      
      // Create order
      const response = await api.post('orders', orderData);
      
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to create order');
      }
      
      const order = response.data as any;
      
      // If using credit card and there's an amount to charge
      if (paymentMethod === 'credit_card' && (!useCredit || total > availableCredit)) {
        const stripe = await stripePromise;
        const elements = document.querySelector('#payment-form');
        
        if (!stripe || !elements) {
          throw new Error('Stripe has not been initialized');
        }
        
        // Confirm card payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(order.stripeClientSecret, {
          payment_method: {
            card: elements.querySelector('.StripeElement') as any,
            billing_details: {
              name: shippingInfo.name,
              email: shippingInfo.email,
            },
          },
        });
        
        if (error) {
          throw new Error(error.message || 'Payment failed');
        }
        
        if (paymentIntent?.status !== 'succeeded') {
          throw new Error('Payment was not successful');
        }
      }
      
      // Clear cart and redirect to confirmation page
      await clearCart();
      navigate(`/order-confirmation/${order.id}`);
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : 'An error occurred during checkout');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleApplyForCredit = async (values: any) => {
    setApplyingForCredit(true);
    
    try {
      // Update user profile with business info if needed
      if (values.businessType || values.taxId) {
        await api.post('customers/update-profile', {
          businessType: values.businessType,
          taxId: values.taxId,
        });
      }
      
      // Submit credit application
      const response = await api.post('orders/apply-credit', {
        amount: parseFloat(values.amount),
        term: values.term,
        documents: [], // Would normally include uploaded documents
      });
      
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to submit credit application');
      }
      
      message.success('Credit application submitted successfully');
      setShowCreditApplication(false);
      
    } catch (error) {
      console.error('Credit application error:', error);
      message.error(error instanceof Error ? error.message : 'Failed to submit credit application');
    } finally {
      setApplyingForCredit(false);
    }
  };
  
  if (cartLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Title level={2} className="mb-8">Checkout</Title>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          {/* Shipping Information */}
          <Card title="Shipping Information" className="mb-8">
            <Form layout="vertical" initialValues={shippingInfo}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[{ required: true, message: 'Please enter your name' }]}
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input />
                </Form.Item>
              </div>
              
              <Form.Item
                name={['address', 'line1']}
                label="Address"
                rules={[{ required: true, message: 'Please enter your address' }]}
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                name={['address', 'line2']}
                label="Apartment, suite, etc. (optional)"
              >
                <Input />
              </Form.Item>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Form.Item
                  name={['address', 'city']}
                  label="City"
                  rules={[{ required: true, message: 'Please enter your city' }]}
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name={['address', 'state']}
                  label="State"
                  rules={[{ required: true, message: 'Please enter your state' }]}
                >
                  <Input />
                </Form.Item>
                
                <Form.Item
                  name={['address', 'postalCode']}
                  label="Postal Code"
                  rules={[{ required: true, message: 'Please enter your postal code' }]}
                >
                  <Input />
                </Form.Item>
              </div>
              
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Please enter your phone number' }]}
              >
                <Input />
              </Form.Item>
            </Form>
          </Card>
          
          {/* Payment Method */}
          <Card title="Payment Method" className="mb-8">
            <Radio.Group 
              onChange={handlePaymentMethodChange} 
              value={paymentMethod}
              className="w-full"
            >
              <div className="space-y-4">
                <Radio value="credit_card" className="w-full pb-4 border-b">
                  <div className="flex items-center">
                    <CreditCardOutlined className="mr-2" />
                    <span>Credit Card</span>
                  </div>
                </Radio>
                
                {!hasCreditAvailable && (
                  <div className="pl-6 mt-2">
                    <Button 
                      type="link" 
                      onClick={() => setShowCreditApplication(true)}
                      className="p-0"
                    >
                      Apply for Store Credit
                    </Button>
                  </div>
                )}
                
                {showCreditApplication && (
                  <Card className="mt-4 ml-6" title="Credit Application">
                    <CreditApplicationForm 
                      onApply={handleApplyForCredit}
                      processing={applyingForCredit}
                    />
                  </Card>
                )}
              </div>
            </Radio.Group>
            
            {paymentMethod === 'credit_card' && (
              <div className="mt-6" id="payment-form">
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    onSubmit={handleSubmitPayment}
                    processing={processing}
                    error={paymentError}
                    useCredit={useCredit}
                    availableCredit={availableCredit}
                    total={total}
                    onUseCredit={handleUseCredit}
                  />
                </Elements>
              </div>
            )}
          </Card>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card title="Order Summary" className="sticky top-8">
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-4">
                {items.map((item) => {
                  const product = item.product;
                  const variant = item.variant;
                  const price = variant?.price || product.price;
                  const itemTotal = price * item.quantity;
                  
                  return (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <Text className="font-medium">{product.name}</Text>
                        {variant && (
                          <div className="text-sm text-gray-500">
                            {Object.entries(variant.attributes).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </div>
                      </div>
                      <Text>${formatPrice(itemTotal)}</Text>
                    </div>
                  );
                })}
              </div>
              
              <Divider className="my-4" />
              
              <div className="flex justify-between">
                <Text>Subtotal</Text>
                <Text className="font-medium">${formatPrice(subtotal)}</Text>
              </div>
              
              <div className="flex justify-between">
                <Text>Shipping</Text>
                <Text className="font-medium">${formatPrice(shipping)}</Text>
              </div>
              
              <div className="flex justify-between">
                <Text>Tax</Text>
                <Text className="font-medium">${formatPrice(tax)}</Text>
              </div>
              
              <Divider className="my-4" />
              
              <div className="flex justify-between">
                <Text className="text-lg font-medium">Total</Text>
                <Text className="text-lg font-medium">${formatPrice(total)}</Text>
              </div>
              
              {paymentMethod !== 'credit_card' && (
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<ShoppingCartOutlined />}
                  onClick={handleSubmitPayment}
                  loading={processing}
                  className="mt-6"
                >
                  Complete Order
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
