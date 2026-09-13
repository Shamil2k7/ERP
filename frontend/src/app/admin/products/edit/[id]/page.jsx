"use client";

import { useRef, useState, useEffect, use } from "react";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  FiUpload,
  FiSave,
  FiPackage,
  FiX,
  FiDollarSign,
  FiArchive,
  FiTruck,
  FiShoppingBag,
  FiTag,
  FiCamera,
  FiArrowLeft,
} from "react-icons/fi";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Loader2 } from "lucide-react";

import styles from "../../add/addProducts.module.css";
import { useAlert } from "@/context/AlertContext";
import apiClient from "@/services/apiClient";
import { useCompany } from "@/context/CompanyContext";
import { restaurantService } from "@/services/restaurantService";
import { showSuccess, showError } from "@/utils/swal";
import RestaurantIngredientEdit from "@/components/restaurant/RestaurantIngredientEdit";

const DEFAULT_UNITS = [
  { id: "pcs", name: "Piece / Pcs", code: "pcs" },
  { id: "kg", name: "Kilogram (KG)", code: "kg" },
  { id: "gm", name: "Gram (g)", code: "gm" },
  { id: "liter", name: "Liter (L)", code: "liter" },
  { id: "ml", name: "Milliliter (ml)", code: "ml" },
  { id: "box", name: "Box", code: "box" },
  { id: "pack", name: "Pack / Packet", code: "pack" },
  { id: "carton", name: "Carton / Case", code: "carton" },
  { id: "bottle", name: "Bottle", code: "bottle" },
  { id: "can", name: "Can / Tin", code: "can" },
  { id: "bag", name: "Bag / Sack", code: "bag" },
  { id: "bundle", name: "Bundle", code: "bundle" },
  { id: "dozen", name: "Dozen (12 pcs)", code: "dozen" },
  { id: "portion", name: "Portion / Serving", code: "portion" },
  { id: "plate", name: "Plate", code: "plate" },
  { id: "set", name: "Set", code: "set" },
  { id: "meter", name: "Meter (m)", code: "meter" },
  { id: "unit", name: "Unit", code: "unit" },
];

export default function EditProductPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const router = useRouter();
  const { showWarning } = useAlert();
  const { isRestaurant, isTextile, company } = useCompany();

  if (isRestaurant) {
    return <RestaurantIngredientEdit ingredientId={id} />;
  }

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  // Barcode Camera Scanner State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const fileInputRef = useRef(null);

  const [product, setProduct] = useState({
    name: "",
    sku: "",
    barcode: "",
    categoryId: "",
    subcategoryId: "",
    brandId: "",
    baseUnitId: "",
    description: "",
    status: "ACTIVE",

    // Inventory
    stockUnit: "Piece / Pcs",
    initialStock: "",
    openingStockDate: "",
    reorderLevel: "10",
    minimumStock: "5",
    maximumStock: "500",
    warehouseLocation: "Main Store Warehouse",
    rackLocation: "Shelf A-1",

    // Pricing & GST
    costPrice: "",
    sellingPrice: "",
    wholesalePrice: "",
    retailPrice: "",
    discountValue: "",
    discountType: "PERCENT",
    taxRate: "18",

    // Supplier
    supplierId: "",
    supplierProductCode: "",

    // Restaurant Ingredients specific
    purchaseUnit: "Box",
    conversionFactor: "10",
    reorderQuantity: "20",
    supplierReference: "",
    restaurantOutletId: "",
    defaultStorageLocation: "Main Store",
    storageType: "Freezer",
    isPerishable: true,
    isExpiryTracking: true,
    isBatchTracking: true,
  });

  useEffect(() => {
    console.log("CURRENT ERP MODE:", isRestaurant ? "RESTAURANT" : isTextile ? "TEXTILE" : "RETAIL");
    console.log("CURRENT PRODUCT TYPE: RETAIL");
    console.log("COMPONENT BEING RENDERED: EditRetailProductPage");
    console.log("CURRENT PATH:", typeof window !== "undefined" ? window.location.pathname : "");

    // If active ERP is Textile ERP, redirect directly to Textile product edit
    if (isTextile) {
      router.replace(`/textile/products/edit/${id}`);
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const [catRes, brandRes, unitRes, suppRes, whRes, prodRes] = await Promise.allSettled([
          apiClient.get("/categories"),
          apiClient.get("/brands"),
          apiClient.get("/units"),
          apiClient.get("/suppliers"),
          apiClient.get("/warehouse"),
          apiClient.get(`/products/${id}`),
        ]);

        if (catRes.status === "fulfilled" && catRes.value.data?.data) {
          setCategories(catRes.value.data.data);
        }
        if (brandRes.status === "fulfilled" && brandRes.value.data?.data) {
          setBrands(brandRes.value.data.data);
        }
        if (unitRes.status === "fulfilled" && unitRes.value.data?.data?.length > 0) {
          setUnits(unitRes.value.data.data);
        }
        if (suppRes.status === "fulfilled" && suppRes.value.data?.data) {
          setSuppliers(suppRes.value.data.data);
        }
        let fetchedWarehouses = [];
        if (whRes.status === "fulfilled" && whRes.value.data?.data) {
          fetchedWarehouses = whRes.value.data.data;
          setWarehouses(fetchedWarehouses);
        }

        if (prodRes.status === "fulfilled" && prodRes.value.data) {
          const p = prodRes.value.data.data || prodRes.value.data;

          // If in Textile mode or editing a dedicated Textile product, redirect
          if (p.sku?.startsWith("FAB-") && !isRestaurant) {
            router.replace(`/textile/products/edit/${id}`);
            return;
          }

          let existingWhId = p.inventories?.[0]?.warehouseId || p.warehouseId || "";
          if (!existingWhId && p.warehouseLocation && fetchedWarehouses.length > 0) {
            const matched = fetchedWarehouses.find((w) => w.name === p.warehouseLocation || w.id === p.warehouseLocation);
            if (matched) existingWhId = matched.id;
          }
          if (!existingWhId && fetchedWarehouses.length > 0) {
            existingWhId = fetchedWarehouses[0].id;
          }

          setProduct({
            name: p.name || "",
            sku: p.sku || "",
            barcode: p.barcode || p.barcodes?.[0]?.barcode || "",
            categoryId: p.categoryId || "",
            subcategoryId: p.subcategoryId || "",
            brandId: p.brandId || "",
            baseUnitId: p.unitId || p.baseUnitId || "",
            description: p.description || "",
            status: p.status || "ACTIVE",

            stockUnit: p.stockUnit || "Piece / Pcs",
            initialStock: p.initialStock !== undefined && p.initialStock !== null ? String(p.initialStock) : "",
            openingStockDate: p.openingStockDate ? p.openingStockDate.split("T")[0] : "",
            reorderLevel: p.reorderLevel !== undefined && p.reorderLevel !== null ? String(p.reorderLevel) : "10",
            minimumStock: p.minimumStock !== undefined && p.minimumStock !== null ? String(p.minimumStock) : "5",
            maximumStock: p.maximumStock !== undefined && p.maximumStock !== null ? String(p.maximumStock) : "500",
            warehouseId: existingWhId,
            warehouseLocation: p.warehouseLocation || (fetchedWarehouses.find((w) => w.id === existingWhId)?.name || ""),
            rackLocation: p.rackLocation || "Shelf A-1",

            costPrice: p.costPrice !== undefined && p.costPrice !== null ? String(p.costPrice) : "",
            sellingPrice: p.sellingPrice !== undefined && p.sellingPrice !== null ? String(p.sellingPrice) : "",
            wholesalePrice: p.wholesalePrice !== undefined && p.wholesalePrice !== null ? String(p.wholesalePrice) : "",
            retailPrice: p.retailPrice !== undefined && p.retailPrice !== null ? String(p.retailPrice) : "",
            discountValue: p.discountValue !== undefined && p.discountValue !== null ? String(p.discountValue) : "",
            discountType: p.discountType || "PERCENT",
            taxRate: p.taxRate !== undefined && p.taxRate !== null ? String(p.taxRate) : "18",

            supplierId: p.supplierId || "",
            supplierProductCode: p.supplierProductCode || "",

            purchaseUnit: p.purchaseUnit || "Box",
            conversionFactor: p.conversionFactor ? String(p.conversionFactor) : "10",
            reorderQuantity: p.reorderQuantity ? String(p.reorderQuantity) : "20",
            supplierReference: p.supplierReference || "",
            restaurantOutletId: p.restaurantOutletId || "",
            defaultStorageLocation: p.defaultStorageLocation || "Main Store",
            storageType: p.storageType || "Freezer",
            isPerishable: p.isPerishable !== undefined ? Boolean(p.isPerishable) : true,
            isExpiryTracking: p.isExpiryTracking !== undefined ? Boolean(p.isExpiryTracking) : true,
            isBatchTracking: p.isBatchTracking !== undefined ? Boolean(p.isBatchTracking) : true,
          });

          if (p.image) {
            setImagePreview(
              p.image.startsWith("http")
                ? p.image
                : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${p.image.startsWith("/") ? "" : "/"}${p.image}`
            );
          }
        }
      } catch (err) {
        console.error("Error loading product data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, isTextile]);

  // Scanner cleanup
  const stopScanner = () => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.warn("Scanner stop error:", e);
    }
  };

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner();
      return;
    }

    let mounted = true;
    const startScanner = async () => {
      try {
        setIsStarting(true);
        setScannerError("");
        const codeReader = new BrowserMultiFormatReader();
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoElement,
          (result, error) => {
            if (!mounted) return;
            if (result) {
              const text = result.getText();
              setProduct((prev) => ({ ...prev, barcode: text }));
              toast.success(`Barcode Scanned: ${text}`);
              setScannerOpen(false);
              stopScanner();
            }
          }
        );

        if (mounted) {
          controlsRef.current = controls;
          setIsStarting(false);
        }
      } catch (error) {
        if (!mounted) return;
        setIsStarting(false);
        setScannerError("Camera permission denied or camera in use.");
      }
    };

    startScanner();
    return () => {
      mounted = false;
      stopScanner();
    };
  }, [scannerOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const scrollToSection = (stepNum, sectionId) => {
    setActiveStep(stepNum);
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!product.name.trim()) {
      toast.error("Please enter the Product Name.");
      scrollToSection(1, "sec-basic-info");
      return;
    }

    if (!product.categoryId) {
      toast.error("Please select a Category.");
      scrollToSection(1, "sec-basic-info");
      return;
    }

    if (!isRestaurant && (!product.sellingPrice || Number(product.sellingPrice) <= 0)) {
      toast.error("Please enter a valid Selling Price.");
      scrollToSection(3, "sec-pricing");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", product.name.trim());
      formData.append("sku", product.sku.trim());
      formData.append("barcode", product.barcode.trim());
      formData.append("description", product.description.trim());
      formData.append("status", product.status);
      formData.append("isTextile", "false");
      formData.append("hasVariants", "false");

      if (product.categoryId) formData.append("categoryId", product.categoryId);
      if (product.subcategoryId) formData.append("subcategoryId", product.subcategoryId);
      if (product.brandId) formData.append("brandId", product.brandId);
      if (product.baseUnitId) formData.append("baseUnitId", product.baseUnitId);

      formData.append("stockUnit", product.stockUnit);
      formData.append("initialStock", product.initialStock || "0");
      formData.append("openingStockDate", product.openingStockDate);
      formData.append("reorderLevel", product.reorderLevel || "10");
      formData.append("minimumStock", product.minimumStock || "5");
      formData.append("maximumStock", product.maximumStock || "500");
      if (product.warehouseId) formData.append("warehouseId", product.warehouseId);
      formData.append("warehouseLocation", product.warehouseLocation || "");
      formData.append("rackLocation", product.rackLocation);

      formData.append("costPrice", product.costPrice || "0");
      formData.append("sellingPrice", product.sellingPrice || "0");
      formData.append("wholesalePrice", product.wholesalePrice || "0");
      formData.append("retailPrice", product.retailPrice || "0");
      formData.append("taxRate", product.taxRate || "0");
      formData.append("discountType", product.discountType);
      formData.append("discountValue", product.discountValue || "0");

      if (product.supplierId) formData.append("supplierId", product.supplierId);
      formData.append("supplierProductCode", product.supplierProductCode);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      await apiClient.put(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`Product "${product.name}" updated successfully!`);
      showSuccess("Product Updated", `"${product.name}" has been updated.`);
      setTimeout(() => {
        router.push("/admin/products/view");
      }, 800);
    } catch (err) {
      console.error("Error updating product:", err);
      const errMsg = err.response?.data?.message || "Failed to update product.";
      toast.error(errMsg);
      showError("Update Failed", errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh", gap: "12px" }}>
        <Loader2 style={{ animation: "spin 1s linear infinite", color: "#2563eb" }} size={36} />
        <p style={{ color: "#64748b", fontWeight: "600", fontSize: "15px" }}>Loading Product Details...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toaster position="top-right" />

      {/* HERO HEADER BANNER */}
      <div className={styles.heroBanner}>
        <div>
          <span className={styles.badgePill}>
            <FiShoppingBag size={13} /> Commercial Retail ERP
          </span>
          <h1 className={styles.heroTitle}>Edit Retail Product</h1>
          <p className={styles.heroSubtitle}>
            Update packaged goods, electronics, or retail stock. Clean, simple, and ready for instant POS barcode scanning.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push("/admin/products/view")}
          >
            <FiArrowLeft size={15} />
            <span>Cancel</span>
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            <FiSave size={16} />
            <span>{submitting ? "Updating Product..." : "Update Product"}</span>
          </button>
        </div>
      </div>

      {/* VISUAL STEPPER NAVIGATION */}
      <div className={styles.stepperNav}>
        <div
          className={`${styles.stepItem} ${activeStep === 1 ? styles.activeStep : ""}`}
          onClick={() => scrollToSection(1, "sec-basic-info")}
        >
          <div className={styles.stepNumber}>1</div>
          <span className={styles.stepTitle}>Basic Info</span>
        </div>

        <div
          className={`${styles.stepItem} ${activeStep === 2 ? styles.activeStep : ""}`}
          onClick={() => scrollToSection(2, "sec-inventory")}
        >
          <div className={styles.stepNumber}>2</div>
          <span className={styles.stepTitle}>Inventory Details</span>
        </div>

        <div
          className={`${styles.stepItem} ${activeStep === 3 ? styles.activeStep : ""}`}
          onClick={() => scrollToSection(3, "sec-pricing")}
        >
          <div className={styles.stepNumber}>3</div>
          <span className={styles.stepTitle}>Pricing & Taxes</span>
        </div>

        <div
          className={`${styles.stepItem} ${activeStep === 4 ? styles.activeStep : ""}`}
          onClick={() => scrollToSection(4, "sec-supplier")}
        >
          <div className={styles.stepNumber}>4</div>
          <span className={styles.stepTitle}>Supplier & Photo</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formLayout}>
        {/* LEFT COLUMN */}
        <div className={styles.mainColumn}>
          {/* SECTION 1: Basic Information */}
          <div id="sec-basic-info" className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.cardIconBox}>
                  <FiPackage />
                </div>
                <h2>1. Basic Information</h2>
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>General Fields</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label>
                  Product Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Product Code / SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={product.sku}
                    onChange={handleChange}
                    placeholder="e.g. RET-00123"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Barcode / EAN / UPC</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      name="barcode"
                      value={product.barcode}
                      onChange={handleChange}
                      placeholder="e.g. 8901234567890"
                      style={{ width: "100%" }}
                    />
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      style={{
                        padding: "0 14px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: "600",
                        fontSize: "13px",
                      }}
                      title="Scan Barcode via Camera"
                    >
                      <FiCamera size={16} />
                      <span>Scan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CAMERA SCANNER MODAL */}
              {scannerOpen && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      padding: "24px",
                      maxWidth: "480px",
                      width: "100%",
                      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Point Camera at Barcode</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setScannerOpen(false);
                          stopScanner();
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                      >
                        <FiX size={20} />
                      </button>
                    </div>

                    <div style={{ position: "relative", width: "100%", height: "260px", backgroundColor: "#000000", borderRadius: "8px", overflow: "hidden" }}>
                      <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {isStarting && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
                          <Loader2 className="animate-spin" size={32} />
                        </div>
                      )}
                    </div>
                    {scannerError && <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "8px" }}>{scannerError}</p>}
                  </div>
                </div>
              )}

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>
                    Category <span className={styles.required}>*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={product.categoryId}
                    onChange={handleChange}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Subcategory</label>
                  <input
                    type="text"
                    name="subcategoryId"
                    value={product.subcategoryId}
                    onChange={handleChange}
                    placeholder="e.g. Wireless, Audio"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Brand</label>
                  <select
                    name="brandId"
                    value={product.brandId}
                    onChange={handleChange}
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select
                    name="status"
                    value={product.status}
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">Active (Sellable)</option>
                    <option value="INACTIVE">Inactive (Archived)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter detailed product description or marketing highlights..."
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Inventory Details */}
          <div id="sec-inventory" className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.cardIconBox}>
                  <FiArchive />
                </div>
                <h2>2. Inventory & Stock Tracking</h2>
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Warehouse Stock</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Unit of Measure (UoM)</label>
                  <select
                    name="stockUnit"
                    value={product.stockUnit}
                    onChange={handleChange}
                  >
                    {units.map((u) => (
                      <option key={u.id || u.code} value={u.name || u.code}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Initial / Opening Stock</label>
                  <input
                    type="number"
                    name="initialStock"
                    value={product.initialStock}
                    onChange={handleChange}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              <div className={styles.row3}>
                <div className={styles.formGroup}>
                  <label>Min Stock Alert</label>
                  <input
                    type="number"
                    name="minimumStock"
                    value={product.minimumStock}
                    onChange={handleChange}
                    placeholder="5"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Reorder Level</label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={product.reorderLevel}
                    onChange={handleChange}
                    placeholder="10"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Max Storage Cap</label>
                  <input
                    type="number"
                    name="maximumStock"
                    value={product.maximumStock}
                    onChange={handleChange}
                    placeholder="500"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ margin: 0 }}>
                      Warehouse <span className={styles.required}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <a
                        href="/warehouse/add"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#4f46e5", fontSize: "12px", fontWeight: "700", textDecoration: "none" }}
                      >
                        + Add Warehouse
                      </a>
                      <a
                        href="/warehouse"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", textDecoration: "underline" }}
                      >
                        Warehouses List ↗
                      </a>
                    </div>
                  </div>
                  <select
                    name="warehouseId"
                    value={product.warehouseId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selectedWh = warehouses.find((w) => w.id === val);
                      setProduct((prev) => ({
                        ...prev,
                        warehouseId: val,
                        warehouseLocation: selectedWh ? selectedWh.name : "",
                      }));
                    }}
                    required
                  >
                    <option value="">
                      {warehouses.length === 0 ? "No warehouses available" : "Select Warehouse"}
                    </option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} {wh.code ? `(${wh.code})` : ""} {wh.location ? `- ${wh.location}` : ""}
                      </option>
                    ))}
                  </select>
                  {warehouses.length === 0 && (
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>No warehouses available. Please add a warehouse first.</span>
                      <a href="/warehouse/add" style={{ color: "#2563eb", fontWeight: "700", textDecoration: "underline" }}>
                        + Add Warehouse
                      </a>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Rack / Shelf Location</label>
                  <input
                    type="text"
                    name="rackLocation"
                    value={product.rackLocation}
                    onChange={handleChange}
                    placeholder="e.g. Shelf B-4"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Pricing & Taxes */}
          <div id="sec-pricing" className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.cardIconBox}>
                  <FiDollarSign />
                </div>
                <h2>3. Pricing & Tax Details</h2>
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Retail Rates</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Cost / Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    value={product.costPrice}
                    onChange={handleChange}
                    placeholder="e.g. 450.00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Selling Price (₹) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sellingPrice"
                    value={product.sellingPrice}
                    onChange={handleChange}
                    placeholder="e.g. 699.00"
                    required
                  />
                </div>
              </div>

              <div className={styles.row3}>
                <div className={styles.formGroup}>
                  <label>Wholesale / B2B Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="wholesalePrice"
                    value={product.wholesalePrice}
                    onChange={handleChange}
                    placeholder="e.g. 580.00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>MRP / Retail Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="retailPrice"
                    value={product.retailPrice}
                    onChange={handleChange}
                    placeholder="e.g. 799.00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tax / GST Rate (%)</label>
                  <select
                    name="taxRate"
                    value={product.taxRate}
                    onChange={handleChange}
                  >
                    <option value="0">0% (GST Exempted)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST (Standard)</option>
                    <option value="28">28% GST (Luxury)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Supplier Information */}
          <div id="sec-supplier" className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.cardIconBox}>
                  <FiTruck />
                </div>
                <h2>4. Supplier Information</h2>
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Vendor Link</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Primary Supplier</label>
                  <select
                    name="supplierId"
                    value={product.supplierId}
                    onChange={handleChange}
                  >
                    <option value="">Choose Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.contactPerson ? `(${s.contactPerson})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Supplier Product / Part Code</label>
                  <input
                    type="text"
                    name="supplierProductCode"
                    value={product.supplierProductCode}
                    onChange={handleChange}
                    placeholder="e.g. SUPP-PART-990"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (IMAGE & SUMMARY) */}
        <div className={styles.sideColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.cardIconBox}>
                  <FiUpload />
                </div>
                <h2>Product Image</h2>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div
                className={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                {imagePreview ? (
                  <div className={styles.previewContainer}>
                    <img src={imagePreview} alt="Product Preview" className={styles.previewImage} />
                    <button
                      type="button"
                      className={styles.removeImageBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <FiUpload size={32} style={{ color: "#4f46e5", marginBottom: "8px" }} />
                    <p style={{ fontWeight: "700", color: "#334155", margin: "0 0 4px" }}>Click to upload product photo</p>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>PNG, JPG or WEBP up to 5MB</span>
                  </div>
                )}
              </div>

              {/* QUICK PRODUCT SUMMARY */}
              <div style={{ marginTop: "20px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>
                  Product Summary
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#64748b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Name:</span>
                    <strong style={{ color: "#0f172a" }}>{product.name || "Untitled"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>SKU:</span>
                    <strong>{product.sku || "N/A"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Selling Price:</span>
                    <strong style={{ color: "#2563eb" }}>₹{product.sellingPrice || "0.00"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Opening Stock:</span>
                    <strong>{product.initialStock || "0"} {product.stockUnit}</strong>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={submitting}
                >
                  <FiSave size={16} />
                  <span>{submitting ? "Updating..." : "Update Product"}</span>
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => router.push("/admin/products/view")}
                >
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
