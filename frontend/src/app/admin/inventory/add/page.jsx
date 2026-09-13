"use client";

import { useState, useEffect } from "react";
import apiClient from "@/services/apiClient";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FiSave, FiPackage } from "react-icons/fi";

import styles from "./addInventory.module.css";
import { useAlert } from "@/context/AlertContext";

const initialInventory = {
  productId: "",
  warehouseId: "",
  quantity: "",
  minimumStock: 10,
  maximumStock: 1000,
  reorderLevel: 20,
};

export default function AddInventoryPage() {
  const router = useRouter();
  const { showWarning } = useAlert();
  const [inventory, setInventory] = useState(initialInventory);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

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
      await apiClient.post("/inventory", {
        productId: inventory.productId,
        warehouseId: inventory.warehouseId,
        quantity: inventory.quantity || 0,
        minimumStock: inventory.minimumStock || 0,
        maximumStock: inventory.maximumStock || 0,
        reorderLevel: inventory.reorderLevel || 0,
      });

      toast.success("Inventory added successfully!");
      setTimeout(() => {
        router.push("/admin/inventory");
      }, 1500);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to add inventory record";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.layout}>
      <Toaster position="top-right" />
      <div className={styles.main}>
        <div className={styles.container}>
          {/* HEADER */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div>
                <h1>Add Inventory</h1>
                <p>Assign initial stock for a product in a specific warehouse</p>
              </div>
            </div>

            <button
              type="submit"
              form="add-inventory-form"
              className={styles.saveBtn}
              disabled={submitting}
            >
              <FiSave />
              {submitting ? "Saving..." : "Save Record"}
            </button>
          </div>

          {/* FORM */}
          <form
            id="add-inventory-form"
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
                    >
                      <option value="">Select Product</option>
                      {products.map((prod) => {
                        const currentStock = prod.inventories?.reduce((acc, inv) => acc + Number(inv.quantity || 0), 0) ?? (prod.initialStock !== undefined && prod.initialStock !== null ? Number(prod.initialStock) : 0);
                        return (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} ({prod.sku}) — Stock: {currentStock}
                          </option>
                        );
                      })}
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
                    <label htmlFor="quantity">Initial Quantity</label>
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
                  <li>Ensure the product isn't already assigned to this warehouse.</li>
                  <li>Reorder level should be higher than minimum stock.</li>
                  <li>Initial quantity will be the starting stock count.</li>
                </ul>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
