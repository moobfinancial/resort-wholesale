import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Badge } from 'antd';
import { useCartStore } from '../../stores/cartStore';

const CartIcon: React.FC = () => {
  const { items, loadCart, getCartItemCount } = useCartStore();

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const itemCount = getCartItemCount();

  return (
    <Link to="/cart" className="relative flex items-center">
      <Badge count={itemCount} showZero={false} size="small">
        <ShoppingCartOutlined className="text-xl" />
      </Badge>
    </Link>
  );
};

export default CartIcon;
