import React from 'react';
import { Layout, Menu, Button, Typography, theme } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAdminAuthStore } from '../../../stores/adminAuth';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AdminLayout: React.FC = () => {
  const { token: { colorBgContainer } } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuthStore();

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/admin/customers',
      icon: <UserOutlined />,
      label: 'Customers',
    },
    {
      key: '/admin/orders',
      icon: <ShoppingCartOutlined />,
      label: 'Orders',
    },
    {
      key: '/admin/products',
      icon: <ShopOutlined />,
      label: 'Products',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Title level={4}>Resort Fresh</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map(item => ({
            ...item,
            label: <Link to={item.key}>{item.label}</Link>,
          }))}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            type="text"
          >
            Logout
          </Button>
        </Header>
        <Content style={{ margin: '24px', minHeight: 280, background: colorBgContainer }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
