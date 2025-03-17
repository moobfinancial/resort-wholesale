import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useGuestCartStore } from '../stores/guestCartStore';
import { formatPrice } from '../utils/formatters';
import { Button, Card, Divider, Empty, InputNumber, Spin, Typography } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ShoppingOutlined } from '@ant-design/icons';
import { toast } from 'react-hot-toast';
import { useCustomerAuthStore } from '../stores/customerAuth';
import AuthModal from '../components/auth/AuthModal';

const { Title, Text } = Typography;

const Cart: React.FC = () => {
  const navigate = useNavigate();
  // Get authentication state and watch for changes
  const isAuthenticated = useCustomerAuthStore(state => state.isAuthenticated);
  
  // Use the appropriate cart store based on authentication status
  const cartStore = isAuthenticated ? useCartStore() : useGuestCartStore();
  
  // Debug authentication state
  useEffect(() => {
    console.log('Authentication state in Cart:', isAuthenticated);
  }, [isAuthenticated]);
  
  const { 
    items, 
    loading, 
    error, 
    loadCart, 
    removeItem, 
    updateQuantity, 
    getCartTotal,
    getCartItemCount
  } = cartStore;

  useEffect(() => {
    console.log('Cart component: Loading cart. isAuthenticated =', isAuthenticated);
    loadCart();
  }, [loadCart, isAuthenticated]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleQuantityChange = async (itemId: string, quantity: number | null) => {
    if (quantity && quantity > 0) {
      await updateQuantity(itemId, quantity);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItem(itemId);
    toast.success('Item removed from cart');
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();

  // Check if we're returning from login or if we need to show the auth modal
  useEffect(() => {
    console.log('Cart: Authentication state changed:', isAuthenticated);
    console.log('Cart: Location state:', location.state);
    
    // If we just logged in, transfer guest cart items to the user cart
    if (isAuthenticated) {
      console.log('User is authenticated, checking for guest cart items to transfer');
      transferGuestCartToUserCart();
    }
    
    // If we're redirected from checkout, show the auth modal
    if (location.state?.showAuthModal) {
      setIsAuthModalOpen(true);
      // Clear the state to prevent modal from showing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [isAuthenticated, location]);

  // Function to transfer guest cart items to user cart
  const transferGuestCartToUserCart = async () => {
    const guestCartItems = useGuestCartStore.getState().items;
    console.log('Transferring guest cart items to user cart:', guestCartItems);
    
    if (guestCartItems.length > 0) {
      try {
        const { addItem } = useCartStore.getState();
        
        // Add each guest cart item to the user cart one by one
        for (const item of guestCartItems) {
          console.log('Transferring item:', item);
          try {
            await addItem(item.productId, item.quantity, item.variantId);
            console.log('Item transferred successfully');
          } catch (itemError) {
            console.error('Error transferring item:', itemError);
            // Continue with next item even if this one fails
          }
        }
        
        // Clear the guest cart
        await useGuestCartStore.getState().clearCart();
        
        // Reload the user cart
        loadCart();
        
        toast.success('Your cart items have been transferred to your account');
      } catch (error) {
        console.error('Error transferring cart items:', error);
        toast.error('Failed to transfer some items to your cart');
      }
    } else {
      console.log('No guest cart items to transfer');
    }
  };

  // Handle successful sign in
  const handleSignIn = () => {
    setIsAuthModalOpen(false);
    // The transferGuestCartToUserCart function will be called by the useEffect above
  };

  const handleCheckout = () => {
    // Force re-check of authentication state
    const currentAuthState = useCustomerAuthStore.getState().isAuthenticated;
    console.log('Current auth state in handleCheckout:', currentAuthState);
    
    if (!currentAuthState) {
      // Show auth modal instead of redirecting
      setIsAuthModalOpen(true);
      return;
    }
    
    // User is authenticated, proceed to checkout
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Title level={2} className="mb-8">Your Cart</Title>
        <Card className="mb-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Your cart is empty"
          >
            <Link to="/products">
              <Button type="primary" icon={<ShoppingOutlined />} size="large">
                Continue Shopping
              </Button>
            </Link>
          </Empty>
        </Card>
      </div>
    );
  }

  const cartTotal = getCartTotal();
  const itemCount = getCartItemCount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignIn={handleSignIn}
      />
      <Title level={2} className="mb-8">Your Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})</Title>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card className="mb-8">
            {items.map((item) => {
              const product = item.product;
              const variant = item.variant;
              const price = variant?.price || product.price;
              
              // Handle image URL safely - product only has images array, not imageUrl
              const imageUrl = variant?.imageUrl || 
                (product.images && product.images.length > 0 ? product.images[0] : '/images/products/placeholder.svg');
              
              const itemTotal = price * item.quantity;
              
              return (
                <div key={item.id} className="mb-6 last:mb-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-24 h-24 mb-4 sm:mb-0 sm:mr-6">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/products/placeholder.svg';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div>
                          <Link to={`/products/${product.id}`} className="text-lg font-medium text-gray-900 hover:text-blue-600">
                            {product.name}
                          </Link>
                          
                          {/* Variant attributes - only show if variant exists and has attributes property */}
                          {variant && 'attributes' in variant && variant.attributes && (
                            <div className="mt-1 text-sm text-gray-500">
                              {Object.entries(variant.attributes).map(([key, value]) => (
                                <span key={key} className="mr-4">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-1 text-sm text-gray-500">
                            SKU: {variant?.sku || 'N/A'}
                          </div>
                        </div>
                        
                        <div className="mt-4 sm:mt-0 text-right">
                          <div className="text-lg font-medium text-gray-900">
                            ${formatPrice(price)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex items-center">
                          <Text className="mr-2">Qty:</Text>
                          <InputNumber
                            min={1}
                            value={item.quantity}
                            onChange={(value) => handleQuantityChange(item.id, value)}
                            className="w-20"
                          />
                        </div>
                        
                        <div className="mt-4 sm:mt-0 flex items-center">
                          <Text className="mr-4">
                            Subtotal: <span className="font-medium">${formatPrice(itemTotal)}</span>
                          </Text>
                          
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Divider className="my-6" />
                </div>
              );
            })}
          </Card>
          
          <div className="flex justify-between">
            <Link to="/products">
              <Button icon={<ShoppingOutlined />} size="large">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card title="Order Summary" className="sticky top-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Text>Subtotal</Text>
                <Text className="font-medium">${formatPrice(cartTotal)}</Text>
              </div>
              
              <div className="flex justify-between">
                <Text>Shipping</Text>
                <Text className="font-medium">Calculated at checkout</Text>
              </div>
              
              <div className="flex justify-between">
                <Text>Tax</Text>
                <Text className="font-medium">Calculated at checkout</Text>
              </div>
              
              <Divider className="my-4" />
              
              <div className="flex justify-between">
                <Text className="text-lg font-medium">Estimated Total</Text>
                <Text className="text-lg font-medium">${formatPrice(cartTotal)}</Text>
              </div>
              
              <Button
                type="primary"
                size="large"
                block
                icon={<ShoppingCartOutlined />}
                onClick={handleCheckout}
                className="mt-6"
              >
                Proceed to Checkout
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
