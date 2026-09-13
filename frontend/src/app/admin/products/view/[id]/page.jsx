"use client";

import { useState, useEffect } from "react";
import axios from 'axios';
import apiClient from '@/services/apiClient';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  FiEdit,
  FiArrowLeft,
  FiPackage,
  FiBox,
} from "react-icons/fi";
import { Loader2 } from 'lucide-react';

import styles from "./viewProduct.module.css";

export default function ViewProductPage({ params }) {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await apiClient.get(`/products/${params.id}`);
      if (res.data?.data) {
        setProduct(res.data.data);
      } else {
        toast.error("Product not found");
      }
    } catch (error) {
      console.error('Failed to fetch product', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Product Not Found</h2>
        <button className={styles.backBtn} onClick={() => router.push('/admin/products/view')} style={{ marginTop: '20px' }}>
          <FiArrowLeft /> Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Toaster position="top-right" />
      <div className={styles.main}>
        
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Product Details</h1>
            <p>View detailed information about this product</p>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.backBtn}
              onClick={() => router.push('/admin/products/view')}
            >
              <FiArrowLeft /> Back
            </button>
            <button
              className={styles.editBtn}
              onClick={() => router.push(`/admin/products/edit/${product.id}`)}
            >
              <FiEdit /> Edit Product
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.left}>
            
            <div className={styles.card}>
              <h2><FiPackage /> Product Information</h2>
              
              <div className={styles.grid}>
                <div className={styles.detailGroup}>
                  <label>Product Name</label>
                  <p>{product.name || 'N/A'}</p>
                </div>
                
                <div className={styles.detailGroup}>
                  <label>Product Code</label>
                  <p>{product.code || 'N/A'}</p>
                </div>

                <div className={styles.detailGroup}>
                  <label>SKU</label>
                  <p>{product.sku || 'N/A'}</p>
                </div>

                <div className={styles.detailGroup}>
                  <label>Barcode</label>
                  <p>{product.barcodes?.[0]?.barcode || 'N/A'}</p>
                </div>

                <div className={styles.detailGroup}>
                  <label>Category</label>
                  <p>{product.category?.name || 'N/A'}</p>
                </div>

                <div className={styles.detailGroup}>
                  <label>Brand</label>
                  <p>{product.brand?.name || 'N/A'}</p>
                </div>

                <div className={styles.detailGroup}>
                  <label>Unit</label>
                  <p>{product.unit?.name ? `${product.unit.name} (${product.unit.code || product.unit.shortName})` : 'N/A'}</p>
                </div>

                <div className={styles.detailGroup}>
                  <label>Status</label>
                  <p>
                    <span className={product.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}>
                      {product.status || 'N/A'}
                    </span>
                  </p>
                </div>
              </div>

              <div className={styles.detailGroup} style={{ marginTop: '20px' }}>
                <label>Description</label>
                <p style={{ marginTop: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {product.description || 'No description provided.'}
                </p>
              </div>
            </div>

            <div className={styles.card}>
              <h2>Pricing</h2>
              <div className={styles.grid}>
                <div className={styles.detailGroup}>
                  <label>Purchase Price (Cost)</label>
                  <p>${product.costPrice || '0.00'}</p>
                </div>

                <div className={styles.detailGroup}>
                  <label>Selling Price</label>
                  <p>${product.sellingPrice || '0.00'}</p>
                </div>

                <div className={styles.detailGroup}>
                  <label>Tax (%)</label>
                  <p>{product.tax || '0'}%</p>
                </div>

                <div className={styles.detailGroup}>
                  <label>Discount</label>
                  <p>
                    {product.discountValue ? (
                      `${product.discountType === 'FIXED' ? '$' : ''}${product.discountValue}${product.discountType === 'PERCENT' ? '%' : ''}`
                    ) : 'None'}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h2>Inventory Overview</h2>
              <div className={styles.grid}>
                <div className={styles.detailGroup}>
                  <label>Current Stock</label>
                  <p>{product.inventories?.[0]?.quantity || 0}</p>
                </div>

                <div className={styles.detailGroup}>
                  <label>Low Stock Alert</label>
                  <p>{product.inventories?.[0]?.minimumStock || 10}</p>
                </div>
              </div>
            </div>

          </div>

          <div className={styles.right}>
            <div className={styles.card}>
              <h2>Product Image</h2>
              {product.image ? (
                <img
                  src={product.image.startsWith('http') ? product.image : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${product.image.startsWith('/') ? '' : '/'}${product.image}`}
                  alt={product.name}
                  className={styles.imagePreview}
                />
              ) : (
                <div className={styles.noImage}>
                  <FiBox size={48} />
                  <span>No Image Available</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
