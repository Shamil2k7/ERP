"use client";

import React, { useState, useMemo, useEffect } from "react";
import Barcode from "react-barcode";
import { toast, Toaster } from "react-hot-toast";
import { useSettings } from "@/context/SettingsContext";
import apiClient from "@/services/apiClient";
import {
  FiPrinter,
  FiSearch,
  FiCheckSquare,
  FiSquare,
  FiSliders,
  FiGrid,
  FiPlus,
  FiMinus,
  FiEye,
  FiTag,
  FiRefreshCw,
} from "react-icons/fi";

import styles from "./barcodePrint.module.css";

const API =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BarcodePrintPage() {
  // =========================================================
  // PRODUCTS
  // =========================================================

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // PAGE STATE
  // =========================================================

  const [activeTab, setActiveTab] = useState("products");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // =========================================================
  // PRINT SETTINGS
  // =========================================================

  const [storeName, setStoreName] =
    useState("ERP Enterprise Store");

  const [paperFormat, setPaperFormat] =
    useState("grid40");

  const [barcodeFormat, setBarcodeFormat] =
    useState("CODE128");

  const [barcodeHeight, setBarcodeHeight] =
    useState(38);

  const [barcodeWidth, setBarcodeWidth] =
    useState(1.2);

  const [fontSize, setFontSize] =
    useState(11);

  // =========================================================
  // DISPLAY TOGGLES
  // =========================================================

  const [showStoreName, setShowStoreName] =
    useState(true);

  const [showProductName, setShowProductName] =
    useState(true);

  const [showSKU, setShowSKU] =
    useState(true);

  const [showPrice, setShowPrice] =
    useState(true);

  const [showBarcodeText, setShowBarcodeText] =
    useState(true);

  // =========================================================
  // GET PRODUCT ID
  // =========================================================

  const getProductId = (product) => {
    return (
      product?.id ||
      product?._id ||
      product?.productId ||
      product?.product?.id ||
      product?.product?._id
    );
  };

  // =========================================================
  // GET BARCODE VALUE
  // =========================================================

  const getBarcodeValue = (barcode) => {
    if (!barcode) return "";

    if (typeof barcode === "string") {
      return barcode;
    }

    return (
      barcode.barcode ||
      barcode.code ||
      barcode.value ||
      barcode.barcodeNumber ||
      barcode.number ||
      ""
    );
  };

  // =========================================================
  // NORMALIZE PRODUCT
  // =========================================================

  const normalizeProduct = (product, barcodeMap) => {
    const id = getProductId(product);

    const barcodeFromMap = barcodeMap.get(String(id));

    const productBarcode =
      product?.barcode ||
      product?.barcodeNumber ||
      product?.barcodeValue ||
      product?.code ||
      "";

    const barcode =
      getBarcodeValue(barcodeFromMap) ||
      getBarcodeValue(productBarcode) ||
      getBarcodeValue(product?.barcodes?.[0]) ||
      String(id || "");

    const category =
      product?.category?.name ||
      product?.category?.title ||
      product?.categoryName ||
      product?.category ||
      "Uncategorized";

    const price = Number(
      product?.sellingPrice ??
        product?.salePrice ??
        product?.selling_price ??
        product?.price ??
        product?.retailPrice ??
        0
    );

    return {
      id,

      name:
        product?.name ||
        product?.productName ||
        "Unnamed Product",

      sku:
        product?.sku ||
        product?.SKU ||
        product?.productCode ||
        "",

      code: barcode,

      category,

      price: Number.isNaN(price) ? 0 : price,

      qty: 1,

      selected: false,
    };
  };

  // =========================================================
  // FETCH PRODUCTS + BARCODES
  // =========================================================

  const fetchProducts = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [productsResponse, barcodesResponse] =
        await Promise.all([
          apiClient.get("/products"),
          apiClient.get("/barcodes").catch(() => ({ data: { data: [] } })),
        ]);

      console.log(
        "Products API Response:",
        productsResponse.data
      );

      console.log(
        "Barcodes API Response:",
        barcodesResponse.data
      );

      // -----------------------------------------------------
      // PRODUCT RESPONSE
      // -----------------------------------------------------

      const productsData =
        productsResponse?.data?.data ||
        productsResponse?.data?.products ||
        productsResponse?.data?.items ||
        productsResponse?.data ||
        [];

      // -----------------------------------------------------
      // BARCODE RESPONSE
      // -----------------------------------------------------

      const barcodesData =
        barcodesResponse?.data?.data ||
        barcodesResponse?.data?.barcodes ||
        barcodesResponse?.data?.items ||
        barcodesResponse?.data ||
        [];

      const productArray = Array.isArray(productsData)
        ? productsData
        : [];

      const barcodeArray = Array.isArray(barcodesData)
        ? barcodesData
        : [];

      // -----------------------------------------------------
      // CREATE BARCODE MAP
      // -----------------------------------------------------

      const barcodeMap = new Map();

      barcodeArray.forEach((barcodeItem) => {
        const productId =
          barcodeItem?.productId ||
          barcodeItem?.product?.id ||
          barcodeItem?.product?._id;

        const barcodeValue =
          getBarcodeValue(barcodeItem);

        if (productId && barcodeValue) {
          barcodeMap.set(
            String(productId),
            barcodeValue
          );
        }
      });

      // -----------------------------------------------------
      // NORMALIZE PRODUCTS
      // -----------------------------------------------------

      const formattedProducts = productArray
        .map((product) =>
          normalizeProduct(product, barcodeMap)
        )
        .filter((product) => product.id);

      setProducts(formattedProducts);

      if (formattedProducts.length === 0) {
        toast("No products found");
      }
    } catch (error) {
      console.error(
        "Failed to fetch barcode products:",
        error
      );

      console.error(
        "API Error:",
        error?.response?.data
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load products"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchProducts(true);
  }, []);

  // =========================================================
  // DYNAMIC CATEGORIES
  // =========================================================

  const categories = useMemo(() => {
    const categorySet = new Set();

    products.forEach((product) => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });

    return [
      "All",
      ...Array.from(categorySet).sort(),
    ];
  }, [products]);

  // =========================================================
  // FILTER PRODUCTS
  // =========================================================

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((product) => {
      const name =
        product.name?.toLowerCase() || "";

      const sku =
        product.sku?.toLowerCase() || "";

      const code =
        product.code?.toLowerCase() || "";

      const category =
        product.category?.toLowerCase() || "";

      const matchesSearch =
        !q ||
        name.includes(q) ||
        sku.includes(q) ||
        code.includes(q);

      const matchesCategory =
        selectedCategory === "All" ||
        category === selectedCategory.toLowerCase();

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    products,
    search,
    selectedCategory,
  ]);

  // =========================================================
  // SELECTED PRODUCTS
  // =========================================================

  const selectedProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.selected &&
        product.qty > 0
    );
  }, [products]);

  // =========================================================
  // TOTAL LABEL COUNT
  // =========================================================

  const totalLabelsCount = useMemo(() => {
    return selectedProducts.reduce(
      (total, product) =>
        total + (Number(product.qty) || 0),
      0
    );
  }, [selectedProducts]);

  // =========================================================
  // CREATE INDIVIDUAL LABEL ITEMS
  // =========================================================

  const labelItemsList = useMemo(() => {
    const items = [];

    selectedProducts.forEach((product) => {
      for (
        let i = 0;
        i < product.qty;
        i++
      ) {
        items.push({
          ...product,
          labelIndex: i + 1,
        });
      }
    });

    return items;
  }, [selectedProducts]);

  // =========================================================
  // SELECT / UNSELECT
  // =========================================================

  const handleToggleSelect = (id) => {
    setProducts((previous) =>
      previous.map((product) =>
        product.id === id
          ? {
              ...product,
              selected: !product.selected,
            }
          : product
      )
    );
  };

  // =========================================================
  // SELECT ALL
  // =========================================================

  const handleToggleSelectAll = () => {
    if (filteredProducts.length === 0) {
      return;
    }

    const allSelected =
      filteredProducts.every(
        (product) => product.selected
      );

    const filteredIds = new Set(
      filteredProducts.map(
        (product) => product.id
      )
    );

    setProducts((previous) =>
      previous.map((product) => {
        if (filteredIds.has(product.id)) {
          return {
            ...product,
            selected: !allSelected,
          };
        }

        return product;
      })
    );
  };

  // =========================================================
  // QUANTITY +/- BUTTON
  // =========================================================

  const handleQtyChange = (id, delta) => {
    setProducts((previous) =>
      previous.map((product) => {
        if (product.id !== id) {
          return product;
        }

        const newQty = Math.max(
          1,
          (Number(product.qty) || 1) + delta
        );

        return {
          ...product,
          qty: newQty,
          selected: true,
        };
      })
    );
  };

  // =========================================================
  // DIRECT QUANTITY
  // =========================================================

  const handleDirectQtyInput = (
    id,
    value
  ) => {
    const parsed = parseInt(value, 10);

    const newQty =
      Number.isNaN(parsed) || parsed < 0
        ? 0
        : parsed;

    setProducts((previous) =>
      previous.map((product) =>
        product.id === id
          ? {
              ...product,
              qty: newQty,
              selected: newQty > 0,
            }
          : product
      )
    );
  };

  // =========================================================
  // BATCH QUANTITY
  // =========================================================

  const handleBatchSetQty = (qty) => {
    setProducts((previous) =>
      previous.map((product) =>
        product.selected
          ? {
              ...product,
              qty,
            }
          : product
      )
    );

    toast.success(
      `Set print quantity to ${qty} for selected products`
    );
  };

  // =========================================================
  // PRINT
  // =========================================================

  const handlePrint = () => {
    if (labelItemsList.length === 0) {
      toast.error(
        "Please select at least one product with quantity greater than 0."
      );
      return;
    }

    const productsWithoutBarcode =
      selectedProducts.filter(
        (product) => !product.code
      );

    if (productsWithoutBarcode.length > 0) {
      toast.error(
        `${productsWithoutBarcode.length} selected product(s) have no barcode.`
      );

      return;
    }

    window.print();
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = () => {
    fetchProducts(false);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className={styles.pageContainer}>
      <Toaster position="top-right" />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <FiTag className={styles.titleIcon} />

            Barcode Generator & Label Printer
          </h1>

          <p>
            Generate, customize, and print
            high-density barcodes & price tags
            for inventory.
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* REFRESH */}

          <button
            className={styles.secondaryButton}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw
              size={16}
              className={
                refreshing
                  ? styles.spin
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Products"}
          </button>

          {/* PREVIEW */}

          <button
            className={styles.secondaryButton}
            onClick={() =>
              setActiveTab(
                activeTab === "products"
                  ? "preview"
                  : "products"
              )
            }
          >
            <FiEye size={16} />

            {activeTab === "products"
              ? "View Print Sheet"
              : "Edit Selection"}
          </button>

          {/* PRINT */}

          <button
            className={styles.primaryButton}
            onClick={handlePrint}
          >
            <FiPrinter size={17} />

            Print Barcodes (
            {totalLabelsCount}
            )
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className={styles.mainGrid}>
        {/* ===================================================
            LEFT SETTINGS
        ==================================================== */}

        <aside className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <h3>
              <FiSliders size={18} />

              Label & Print Settings
            </h3>
          </div>

          {/* PAPER */}

          <div className={styles.formGroup}>
            <label>
              Paper Layout / Preset
            </label>

            <select
              className={styles.selectInput}
              value={paperFormat}
              onChange={(e) =>
                setPaperFormat(
                  e.target.value
                )
              }
            >
              <option value="grid40">
                40 Labels Per Sheet (A4 -
                52.5mm x 29.7mm)
              </option>

              <option value="grid30">
                30 Labels Per Sheet (A4 -
                70mm x 37.1mm)
              </option>

              <option value="grid24">
                24 Labels Per Sheet (A4 -
                70mm x 42.3mm)
              </option>

              <option value="gridSingle">
                Single Sticker (50mm x 25mm
                Thermal)
              </option>

              <option value="gridRoll">
                Continuous Thermal Roll
                (80mm POS)
              </option>
            </select>
          </div>

          {/* STORE */}

          <div className={styles.formGroup}>
            <label>
              Store / Header Name
            </label>

            <input
              type="text"
              className={styles.textInput}
              value={storeName}
              onChange={(e) =>
                setStoreName(
                  e.target.value
                )
              }
              placeholder="e.g. ERP Store"
            />
          </div>

          {/* BARCODE FORMAT */}

          <div className={styles.formGroup}>
            <label>
              Barcode Symbology
            </label>

            <select
              className={styles.selectInput}
              value={barcodeFormat}
              onChange={(e) =>
                setBarcodeFormat(
                  e.target.value
                )
              }
            >
              <option value="CODE128">
                CODE128 (Standard)
              </option>

              <option value="EAN13">
                EAN-13
              </option>

              <option value="CODE39">
                CODE39
              </option>
            </select>
          </div>

          {/* HEIGHT */}

          <div className={styles.formGroup}>
            <label>
              Barcode Height
            </label>

            <div className={styles.sliderRow}>
              <input
                type="range"
                min="25"
                max="80"
                className={styles.rangeInput}
                value={barcodeHeight}
                onChange={(e) =>
                  setBarcodeHeight(
                    Number(e.target.value)
                  )
                }
              />

              <span
                className={
                  styles.sliderValue
                }
              >
                {barcodeHeight}px
              </span>
            </div>
          </div>

          {/* WIDTH */}

          <div className={styles.formGroup}>
            <label>
              Barcode Bar Width
            </label>

            <div className={styles.sliderRow}>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                className={styles.rangeInput}
                value={barcodeWidth}
                onChange={(e) =>
                  setBarcodeWidth(
                    Number(e.target.value)
                  )
                }
              />

              <span
                className={
                  styles.sliderValue
                }
              >
                {barcodeWidth}x
              </span>
            </div>
          </div>

          {/* FONT SIZE */}

          <div className={styles.formGroup}>
            <label>
              Barcode Text Size
            </label>

            <div className={styles.sliderRow}>
              <input
                type="range"
                min="8"
                max="20"
                className={styles.rangeInput}
                value={fontSize}
                onChange={(e) =>
                  setFontSize(
                    Number(e.target.value)
                  )
                }
              />

              <span
                className={
                  styles.sliderValue
                }
              >
                {fontSize}px
              </span>
            </div>
          </div>

          {/* DISPLAY */}

          <div className={styles.formGroup}>
            <label>
              Display Fields
            </label>

            <div
              className={
                styles.checkboxGrid
              }
            >
              <label
                className={
                  styles.checkboxLabel
                }
              >
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) =>
                    setShowStoreName(
                      e.target.checked
                    )
                  }
                />

                Store Header
              </label>

              <label
                className={
                  styles.checkboxLabel
                }
              >
                <input
                  type="checkbox"
                  checked={showProductName}
                  onChange={(e) =>
                    setShowProductName(
                      e.target.checked
                    )
                  }
                />

                Product Name
              </label>

              <label
                className={
                  styles.checkboxLabel
                }
              >
                <input
                  type="checkbox"
                  checked={showSKU}
                  onChange={(e) =>
                    setShowSKU(
                      e.target.checked
                    )
                  }
                />

                SKU / Code
              </label>

              <label
                className={
                  styles.checkboxLabel
                }
              >
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) =>
                    setShowPrice(
                      e.target.checked
                    )
                  }
                />

                Price Tag
              </label>

              <label
                className={
                  styles.checkboxLabel
                }
              >
                <input
                  type="checkbox"
                  checked={showBarcodeText}
                  onChange={(e) =>
                    setShowBarcodeText(
                      e.target.checked
                    )
                  }
                />

                Barcode Text
              </label>
            </div>
          </div>
        </aside>

        {/* ===================================================
            RIGHT CONTENT
        ==================================================== */}

        <section className={styles.contentCard}>
          {/* =================================================
              TABS
          ================================================== */}

          <div className={styles.tabsHeader}>
            <div
              className={styles.tabsGroup}
            >
              <button
                className={`${styles.tabBtn} ${
                  activeTab === "products"
                    ? styles.activeTab
                    : ""
                }`}
                onClick={() =>
                  setActiveTab(
                    "products"
                  )
                }
              >
                <FiGrid size={16} />

                Select Products (
                {selectedProducts.length}
                )
              </button>

              <button
                className={`${styles.tabBtn} ${
                  activeTab === "preview"
                    ? styles.activeTab
                    : ""
                }`}
                onClick={() =>
                  setActiveTab(
                    "preview"
                  )
                }
              >
                <FiEye size={16} />

                Live Print Sheet (
                {totalLabelsCount}
                Labels)
              </button>
            </div>

            {/* BATCH */}

            {activeTab === "products" && (
              <div
                className={
                  styles.batchActions
                }
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  Preset Qty:
                </span>

                <button
                  className={
                    styles.secondaryButton
                  }
                  style={{
                    height: 32,
                    padding: "0 10px",
                    fontSize: 12,
                  }}
                  onClick={() =>
                    handleBatchSetQty(1)
                  }
                >
                  1
                </button>

                <button
                  className={
                    styles.secondaryButton
                  }
                  style={{
                    height: 32,
                    padding: "0 10px",
                    fontSize: 12,
                  }}
                  onClick={() =>
                    handleBatchSetQty(5)
                  }
                >
                  5
                </button>

                <button
                  className={
                    styles.secondaryButton
                  }
                  style={{
                    height: 32,
                    padding: "0 10px",
                    fontSize: 12,
                  }}
                  onClick={() =>
                    handleBatchSetQty(10)
                  }
                >
                  10
                </button>
              </div>
            )}
          </div>

          {/* =================================================
              PRODUCTS TAB
          ================================================== */}

          {activeTab === "products" ? (
            <div>
              {/* SEARCH */}

              <div
                className={
                  styles.searchToolbar
                }
              >
                <div
                  className={
                    styles.searchBox
                  }
                >
                  <FiSearch size={16} />

                  <input
                    type="text"
                    placeholder="Search by name, SKU or barcode..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                  />
                </div>

                <select
                  className={
                    styles.filterSelect
                  }
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(
                      e.target.value
                    )
                  }
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        Category:{" "}
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* LOADING */}

              {loading ? (
                <div
                  style={{
                    padding: 60,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Loading products...
                </div>
              ) : (
                <div
                  className={
                    styles.tableWrapper
                  }
                >
                  <table
                    className={
                      styles.productsTable
                    }
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            width: 40,
                          }}
                        >
                          <button
                            style={{
                              background:
                                "transparent",
                              border: "none",
                              cursor:
                                "pointer",
                              padding: 0,
                            }}
                            onClick={
                              handleToggleSelectAll
                            }
                          >
                            {filteredProducts.length >
                              0 &&
                            filteredProducts.every(
                              (p) =>
                                p.selected
                            ) ? (
                              <FiCheckSquare
                                size={18}
                                color="#2563eb"
                              />
                            ) : (
                              <FiSquare
                                size={18}
                                color="#94a3b8"
                              />
                            )}
                          </button>
                        </th>

                        <th>
                          Product Info
                        </th>

                        <th>
                          SKU / Barcode
                        </th>

                        <th>
                          Price
                        </th>

                        <th>
                          Print Qty
                        </th>

                        <th>
                          Live Barcode
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.length >
                      0 ? (
                        filteredProducts.map(
                          (product) => (
                            <tr
                              key={
                                product.id
                              }
                            >
                              {/* SELECT */}

                              <td>
                                <button
                                  style={{
                                    background:
                                      "transparent",
                                    border:
                                      "none",
                                    cursor:
                                      "pointer",
                                    padding: 0,
                                  }}
                                  onClick={() =>
                                    handleToggleSelect(
                                      product.id
                                    )
                                  }
                                >
                                  {product.selected ? (
                                    <FiCheckSquare
                                      size={
                                        18
                                      }
                                      color="#2563eb"
                                    />
                                  ) : (
                                    <FiSquare
                                      size={
                                        18
                                      }
                                      color="#94a3b8"
                                    />
                                  )}
                                </button>
                              </td>

                              {/* PRODUCT */}

                              <td>
                                <div
                                  className={
                                    styles.productNameCol
                                  }
                                >
                                  <div
                                    className={
                                      styles.productThumb
                                    }
                                  >
                                    {product.name
                                      .substring(
                                        0,
                                        2
                                      )
                                      .toUpperCase()}
                                  </div>

                                  <div>
                                    <strong
                                      style={{
                                        color:
                                          "#0f172a",
                                      }}
                                    >
                                      {
                                        product.name
                                      }
                                    </strong>

                                    <div
                                      style={{
                                        fontSize: 12,
                                        color:
                                          "#64748b",
                                      }}
                                    >
                                      {
                                        product.category
                                      }
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* SKU / BARCODE */}

                              <td>
                                {product.sku && (
                                  <span
                                    className={
                                      styles.skuBadge
                                    }
                                  >
                                    {
                                      product.sku
                                    }
                                  </span>
                                )}

                                <div
                                  style={{
                                    fontSize: 11,
                                    color:
                                      product.code
                                        ? "#64748b"
                                        : "#ef4444",
                                    marginTop: 4,
                                  }}
                                >
                                  {product.code ||
                                    "No barcode"}
                                </div>
                              </td>

                              {/* PRICE */}

                              <td
                                style={{
                                  fontWeight: 700,
                                  color:
                                    "#0f172a",
                                }}
                              >
                                ₹
                                {product.price.toFixed(
                                  2
                                )}
                              </td>

                              {/* QUANTITY */}

                              <td>
                                <div
                                  className={
                                    styles.qtyControl
                                  }
                                >
                                  <button
                                    className={
                                      styles.qtyBtn
                                    }
                                    onClick={() =>
                                      handleQtyChange(
                                        product.id,
                                        -1
                                      )
                                    }
                                  >
                                    <FiMinus
                                      size={
                                        12
                                      }
                                    />
                                  </button>

                                  <input
                                    type="number"
                                    min="0"
                                    className={
                                      styles.qtyInput
                                    }
                                    value={
                                      product.qty
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      handleDirectQtyInput(
                                        product.id,
                                        e.target
                                          .value
                                      )
                                    }
                                  />

                                  <button
                                    className={
                                      styles.qtyBtn
                                    }
                                    onClick={() =>
                                      handleQtyChange(
                                        product.id,
                                        1
                                      )
                                    }
                                  >
                                    <FiPlus
                                      size={
                                        12
                                      }
                                    />
                                  </button>
                                </div>
                              </td>

                              {/* BARCODE */}

                              <td>
                                {product.code ? (
                                  <div
                                    style={{
                                      transform:
                                        "scale(0.85)",
                                      transformOrigin:
                                        "left center",
                                    }}
                                  >
                                    <Barcode
                                      value={
                                        product.code
                                      }
                                      format={
                                        barcodeFormat
                                      }
                                      height={
                                        28
                                      }
                                      width={1}
                                      fontSize={
                                        10
                                      }
                                      displayValue={
                                        false
                                      }
                                    />
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      color:
                                        "#ef4444",
                                      fontSize:
                                        12,
                                    }}
                                  >
                                    No barcode
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            style={{
                              textAlign:
                                "center",
                              padding: 50,
                              color:
                                "#94a3b8",
                            }}
                          >
                            {search ||
                            selectedCategory !==
                              "All"
                              ? "No products match your filters."
                              : "No products available."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* =================================================
               PREVIEW TAB
            ================================================== */

            <div
              className={
                styles.previewArea
              }
            >
              <div
                className={`${styles.printSheet} ${styles[paperFormat]}`}
              >
                {labelItemsList.length >
                0 ? (
                  labelItemsList.map(
                    (item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className={
                          styles.barcodeLabelCard
                        }
                      >
                        {/* STORE */}

                        {showStoreName && (
                          <div
                            className={
                              styles.storeHeader
                            }
                          >
                            {storeName}
                          </div>
                        )}

                        {/* PRODUCT NAME */}

                        {showProductName && (
                          <div
                            className={
                              styles.labelProdTitle
                            }
                            title={item.name}
                          >
                            {item.name}
                          </div>
                        )}

                        {/* SKU */}

                        {showSKU && (
                          <div
                            className={
                              styles.labelSku
                            }
                          >
                            {item.sku ||
                              "No SKU"}
                          </div>
                        )}

                        {/* BARCODE */}

                        <div
                          className={
                            styles.barcodeSvgWrapper
                          }
                        >
                          {item.code ? (
                            <Barcode
                              value={
                                item.code
                              }
                              format={
                                barcodeFormat
                              }
                              height={
                                barcodeHeight
                              }
                              width={
                                barcodeWidth
                              }
                              fontSize={
                                fontSize
                              }
                              displayValue={
                                showBarcodeText
                              }
                              margin={0}
                            />
                          ) : (
                            <div
                              style={{
                                color:
                                  "#ef4444",
                                fontSize: 12,
                              }}
                            >
                              Barcode not
                              available
                            </div>
                          )}
                        </div>

                        {/* PRICE */}

                        {showPrice && (
                          <div
                            className={
                              styles.labelPrice
                            }
                          >
                            ₹
                            {Number(
                              item.price || 0
                            ).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )
                  )
                ) : (
                  <div
                    className={
                      styles.emptyState
                    }
                  >
                    <FiTag size={40} />

                    <p>
                      No labels selected to
                      print.
                    </p>

                    <button
                      className={
                        styles.primaryButton
                      }
                      style={{
                        margin: "0 auto",
                      }}
                      onClick={() =>
                        setActiveTab(
                          "products"
                        )
                      }
                    >
                      Select Products
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}