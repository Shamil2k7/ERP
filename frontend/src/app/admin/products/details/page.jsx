"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiPrinter,
  FiDownload,
  FiPackage,
  FiBox,
  FiDollarSign,
  FiTag,
  FiTruck,
  FiLayers,
  FiCalendar,
  FiBarChart2,
} from "react-icons/fi";

import styles from "./details.module.css";
import { useAlert } from "@/context/AlertContext";

export default function ProductDetailsPage({ params }) {
  const { showSuccess, showConfirm } = useAlert();
  const [product] = useState({
    id: params.id,
    name: "Samsung Galaxy S24 Ultra",
    sku: "SAM-S24U-001",
    barcode: "8806095301234",
    brand: "Samsung",
    category: "Smartphones",
    department: "Electronics",
    unit: "Piece",
    status: "Active",

    description:
      "Samsung Galaxy S24 Ultra is a premium flagship smartphone featuring a powerful processor, advanced camera system, high-resolution display and long-lasting battery.",

    purchasePrice: 85000,
    sellingPrice: 109999,
    discount: 5000,
    tax: 18,

    currentStock: 24,
    reservedStock: 2,
    availableStock: 22,
    minimumStock: 5,
    maximumStock: 100,

    supplier: {
      name: "ABC Electronics",
      code: "SUP-001",
      phone: "+91 98765 43210",
      email: "abc@example.com",
    },

    warehouse: [
      {
        name: "Main Warehouse",
        available: 20,
        reserved: 2,
        total: 22,
      },
      {
        name: "Branch 01",
        available: 4,
        reserved: 0,
        total: 4,
      },
    ],

    transactions: [
      {
        date: "12 Aug 2026",
        type: "Purchase",
        quantity: "+10",
        reference: "PO-1025",
      },
      {
        date: "10 Aug 2026",
        type: "Sale",
        quantity: "-2",
        reference: "INV-2031",
      },
      {
        date: "08 Aug 2026",
        type: "Purchase",
        quantity: "+16",
        reference: "PO-1019",
      },
      {
        date: "05 Aug 2026",
        type: "Sale",
        quantity: "-4",
        reference: "INV-2018",
      },
    ],

    createdAt: "01 Aug 2026",
    updatedAt: "12 Aug 2026",
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const profit = product.sellingPrice - product.purchasePrice;

  const profitMargin =
    (profit / product.purchasePrice) * 100;

  const stockPercentage =
    (product.currentStock / product.maximumStock) * 100;

  const handleDelete = () => {
    showConfirm({
      title: "Delete Product",
      message: `Are you sure you want to delete product "${product.name}"? This action cannot be undone.`,
      confirmText: "Delete Product",
      type: "danger",
      onConfirm: async () => {
        showSuccess("Product updated", "Product record deleted successfully");
      },
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/admin/products" className={styles.backButton}>
            <FiArrowLeft />
          </Link>

          <div>
            <div className={styles.breadcrumb}>
              Products <span>/</span> Product Details
            </div>

            <h1>Product Details</h1>
            <p>View complete information about this product.</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={handlePrint}
          >
            <FiPrinter />
            Print
          </button>

          <Link
            href={`/admin/products/edit/${product.id}`}
            className={styles.editButton}
          >
            <FiEdit />
            Edit Product
          </Link>

          <button
            className={styles.deleteButton}
            onClick={handleDelete}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      {/* Product Overview */}
      <div className={styles.productCard}>
        <div className={styles.productImageWrapper}>
          <div className={styles.productImage}>
            <FiPackage />
          </div>
        </div>

        <div className={styles.productMainInfo}>
          <div className={styles.titleRow}>
            <div>
              <h2>{product.name}</h2>

              <div className={styles.productMeta}>
                <span>SKU: {product.sku}</span>
                <span>Barcode: {product.barcode}</span>
              </div>
            </div>

            <span className={styles.activeBadge}>
              <span></span>
              {product.status}
            </span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span>Category</span>
              <strong>{product.category}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Brand</span>
              <strong>{product.brand}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Department</span>
              <strong>{product.department}</strong>
            </div>

            <div className={styles.infoItem}>
              <span>Unit</span>
              <strong>{product.unit}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}>
            <FiDollarSign />
          </div>

          <div>
            <span>Purchase Price</span>
            <h3>{formatPrice(product.purchasePrice)}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}>
            <FiTag />
          </div>

          <div>
            <span>Selling Price</span>
            <h3>{formatPrice(product.sellingPrice)}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.orange}`}>
            <FiBox />
          </div>

          <div>
            <span>Current Stock</span>
            <h3>{product.currentStock} Units</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.purple}`}>
            <FiBarChart2 />
          </div>

          <div>
            <span>Profit Margin</span>
            <h3>{profitMargin.toFixed(1)}%</h3>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Pricing */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <div className={styles.titleIcon}>
                  <FiDollarSign />
                </div>

                <div>
                  <h3>Pricing Information</h3>
                  <p>Product pricing and profit details</p>
                </div>
              </div>
            </div>

            <div className={styles.pricingGrid}>
              <div>
                <span>Purchase Price</span>
                <strong>{formatPrice(product.purchasePrice)}</strong>
              </div>

              <div>
                <span>Selling Price</span>
                <strong>{formatPrice(product.sellingPrice)}</strong>
              </div>

              <div>
                <span>Discount</span>
                <strong>{formatPrice(product.discount)}</strong>
              </div>

              <div>
                <span>Tax / GST</span>
                <strong>{product.tax}%</strong>
              </div>

              <div>
                <span>Profit per Unit</span>
                <strong className={styles.profit}>
                  {formatPrice(profit)}
                </strong>
              </div>

              <div>
                <span>Profit Margin</span>
                <strong className={styles.profit}>
                  {profitMargin.toFixed(1)}%
                </strong>
              </div>
            </div>
          </section>

          {/* Product Information */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <div className={styles.titleIcon}>
                  <FiLayers />
                </div>

                <div>
                  <h3>Product Information</h3>
                  <p>General information about this product</p>
                </div>
              </div>
            </div>

            <div className={styles.description}>
              <span>Description</span>
              <p>{product.description}</p>
            </div>

            <div className={styles.detailsGrid}>
              <div>
                <span>Product Name</span>
                <strong>{product.name}</strong>
              </div>

              <div>
                <span>SKU</span>
                <strong>{product.sku}</strong>
              </div>

              <div>
                <span>Barcode</span>
                <strong>{product.barcode}</strong>
              </div>

              <div>
                <span>Category</span>
                <strong>{product.category}</strong>
              </div>

              <div>
                <span>Brand</span>
                <strong>{product.brand}</strong>
              </div>

              <div>
                <span>Unit</span>
                <strong>{product.unit}</strong>
              </div>
            </div>
          </section>

          {/* Warehouse */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <div className={styles.titleIcon}>
                  <FiBox />
                </div>

                <div>
                  <h3>Warehouse Stock</h3>
                  <p>Stock available across warehouses</p>
                </div>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Warehouse</th>
                    <th>Available</th>
                    <th>Reserved</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {product.warehouse.map((warehouse, index) => (
                    <tr key={index}>
                      <td>
                        <div className={styles.warehouseName}>
                          <FiBox />
                          {warehouse.name}
                        </div>
                      </td>

                      <td>
                        <strong>{warehouse.available}</strong>
                      </td>

                      <td>{warehouse.reserved}</td>

                      <td>
                        <strong>{warehouse.total}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Stock Card */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <div className={styles.titleIcon}>
                  <FiPackage />
                </div>

                <div>
                  <h3>Inventory</h3>
                  <p>Current stock information</p>
                </div>
              </div>
            </div>

            <div className={styles.stockMain}>
              <div className={styles.stockNumber}>
                {product.currentStock}
                <span>Units</span>
              </div>

              <span className={styles.stockStatus}>
                In Stock
              </span>
            </div>

            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span>Stock Level</span>
                <strong>{Math.round(stockPercentage)}%</strong>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progress}
                  style={{
                    width: `${Math.min(stockPercentage, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className={styles.stockDetails}>
              <div>
                <span>Available</span>
                <strong>{product.availableStock}</strong>
              </div>

              <div>
                <span>Reserved</span>
                <strong>{product.reservedStock}</strong>
              </div>

              <div>
                <span>Minimum</span>
                <strong>{product.minimumStock}</strong>
              </div>

              <div>
                <span>Maximum</span>
                <strong>{product.maximumStock}</strong>
              </div>
            </div>
          </section>

          {/* Supplier */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <div className={styles.titleIcon}>
                  <FiTruck />
                </div>

                <div>
                  <h3>Supplier</h3>
                  <p>Product supplier information</p>
                </div>
              </div>
            </div>

            <div className={styles.supplier}>
              <div className={styles.supplierAvatar}>
                {product.supplier.name.charAt(0)}
              </div>

              <div>
                <h4>{product.supplier.name}</h4>
                <span>{product.supplier.code}</span>
              </div>
            </div>

            <div className={styles.supplierDetails}>
              <div>
                <span>Phone</span>
                <strong>{product.supplier.phone}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{product.supplier.email}</strong>
              </div>
            </div>
          </section>

          {/* Dates */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <div className={styles.titleIcon}>
                  <FiCalendar />
                </div>

                <div>
                  <h3>Product Timeline</h3>
                  <p>Product creation information</p>
                </div>
              </div>
            </div>

            <div className={styles.timeline}>
              <div>
                <span>Created</span>
                <strong>{product.createdAt}</strong>
              </div>

              <div>
                <span>Last Updated</span>
                <strong>{product.updatedAt}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Transactions */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <div className={styles.titleIcon}>
              <FiBarChart2 />
            </div>

            <div>
              <h3>Recent Stock Transactions</h3>
              <p>Latest inventory movements</p>
            </div>
          </div>

          <button className={styles.downloadButton}>
            <FiDownload />
            Export
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction Type</th>
                <th>Quantity</th>
                <th>Reference</th>
              </tr>
            </thead>

            <tbody>
              {product.transactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{transaction.date}</td>

                  <td>
                    <span
                      className={
                        transaction.type === "Purchase"
                          ? styles.purchaseBadge
                          : styles.saleBadge
                      }
                    >
                      {transaction.type}
                    </span>
                  </td>

                  <td
                    className={
                      transaction.quantity.startsWith("+")
                        ? styles.quantityPlus
                        : styles.quantityMinus
                    }
                  >
                    {transaction.quantity}
                  </td>

                  <td>
                    <strong>{transaction.reference}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}