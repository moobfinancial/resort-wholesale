import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import ProductView from './ProductView';
import EditProduct from './EditProduct';

export default function ProductRoutes() {
  return (
    <Routes>
      <Route index element={<ProductList />} />
      <Route path="new" element={<ProductForm />} />
      <Route path=":id" element={<ProductView />} />
      <Route path=":id/edit" element={<EditProduct />} />
    </Routes>
  );
}
