'use client';

import { useState, useEffect } from 'react';
import ProductModal from './ProductModal';

interface Product {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  image: string;
  category: string[];
  tags: string[];
  description: string;
  merchant: string;
  merchant_id?: string;
  location: string;
  rating: number;
  inStock: boolean;
}

export default function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?limit=8');
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      setError('Error fetching products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  // Map category names to filter classes for the masonry filter
  const getCategoryClass = (categories: string[]) => {
    const classMap: { [key: string]: string } = {
      'Coffee': 'Dresses',
      'Beverages': 'Dresses',
      'Breakfast': 'Dresses Jacket',
      'Bakery': 'Tops',
      'Groceries': 'Outerwear',
      'Fresh Produce': 'Tops Jacket',
      'Dairy': 'Dresses',
      'Pantry': 'Outerwear',
    };

    for (const cat of categories) {
      if (classMap[cat]) {
        return classMap[cat];
      }
    }
    return 'Dresses';
  };

  return (
    <div className="clearfix">
      <ul id="masonry" className="row g-xl-4 g-3">
        {products.map((product, idx) => (
          <li
            key={product.id}
            className={`card-container col-6 col-xl-3 col-lg-3 col-md-4 col-sm-6 ${getCategoryClass(product.category)} wow fadeInUp`}
            data-wow-delay={`${(idx % 4) * 0.2 + 0.2}s`}
          >
            <div className="shop-card">
              <div className="dz-media">
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: '280px', objectFit: 'cover' }}
                />
                <div className="shop-meta">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="btn btn-secondary btn-md btn-rounded"
                  >
                    <i className="fa-solid fa-eye d-md-none d-block"></i>
                    <span className="d-md-block d-none">Quick View</span>
                  </button>
                </div>
              </div>
              <div className="dz-content">
                <h5 className="title">
                  <button type="button" className="btn p-0 border-0" onClick={() => setSelectedProduct(product)}>{product.name}</button>
                </h5>
                <h5 className="price">${product.price.toFixed(2)}</h5>
              </div>
              {product.discount && (
                <div className="product-tag">
                  <span className="badge ">{product.discount}</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
