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
    ],
  },
  ...adminRoutes,
  ...customerRoutes,
]);
