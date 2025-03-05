import React, { useState, useEffect, useTransition } from 'react';
import {
  Card,
  Table,
  Button,
  message,
  Typography,
  Popconfirm,
  Select,
  Image,
  Breadcrumb,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../../utils/api';
import { useParams, Link } from 'react-router-dom';
import { formatPrice } from '../../../utils/formatters';
import { ComponentErrorBoundary } from '../../../components/ErrorBoundary';

const { Title } = Typography;
const { Option } = Select;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number | string;
  imageUrl: string;
  category: string;
  sku: string;
  stock: number;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
}

const CollectionProducts: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      startTransition(() => {
        fetchCollection();
        fetchCollectionProducts();
        fetchAvailableProducts();
      });
    }
  }, [id]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/collections/${id}`);

      if (response.data && response.data.status === 'success') {
        if (response.data.data) {
          setCollection(response.data.data);
        } else {
          console.error('Unexpected data structure:', response.data);
          setError('Unexpected data structure in API response');
          setCollection(null);
        }
      } else if (response.status === 200 && response.data) {
        setCollection(response.data);
      } else {
        console.error('Unexpected response format:', response);
        setError('Unexpected response format from API');
        setCollection(null);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to fetch collection:', error.message);
        setError(error.message);
      } else {
        console.error('Failed to fetch collection:', error);
        setError('Failed to fetch collection. Please try again.');
      }
      setCollection(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/collections/${id}/products`);

      if (response.data && response.data.status === 'success') {
        if (Array.isArray(response.data.data)) {
          setProducts(response.data.data);
        } else if (response.data.data && Array.isArray(response.data.data.products)) {
          setProducts(response.data.data.products);
        } else {
          console.error('Unexpected data structure:', response.data);
          setError('Unexpected data structure in API response');
          setProducts([]);
        }
      } else if (response.status === 200 && Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        console.error('Unexpected response format:', response);
        setError('Unexpected response format from API');
        setProducts([]);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to fetch collection products:', error.message);
        setError(error.message);
      } else {
        console.error('Failed to fetch collection products:', error);
        setError('Failed to fetch collection products. Please try again.');
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching available products...');
      const response = await api.get('/products');
      console.log('Available products response:', response);

      if (response.data && response.data.status === 'success') {
        // Check for different data structures based on API response format
        if (response.data.data && Array.isArray(response.data.data.products)) {
          console.log('Found products array in response.data.data.products');
          setAvailableProducts(response.data.data.products);
        } else if (response.data.data && response.data.data.hasOwnProperty('products') && Array.isArray(response.data.data.products)) {
          console.log('Found products array in response.data.data.products');
          setAvailableProducts(response.data.data.products);
        } else if (Array.isArray(response.data.data)) {
          console.log('Found array in response.data.data');
          setAvailableProducts(response.data.data);
        } else if (response.data.data && typeof response.data.data === 'object') {
          console.log('Found object in response.data.data, keys:', Object.keys(response.data.data));
          // Try to extract products from any property that might contain them
          const possibleProductArrays = Object.values(response.data.data).filter(val => Array.isArray(val));
          if (possibleProductArrays.length > 0) {
            console.log('Found potential product arrays:', possibleProductArrays.length);
            setAvailableProducts(possibleProductArrays[0]);
          } else {
            console.error('No product arrays found in data object');
            setAvailableProducts([]);
          }
        } else {
          console.error('Unexpected data structure:', response.data);
          setError('Unexpected data structure in API response');
          setAvailableProducts([]);
        }
      } else if (response.status === 200) {
        if (Array.isArray(response.data)) {
          console.log('Response data is an array');
          setAvailableProducts(response.data);
        } else if (response.data && response.data.products && Array.isArray(response.data.products)) {
          console.log('Found products array directly in response.data.products');
          setAvailableProducts(response.data.products);
        } else {
          console.error('Unexpected response format:', response);
          setError('Unexpected response format from API');
          setAvailableProducts([]);
        }
      } else {
        console.error('Unexpected response format:', response);
        setError('Unexpected response format from API');
        setAvailableProducts([]);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to fetch available products:', error.message);
        setError(error.message);
      } else {
        console.error('Failed to fetch available products:', error);
        setError('Failed to fetch available products. Please try again.');
      }
      setAvailableProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProducts = async () => {
    if (selectedProductIds.length === 0) {
      message.warning('Please select at least one product to add');
      return;
    }

    try {
      console.log('Adding products to collection:', selectedProductIds);
      
      const payload = {
        productIds: selectedProductIds
      };
      
      console.log('Sending payload:', payload);
      
      const response = await api.post(`/collections/${id}/products`, payload);
      
      console.log('Add products response:', response);
      
      message.success('Products added to collection successfully');
      setSelectedProductIds([]);
      fetchCollectionProducts();
      fetchAvailableProducts();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to add products to collection:', error.message);
        setError(error.message);
      } else {
        console.error('Failed to add products to collection:', error);
        setError('Failed to add products to collection. Please try again.');
      }
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      await api.delete(`/collections/${id}/products/${productId}`);
      message.success('Product removed from collection successfully');
      fetchCollectionProducts();
      fetchAvailableProducts();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to remove product from collection:', error.message);
        setError(error.message);
      } else {
        console.error('Failed to remove product from collection:', error);
        setError('Failed to remove product from collection. Please try again.');
      }
    }
  };

  const columns: ColumnsType<Product> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (imageUrl: string) => (
        <Image
          src={imageUrl || '/images/products/placeholder.jpg'}
          alt="Product"
          style={{ width: 50, height: 50, objectFit: 'cover' }}
          preview={false}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // First try loading with /images/products/ path if not already there
            if (!target.src.includes('/images/products/') && !target.src.includes('placeholder')) {
              const filename = target.src.split('/').pop();
              target.src = `/images/products/${filename || 'placeholder.jpg'}`;
            } 
            // Then try with /uploads/products/ path if the above fails
            else if (!target.src.includes('/uploads/products/') && !target.src.includes('placeholder')) {
              const filename = target.src.split('/').pop();
              target.src = `/uploads/products/${filename || 'placeholder.jpg'}`;
            }
            // Finally, use the placeholder
            else if (!target.src.includes('placeholder')) {
              target.src = '/images/products/placeholder.jpg';
            }
          }}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${formatPrice(price)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Are you sure you want to remove this product from the collection?"
          onConfirm={() => handleRemoveProduct(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            size="small"
            title="Remove this product from the collection (does not delete the product)"
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p>{error}</p>
          <Button 
            type="primary" 
            danger 
            className="mt-2" 
            onClick={() => {
              setError(null);
              startTransition(() => {
                fetchCollection();
                fetchCollectionProducts();
                fetchAvailableProducts();
              });
            }}
            title="Retry loading data after an error occurred"
          >
            Retry
          </Button>
        </div>
      )}
      
      <Card>
        <Breadcrumb 
          className="mb-4"
          items={[
            {
              title: (
                <Link to="/admin/collections">
                  <ArrowLeftOutlined className="mr-2" />
                  Collections
                </Link>
              )
            },
            {
              title: collection?.name || 'Loading...'
            }
          ]}
        />

        <div className="mb-6">
          <Title level={2}>{collection?.name} Products</Title>
          <p className="text-gray-500">{collection?.description}</p>
        </div>

        <div className="mb-4 flex space-x-2">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder={loading || isPending ? "Loading products..." : "Select products to add"}
            value={selectedProductIds}
            onChange={setSelectedProductIds}
            optionFilterProp="children"
            showSearch
            loading={loading || isPending}
            disabled={loading || isPending}
          >
            {availableProducts
              .filter(p => !products.some(cp => cp.id === p.id))
              .map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </Option>
              ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddProducts}
            disabled={selectedProductIds.length === 0}
            title="Add selected products to this collection"
          >
            Add Products
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading || isPending}
        />
      </Card>
    </div>
  );
};

const CollectionProductsWithErrorBoundary: React.FC = () => {
  return (
    <ComponentErrorBoundary>
      <CollectionProducts />
    </ComponentErrorBoundary>
  );
};

export default CollectionProductsWithErrorBoundary;
