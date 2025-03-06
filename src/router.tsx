import { createBrowserRouter } from 'react-router-dom';
import { adminRoutes } from './admin/routes';
import { customerRoutes } from './customer/routes';
import { RouteErrorBoundary } from './components/ErrorBoundary';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Layout from './components/Layout';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import Collections, { loader as collectionsLoader } from './pages/Collections';
import CollectionDetail, { loader as collectionDetailLoader } from './pages/CollectionDetail';
import ShippingPolicy from './pages/ShippingPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ReturnsAndExchanges from './pages/ReturnsAndExchanges';
import FAQ from './pages/FAQ';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      // Add specific routes for "new" and "featured" products listings
      {
        path: 'products/new-arrivals',
        element: <Products />,
      },
      {
        path: 'products/featured',
        element: <Products />,
      },
      // This route should come AFTER the more specific routes
      {
        path: 'products/:id',
        element: <ProductDetail />,
      },
      {
        path: 'about',
        element: <AboutUs />,
      },
      {
        path: 'contact',
        element: <ContactUs />,
      },
      {
        path: 'shipping-policy',
        element: <ShippingPolicy />,
      },
      {
        path: 'terms-and-conditions',
        element: <TermsAndConditions />,
      },
      {
        path: 'privacy-policy',
        element: <PrivacyPolicy />,
      },
      {
        path: 'returns-and-exchanges',
        element: <ReturnsAndExchanges />,
      },
      {
        path: 'login',
        element: <SignIn onClose={() => {}} onSignIn={() => {}} />,
      },
      {
        path: 'signup',
        element: <SignUp />,
      },
      {
        path: 'collections',
        element: <Collections />,
        loader: collectionsLoader,
      },
      {
        path: 'collections/:id',
        element: <CollectionDetail />,
        loader: collectionDetailLoader,
      },
      {
        path: 'faq',
        element: <FAQ />,
      },
      {
        path: 'cart',
        element: <Cart />,
      },
      {
        path: 'checkout',
        element: <Checkout />,
      },
      {
        path: 'order/confirmation/:orderNumber',
        element: <OrderConfirmation />,
      },
    ],
  },
  ...adminRoutes,
  ...customerRoutes,
]);
