import React, { useEffect, useState } from 'react';
import { notificationService, NotificationEvents } from '../services/NotificationService';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch initial products on component mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);
  
  // Set up WebSocket listeners
  useEffect(() => {
    // Handle new product creation
    const handleProductCreated = (data) => {
      console.log('New product created:', data);
      setProducts(prevProducts => [data.product, ...prevProducts]);
      
      // Optional: Show a toast notification
      showToast('New product added: ' + data.product.name);
    };
    
    // Handle product updates
    const handleProductUpdated = (data) => {
      console.log('Product updated:', data);
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === data.product._id ? data.product : product
        )
      );
      
      // Optional: Show a toast notification
      showToast('Product updated: ' + data.product.name);
    };
    
    // Handle product deletion
    const handleProductDeleted = (data) => {
      console.log('Product deleted:', data);
      setProducts(prevProducts => 
        prevProducts.filter(product => product._id !== data.productId)
      );
      
      // Optional: Show a toast notification
      showToast('A product has been removed');
    };
    
    // Subscribe to WebSocket events
    const unsubscribeCreated = notificationService.subscribeToProductCreated(handleProductCreated);
    const unsubscribeUpdated = notificationService.subscribeToProductUpdated(handleProductUpdated);
    const unsubscribeDeleted = notificationService.subscribeToProductDeleted(handleProductDeleted);
    
    // Clean up subscriptions when component unmounts
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, []);
  
  if (loading) {
    return <div>Loading products...</div>;
  }
  
  return (
    <div>
      <h1>Products</h1>
      <ul className="product-list">
        {products.map(product => (
          <li key={product._id} className="product-item">
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            {!product.isAvailable && <span className="out-of-stock">Out of Stock</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Helper function to show toast notifications
function showToast(message) {
  // Implementation depends on your toast library, e.g.:
  // toast.success(message);
  console.log('TOAST:', message);
}
