import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';
import { Supplier } from '../types/supplier';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const response = await api.get<{ status: string; data: Supplier[] }>('/suppliers');
        if (response.data && response.data.status === 'success') {
          setSuppliers(response.data.data);
        } else {
          console.log('Unexpected data structure:', response.data);
          setSuppliers([]);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        // Return sensible default instead of throwing
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  return { suppliers, loading, error };
}
