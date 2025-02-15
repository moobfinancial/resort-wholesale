import React from 'react';
import { Routes, Route } from 'react-router-dom';
import InventoryList from './InventoryList';
import StockAdjustment from './StockAdjustment';

export default function InventoryRoutes() {
  return (
    <Routes>
      <Route index element={<InventoryList />} />
      <Route path="adjust/:id" element={<StockAdjustment />} />
    </Routes>
  );
}
