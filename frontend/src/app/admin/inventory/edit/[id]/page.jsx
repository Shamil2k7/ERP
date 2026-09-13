"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import apiClient from "@/services/apiClient";
import { toast, Toaster } from "react-hot-toast";
import { useRouter, useParams } from "next/navigation";
import { FiSave, FiPackage } from "react-icons/fi";
import { Loader2 } from "lucide-react";

import styles from "./editInventory.module.css";
import { useAlert } from "@/context/AlertContext";

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { showWarning } = useAlert();
  
  const [inventory, setInventory] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProducts();
      fetchWarehouses();
      fetchInventoryData();
    }
  }, [id]);

  const fetchInventoryData = async () => {
    try {
      const res = await apiClient.get(`/inventory/${id}`);
      if (res.data && res.data.data) {
        const inv = res.data.data;
        setInventory({
          id: inv.id,
          productId: inv.productId,
          warehouseId: inv.warehouseId,
          quantity: inv.quantity || 0,
          minimumStock: inv.minimumStock || 0,
          maximumStock: inv.maximumStock || 0,
          reorderLevel: inv.reorderLevel || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching inventory details:", error);
      toast.error("Failed to fetch inventory details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get("/products");
      if (res.data && res.data.data) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await apiClient.get("/warehouses");
      if (res.data && res.data.data) {
        setWarehouses(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInventory((prev) => ({
      ...prev,
      [name]: ["quantity", "minimumStock", "maximumStock", "reorderLevel"].includes(name) 
        ? (value === "" ? "" : parseInt(value)) 
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inventory.productId || !inventory.warehouseId) {
      showWarning("Validation Error", "Please select both a Product and a Warehouse.");
      return;
    }

    setSubmitting(true);

    try {
      await apiClient.put(`/inventory/${id}`, {
        productId: inventory.productId,
        warehouseId: inventory.warehouseId,
        quantity: inventory.quantity || 0,
        minimumStock: inventory.minimumStock || 0,
        maximumStock: inventory.maximumStock || 0,
        reorderLevel: inventory.reorderLevel || 0,
      });

      toast.success("Inventory updated successfully!");
      setTimeout(() => {
        router.push("/admin/inventory");
      }, 1500);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to update inventory record";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>
        <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#4f46e5' }} size={50} />
      </div>
    );
  }

  if (!inventory) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb', height: '100vh' }}>
        <p>Inventory record not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Toaster position="top-right" />
      <div className={styles.main}>
        <div className={styles.container}>
          {/* HEADER */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div>
                <h1>Edit Inventory</h1>
                <p>Modify stock parameters and details</p>
              </div>
            </div>

            <button
              type="submit"
              form="edit-inventory-form"
              className={styles.saveBtn}
              disabled={submitting}
            >
              <FiSave />
              {submitting ? "Updating..." : "Update Record"}
            </button>
          </div>

          {/* FORM */}
          <form
            id="edit-inventory-form"
            className={styles.form}
            onSubmit={handleSubmit}
          >
            <div className={styles.left}>
              {/* Info Card */}
              <div className={styles.card}>
                <h2>
                  <FiPackage />
                  Assignment Details
                </h2>

                <div className={styles.grid}>
                  {/* Product */}
                  <div>
                    <label htmlFor="productId">Product</label>
                    <select
                      id="productId"
                      name="productId"
                      value={inventory.productId}
                      onChange={handleChange}
                      required
                      disabled // Usually we don't want to change product/warehouse after creation
                    >
                      <option value="">Select Product</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} ({prod.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Warehouse */}
                  <div>
                    <label htmlFor="warehouseId">Warehouse</label>
                    <select
                      id="warehouseId"
                      name="warehouseId"
                      value={inventory.warehouseId}
                      onChange={handleChange}
                      required
                      disabled // Same here
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stock Levels Card */}
              <div className={styles.card}>
                <h2>Stock Levels</h2>

                <div className={styles.grid}>
                  {/* Quantity */}
                  <div>
                    <label htmlFor="quantity">Current Quantity</label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      value={inventory.quantity}
                      onChange={handleChange}
                      placeholder="0"
                      required
                    />
                  </div>

                  {/* Minimum Stock */}
                  <div>
                    <label htmlFor="minimumStock">Minimum Stock</label>
                    <input
                      id="minimumStock"
                      name="minimumStock"
                      type="number"
                      min="0"
                      value={inventory.minimumStock}
                      onChange={handleChange}
                      placeholder="10"
                      required
                    />
                  </div>

                  {/* Maximum Stock */}
                  <div>
                    <label htmlFor="maximumStock">Maximum Stock</label>
                    <input
                      id="maximumStock"
                      name="maximumStock"
                      type="number"
                      min="0"
                      value={inventory.maximumStock}
                      onChange={handleChange}
                      placeholder="1000"
                      required
                    />
                  </div>

                  {/* Reorder Level */}
                  <div>
                    <label htmlFor="reorderLevel">Reorder Level</label>
                    <input
                      id="reorderLevel"
                      name="reorderLevel"
                      type="number"
                      min="0"
                      value={inventory.reorderLevel}
                      onChange={handleChange}
                      placeholder="20"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className={styles.right}>
              <div className={styles.card}>
                <h2>Quick Tips</h2>
                <ul className={styles.tips}>
                  <li>You cannot change the assigned Product and Warehouse in edit mode.</li>
                  <li>Use this page to manually adjust quantity and threshold levels.</li>
                  <li>Reorder level should be higher than minimum stock.</li>
                </ul>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
