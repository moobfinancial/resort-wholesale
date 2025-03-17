import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Badge } from 'antd';
import { useCartStore } from '../../stores/cartStore';
import { useGuestCartStore } from '../../stores/guestCartStore';
import { useCustomerAuthStore } from '../../stores/customerAuth';

const CartIcon: React.FC = () => {
  const isAuthenticated = useCustomerAuthStore(state => state.isAuthenticated);
  const [itemCount, setItemCount] = useState(0);
  
  // Get cart stores with specific selectors to avoid re-renders
  const authItems = useCartStore(state => state.items);
  const guestItems = useGuestCartStore(state => state.items);
  const loadAuthCart = useCartStore(state => state.loadCart);
  const loadGuestCart = useGuestCartStore(state => state.loadCart);
  const getAuthCartItemCount = useCartStore(state => state.getCartItemCount);
  const getGuestCartItemCount = useGuestCartStore(state => state.getCartItemCount);
  
  // Load cart data when component mounts or auth status changes
  useEffect(() => {
    console.log('CartIcon: Auth status changed, loading cart. isAuthenticated =', isAuthenticated);
    if (isAuthenticated) {
      loadAuthCart();
    } else {
      loadGuestCart();
    }
  }, [isAuthenticated, loadAuthCart, loadGuestCart]);
  
  // Update item count whenever items change or auth status changes
  useEffect(() => {
    const count = isAuthenticated ? getAuthCartItemCount() : getGuestCartItemCount();
    setItemCount(count);
    
    console.log('CartIcon: Cart items updated', {
      isAuthenticated,
      authItemsCount: authItems.length,
      guestItemsCount: guestItems.length,
      itemCount: count
    });
  }, [isAuthenticated, authItems, guestItems, getAuthCartItemCount, getGuestCartItemCount]);

  return (
    <Link to="/cart" className="relative flex items-center">
      <Badge count={itemCount} showZero={false} size="small" offset={[0, 3]}>
        <ShoppingCartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
      </Badge>
    </Link>
  );
};

export default CartIcon;
