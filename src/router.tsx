import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { adminRoutes } from './admin/routes';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Dashboard from './components/dashboard/Dashboard';

const FEATURED_PRODUCTS = [
  {
    id: 'featured-1',
    name: 'Handwoven Jamaican Basket',
    description: 'Traditional handwoven basket made from local materials',
    price: 79.99,
    wholesalePrice: 59.99,
    image: '/images/products/basket.jpg'
  },
  {
    id: 'featured-2',
    name: 'Seashell Necklace',
    description: 'Handcrafted necklace with authentic Caribbean seashells',
    price: 45.99,
    wholesalePrice: 35.99,
    image: '/images/products/necklace.jpg'
  },
  {
    id: 'featured-3',
    name: 'Jamaican Art Print',
    description: 'Limited edition print by local Jamaican artist',
    price: 129.99,
    wholesalePrice: 99.99,
    image: '/images/products/art.jpg'
  },
  {
    id: 'featured-4',
    name: 'Beach Hat Collection',
    description: 'Set of handwoven beach hats in various styles',
    price: 89.99,
    wholesalePrice: 69.99,
    image: '/images/products/hats.jpg'
  }
];

const HomePage = () => {
  const pricingMode = 'retail';
  
  return (
    <>
      <Hero />
      <WelcomeSection />
      <FeaturedCategories />
      <JustArrived pricingMode={pricingMode} />
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <a 
              href="#" 
              className="flex items-center text-blue-600 hover:text-blue-800 transition"
            >
              View all products
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {FEATURED_PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                pricingMode={pricingMode}
              />
            ))}
          </div>
        </div>
      </section>
      <Testimonials />
      <Newsletter />
    </>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
    ],
  },
  ...adminRoutes,
]);
