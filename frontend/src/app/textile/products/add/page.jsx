"use client";

import { useRef, useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  FiUpload,
  FiSave,
  FiPackage,
  FiX,
  FiLayers,
  FiDollarSign,
  FiArchive,
  FiTruck,
  FiGrid,
  FiPlus,
  FiTrash2,
  FiZap,
  FiCheckCircle,
} from "react-icons/fi";

import styles from "@/app/admin/products/add/addProducts.module.css";
import { useAlert } from "@/context/AlertContext";
import apiClient from "@/services/apiClient";
import { useCompany } from "@/context/CompanyContext";

const STOCK_UNITS = ["Meter", "Yard", "Piece", "Roll", "KG"];

const WEAVE_TYPES = [
  "Plain Weave",
  "Twill",
  "Satin",
  "Jacquard",
  "Dobby",
  "Knit",
  "Velvet",
];

const PATTERN_TYPES = [
  "Plain / Solid",
  "Printed",
  "Striped",
  "Checkered",
  "Floral",
  "Embroidered",
  "Damask",
  "Geometrical",
];

const TEXTURE_FINISHES = [
  "Soft",
  "Matte",
  "Glossy",
  "Brushed",
  "Mercerized",
  "Wrinkle-free",
  "Crinkle",
];

const PRESET_COLOR_MAP = {
  "royal blue": "#1e40af",
  "navy blue": "#1e3a8a",
  "sky blue": "#38bdf8",
  "crimson red": "#dc2626",
  "ruby red": "#b91c1c",
  "emerald green": "#059669",
  "olive green": "#65a30d",
  "charcoal black": "#1f2937",
  "black": "#000000",
  "pearl white": "#f8fafc",
  "white": "#ffffff",
  "golden yellow": "#eab308",
  "mustard": "#ca8a04",
  "maroon": "#881337",
  "purple": "#9333ea",
  "lavender": "#c084fc",
  "peach": "#fb923c",
  "beige": "#f5f5dc",
  "grey": "#6b7280",
  "silver": "#9ca3af",
};

const initialProduct = {
  // Step 1: Basic Info
  name: "",
  sku: "",
  barcode: "",
  categoryId: "",
  subcategory: "",
  brandId: "",
  status: "ACTIVE",
  description: "",

  // Step 2: Fabric Specs
  isTextile: true,
  fabricComposition: "100% Cotton",
  gsm: "180",
  rollWidth: "58",
  widthUnit: "Inches",
  pattern: "Plain / Solid",
  weaveType: "Plain Weave",
  textureFinish: "Soft",

  // Step 3: Inventory & Stock
  stockUnit: "Meter",
  initialStock: "500",
  numberOfRolls: "10",
  openingStockDate: new Date().toISOString().split("T")[0],
  reorderLevel: "50", // Low Stock Alert Level
  warehouseId: "",
  rackLocation: "Rack FAB-12",

  // Step 4: Pricing & GST
  costPrice: "240",
  wholesalePrice: "310",
  sellingPrice: "350",
  retailPrice: "390", // MRP
  discountValue: "0",
  discountType: "PERCENT",
  taxRate: "12",

  // Step 5: Supplier / Manufacturing Information
  supplierId: "",
  supplierProductCode: "TEX-SUP-901",
  branchId: "", // Manufacturing Unit
  leadTime: "7",

  // Step 6: Product Variants
  hasVariants: false,
};

export default function AddTextileProductPage() {
  const router = useRouter();
  const { showWarning } = useAlert();
  const { isTextile, isRetail } = useCompany();

  useEffect(() => {
    if (!isTextile) {
      router.replace("/admin/products/add");
    }
  }, [isTextile, router]);

  const [product, setProduct] = useState(initialProduct);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]); // Manufacturing Units
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Quick Add Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    status: "ACTIVE",
  });
  const [savingCategory, setSavingCategory] = useState(false);

  // Quick Add Brand/Mill Modal State
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandFormData, setBrandFormData] = useState({
    name: "",
    type: "Textile Mill",
    location: "",
    contactPerson: "",
    phone: "",
    status: "ACTIVE",
  });
  const [savingBrand, setSavingBrand] = useState(false);

  // Dynamic Variants state
  const [variants, setVariants] = useState([]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const generateSkuCode = (fabricName = "") => {
    let prefix = "FAB-TEX";
    if (fabricName && fabricName.trim().length >= 3) {
      const clean = fabricName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (clean.length >= 3) {
        prefix = `FAB-${clean.slice(0, 4)}`;
      }
    }
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomSuffix}`;
  };

  useEffect(() => {
    setProduct((prev) => {
      if (!prev.sku) {
        return { ...prev, sku: generateSkuCode() };
      }
      return prev;
    });
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [catRes, brandRes, suppRes, whRes, branchRes] = await Promise.allSettled([
        apiClient.get("/categories"),
        apiClient.get("/brands"),
        apiClient.get("/suppliers"),
        apiClient.get("/warehouses"),
        apiClient.get("/branches"),
      ]);

      if (catRes.status === "fulfilled") {
        const catList = catRes.value.data?.data || catRes.value.data || [];
        setCategories(Array.isArray(catList) ? catList : []);
      }
      if (brandRes.status === "fulfilled") {
        const brandList = brandRes.value.data?.data || brandRes.value.data || [];
        setBrands(Array.isArray(brandList) ? brandList : []);
      }
      if (suppRes.status === "fulfilled") {
        const suppList = suppRes.value.data?.data || suppRes.value.data || [];
        setSuppliers(Array.isArray(suppList) ? suppList : []);
      }
      if (whRes.status === "fulfilled") {
        const whList = whRes.value.data?.data || whRes.value.data || [];
        setWarehouses(Array.isArray(whList) ? whList : []);
        if (whList.length > 0 && !product.warehouseId) {
          setProduct((prev) => ({ ...prev, warehouseId: whList[0].id }));
        }
      }
      if (branchRes.status === "fulfilled") {
        const bList = branchRes.value.data?.data || branchRes.value.data || [];
        setBranches(Array.isArray(bList) ? bList : []);
      }
    } catch (error) {
      console.error("Error fetching form data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handler: Save New Category from Quick-Add Modal
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    const trimmedName = categoryFormData.name.trim();
    const existing = categories.find(
      (c) => c.name?.toLowerCase().trim() === trimmedName.toLowerCase()
    );
    if (existing) {
      toast.error("A category with this name already exists.");
      setProduct((prev) => ({ ...prev, categoryId: existing.id }));
      setShowCategoryModal(false);
      return;
    }

    try {
      setSavingCategory(true);
      const res = await apiClient.post("/categories", {
        name: trimmedName,
        description: categoryFormData.description.trim() || undefined,
        status: categoryFormData.status || "ACTIVE",
      });

      const newCat = res.data?.data || res.data;
      if (newCat && newCat.id) {
        setCategories((prev) => [...prev, newCat]);
        setProduct((prev) => ({ ...prev, categoryId: newCat.id }));
        toast.success(`Category "${newCat.name}" created and selected!`);
        setShowCategoryModal(false);
        setCategoryFormData({ name: "", description: "", status: "ACTIVE" });
      } else {
        throw new Error(res.data?.message || "Failed to create category");
      }
    } catch (err) {
      console.error("Error creating category:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to create category.");
    } finally {
      setSavingCategory(false);
    }
  };

  // Handler: Save New Brand / Mill from Quick-Add Modal
  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandFormData.name.trim()) {
      toast.error("Brand / Mill name is required.");
      return;
    }

    const trimmedName = brandFormData.name.trim();
    const existing = brands.find(
      (b) => b.name?.toLowerCase().trim() === trimmedName.toLowerCase()
    );
    if (existing) {
      toast.error("A Brand / Mill with this name already exists.");
      setProduct((prev) => ({ ...prev, brandId: existing.id }));
      setShowBrandModal(false);
      return;
    }

    try {
      setSavingBrand(true);
      const descParts = [];
      if (brandFormData.type) descParts.push(`[Type: ${brandFormData.type}]`);
      if (brandFormData.location) descParts.push(`Location: ${brandFormData.location}`);
      if (brandFormData.contactPerson) descParts.push(`Contact: ${brandFormData.contactPerson}`);
      if (brandFormData.phone) descParts.push(`Phone: ${brandFormData.phone}`);
      const description = descParts.join(" | ");

      const res = await apiClient.post("/brands", {
        name: trimmedName,
        description: description || undefined,
        status: brandFormData.status || "ACTIVE",
      });

      const newBrand = res.data?.data || res.data;
      if (newBrand && newBrand.id) {
        setBrands((prev) => [...prev, newBrand]);
        setProduct((prev) => ({ ...prev, brandId: newBrand.id }));
        toast.success(`Brand / Mill "${newBrand.name}" created and selected!`);
        setShowBrandModal(false);
        setBrandFormData({
          name: "",
          type: "Textile Mill",
          location: "",
          contactPerson: "",
          phone: "",
          status: "ACTIVE",
        });
      } else {
        throw new Error(res.data?.message || "Failed to create brand");
      }
    } catch (err) {
      console.error("Error creating brand:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to create Brand / Mill.");
    } finally {
      setSavingBrand(false);
    }
  };

  // Step 6: Variant Management
  const handleAddVariant = () => {
    const variantIndex = variants.length + 1;
    const baseSku = product.sku.trim() || "FAB-TEX";
    const newVariant = {
      id: Date.now().toString(),
      color: "",
      colorCode: "#3b82f6",
      sku: `${baseSku}-VAR-${variantIndex}`,
      barcode: "",
      stock: "150",
      sellingPrice: product.sellingPrice || "350",
      status: "ACTIVE",
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  const handleRemoveVariant = (id) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleVariantChange = (id, field, value) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const updated = { ...v, [field]: value };
          if (field === "color") {
            const matchHex = PRESET_COLOR_MAP[value.toLowerCase().trim()];
            if (matchHex) {
              updated.colorCode = matchHex;
            }
          }
          return updated;
        }
        return v;
      })
    );
  };

  const handleGenerateQuickColorVariants = () => {
    if (!quickColors.trim()) {
      toast.error("Please enter color names separated by commas (e.g. Royal Blue, Red, White)");
      return;
    }
    const colorList = quickColors.split(",").map((c) => c.trim()).filter(Boolean);
    const baseSku = product.sku.trim() || "FAB-TEX";

    const generated = colorList.map((colName, idx) => {
      const cleanCol = colName.toLowerCase();
      const hexCode = PRESET_COLOR_MAP[cleanCol] || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
      const skuSuffix = colName.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 8);

      return {
        id: `${Date.now()}-${idx}`,
        color: colName,
        colorCode: hexCode,
        sku: `${baseSku}-${skuSuffix}`,
        barcode: "",
        stock: "200",
        sellingPrice: product.sellingPrice || "350",
        status: "ACTIVE",
      };
    });

    setVariants(generated);
    setProduct((prev) => ({ ...prev, hasVariants: true }));
    toast.success(`Generated ${generated.length} color variants!`);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    if (!product.name.trim()) {
      showWarning("Validation Required", "Please enter a Fabric / Product Name.");
      scrollToSection(1, "tex-basic-info");
      return false;
    }
    if (!product.categoryId) {
      showWarning("Validation Required", "Please select a Category.");
      scrollToSection(1, "tex-basic-info");
      return false;
    }
    if (!product.sellingPrice || Number(product.sellingPrice) <= 0) {
      showWarning("Validation Required", `Please specify a valid Selling Price per ${product.stockUnit}.`);
      scrollToSection(4, "tex-pricing");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const skuCode = product.sku.trim() || `FAB-TEX-${Date.now().toString().slice(-6)}`;

    try {
      const formData = new FormData();
      formData.append("name", product.name.trim());
      formData.append("sku", skuCode);
      formData.append("barcode", product.barcode.trim());
      formData.append("description", product.description.trim());
      formData.append("isTextile", "true");
      formData.append("status", product.status);

      if (product.categoryId) formData.append("categoryId", product.categoryId);
      if (product.subcategory) formData.append("subcategory", product.subcategory.trim());
      if (product.brandId) formData.append("brandId", product.brandId);

      // Fabric Specs
      formData.append("fabricComposition", product.fabricComposition);
      formData.append("gsm", product.gsm);
      formData.append("rollWidth", product.rollWidth);
      formData.append("widthUnit", product.widthUnit);
      formData.append("pattern", product.pattern);
      formData.append("weaveType", product.weaveType);
      formData.append("textureFinish", product.textureFinish);

      // Inventory & Stock
      formData.append("stockUnit", product.stockUnit);
      formData.append("initialStock", product.initialStock || "0");
      formData.append("numberOfRolls", product.numberOfRolls || "0");
      formData.append("openingStockDate", product.openingStockDate);
      formData.append("reorderLevel", product.reorderLevel || "0"); // Low Stock Alert Level
      if (product.warehouseId) formData.append("warehouseId", product.warehouseId);
      formData.append("rackLocation", product.rackLocation);

      // Pricing & GST
      formData.append("costPrice", product.costPrice || "0");
      formData.append("sellingPrice", product.sellingPrice || "0");
      formData.append("wholesalePrice", product.wholesalePrice || "0");
      formData.append("retailPrice", product.retailPrice || "0");
      formData.append("discountValue", product.discountValue || "0");
      formData.append("discountType", product.discountType);
      formData.append("taxRate", product.taxRate || "0");

      // Supplier / Manufacturing
      if (product.supplierId) formData.append("supplierId", product.supplierId);
      formData.append("supplierProductCode", product.supplierProductCode);
      if (product.branchId) formData.append("branchId", product.branchId);
      formData.append("leadTime", product.leadTime || "0");

      // Variants
      if (product.hasVariants && variants.length > 0) {
        formData.append("hasVariants", "true");
        formData.append("variants", JSON.stringify(variants));
      } else {
        formData.append("hasVariants", "false");
      }

      if (image) {
        formData.append("image", image);
      }

      await apiClient.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`Textile Fabric "${product.name}" created successfully!`);
      setTimeout(() => {
        router.push("/textile/products");
      }, 800);
    } catch (error) {
      console.error("Error creating textile product:", error);
      const errMsg = error.response?.data?.message || "Failed to create fabric product.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToSection = (stepNum, sectionId) => {
    setActiveStep(stepNum);
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={styles.container}>
      <Toaster position="top-right" />

      {/* TEXTILE HERO HEADER BANNER */}
      <div className={styles.textileHeroBanner}>
        <div>
          <span className={styles.badgePill}>
            <FiLayers size={13} /> Textile Mill ERP
          </span>
          <h1 className={styles.heroTitle}>Add Textile Fabric Product</h1>
          <p className={styles.heroSubtitle}>
            Register finished fabric rolls, weave specifications, inventory stock, and color variants matrix.
          </p>
        </div>

        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push("/textile/products")}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.textileSaveBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            <FiSave size={16} />
            {submitting ? "Saving Fabric..." : "Save Textile Product"}
          </button>
        </div>
      </div>

      {/* VISUAL STEPPER NAVIGATION (6 Steps) */}
      <div className={styles.stepperNav}>
        <div
          className={`${styles.stepItem} ${activeStep === 1 ? styles.activeTextileStep : ""}`}
          onClick={() => scrollToSection(1, "tex-basic-info")}
        >
          <div className={styles.stepNumber}>1</div>
          <span className={styles.stepTitle}>Basic Info</span>
        </div>

        <div
          className={`${styles.stepItem} ${activeStep === 2 ? styles.activeTextileStep : ""}`}
          onClick={() => scrollToSection(2, "tex-specs")}
        >
          <div className={styles.stepNumber}>2</div>
          <span className={styles.stepTitle}>Fabric Specs</span>
        </div>

        <div
          className={`${styles.stepItem} ${activeStep === 3 ? styles.activeTextileStep : ""}`}
          onClick={() => scrollToSection(3, "tex-inventory")}
        >
          <div className={styles.stepNumber}>3</div>
          <span className={styles.stepTitle}>Inventory & Stock</span>
        </div>

        <div
          className={`${styles.stepItem} ${activeStep === 4 ? styles.activeTextileStep : ""}`}
          onClick={() => scrollToSection(4, "tex-pricing")}
        >
          <div className={styles.stepNumber}>4</div>
          <span className={styles.stepTitle}>Pricing & GST</span>
        </div>

        <div
          className={`${styles.stepItem} ${activeStep === 5 ? styles.activeTextileStep : ""}`}
          onClick={() => scrollToSection(5, "tex-supplier")}
        >
          <div className={styles.stepNumber}>5</div>
          <span className={styles.stepTitle}>Supplier / Manufacturing</span>
        </div>

        <div
          className={`${styles.stepItem} ${activeStep === 6 ? styles.activeTextileStep : ""}`}
          onClick={() => scrollToSection(6, "tex-variants")}
        >
          <div className={styles.stepNumber}>6</div>
          <span className={styles.stepTitle}>Product Variants</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formLayout}>
        {/* LEFT COLUMN */}
        <div className={styles.mainColumn}>
          {/* STEP 1: Basic Information */}
          <div id="tex-basic-info" className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.textileIconBox}>
                  <FiPackage />
                </div>
                <h2>1. Basic Product Information</h2>
              </div>
              <span style={{ fontSize: "12px", color: "#0d9488", fontWeight: "700" }}>Core Identity</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label>
                  Fabric / Product Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  placeholder="e.g. Premium Cotton Poplin 40s"
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ margin: 0 }}>
                      Product Code / SKU <span className={styles.required}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newSku = generateSkuCode(product.name);
                        setProduct((prev) => ({ ...prev, sku: newSku }));
                        toast.success(`Generated SKU: ${newSku}`);
                      }}
                      title="Auto Generate Unique SKU Code"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#0d9488",
                        background: "#ccfbf1",
                        border: "1px solid #99f6e4",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <FiZap size={13} /> Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    name="sku"
                    value={product.sku}
                    onChange={handleChange}
                    placeholder="e.g. FAB-TEX-892301"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Barcode / EAN (Optional)</label>
                  <input
                    type="text"
                    name="barcode"
                    value={product.barcode}
                    onChange={handleChange}
                    placeholder="e.g. 8901234567890"
                  />
                </div>
              </div>

              <div className={styles.row}>
                {/* Category with Quick Add Button */}
                <div className={styles.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ margin: 0 }}>
                      Category <span className={styles.required}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      title="Add New Textile Category"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#0d9488",
                        background: "#ccfbf1",
                        border: "1px solid #99f6e4",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <FiPlus size={13} /> Add
                    </button>
                  </div>
                  <select
                    name="categoryId"
                    value={product.categoryId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category (Cotton, Silk, Linen...)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Subcategory (Optional)</label>
                  <input
                    type="text"
                    name="subcategory"
                    value={product.subcategory}
                    onChange={handleChange}
                    placeholder="e.g. Shirting, Suiting, Denim..."
                  />
                </div>
              </div>

              <div className={styles.row}>
                {/* Brand / Mill with Quick Add Button */}
                <div className={styles.formGroup}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ margin: 0 }}>Brand / Mill Name (Optional)</label>
                    <button
                      type="button"
                      onClick={() => setShowBrandModal(true)}
                      title="Add New Brand / Mill"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#0d9488",
                        background: "#ccfbf1",
                        border: "1px solid #99f6e4",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <FiPlus size={13} /> Add
                    </button>
                  </div>
                  <select
                    name="brandId"
                    value={product.brandId}
                    onChange={handleChange}
                  >
                    <option value="">Select Brand / Textile Mill</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Status <span className={styles.required}>*</span></label>
                  <select
                    name="status"
                    value={product.status}
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Product Description (Optional)</label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter detailed fabric specifications, yarn count, care instructions, or finish notes..."
                />
              </div>
            </div>
          </div>

          {/* STEP 2: Fabric Specifications */}
          <div id="tex-specs" className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.textileIconBox}>
                  <FiLayers />
                </div>
                <h2>2. Fabric Specifications</h2>
              </div>
              <span style={{ fontSize: "12px", color: "#0d9488", fontWeight: "700" }}>Textile Metrics</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Fabric Composition</label>
                  <input
                    type="text"
                    name="fabricComposition"
                    value={product.fabricComposition}
                    onChange={handleChange}
                    placeholder="e.g. 100% Cotton, Cotton Blend, Polyester"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>GSM (g/m²)</label>
                  <input
                    type="number"
                    name="gsm"
                    value={product.gsm}
                    onChange={handleChange}
                    placeholder="e.g. 180"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Fabric Width</label>
                  <input
                    type="number"
                    name="rollWidth"
                    value={product.rollWidth}
                    onChange={handleChange}
                    placeholder="e.g. 58"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Width Unit</label>
                  <select
                    name="widthUnit"
                    value={product.widthUnit}
                    onChange={handleChange}
                  >
                    <option value="Inches">Inches</option>
                    <option value="CM">CM</option>
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Pattern / Design</label>
                  <select
                    name="pattern"
                    value={product.pattern}
                    onChange={handleChange}
                  >
                    {PATTERN_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Weave Type</label>
                  <select
                    name="weaveType"
                    value={product.weaveType}
                    onChange={handleChange}
                  >
                    {WEAVE_TYPES.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Texture / Finish</label>
                <select
                  name="textureFinish"
                  value={product.textureFinish}
                  onChange={handleChange}
                >
                  {TEXTURE_FINISHES.map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 3: Inventory & Stock */}
          <div id="tex-inventory" className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.textileIconBox}>
                  <FiArchive />
                </div>
                <h2>3. Inventory & Stock</h2>
              </div>
              <span style={{ fontSize: "12px", color: "#0d9488", fontWeight: "700" }}>Mill Quantities</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Stock Unit <span className={styles.required}>*</span></label>
                  <select
                    name="stockUnit"
                    value={product.stockUnit}
                    onChange={handleChange}
                  >
                    {STOCK_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Opening Stock Quantity ({product.stockUnit}s)</label>
                  <input
                    type="number"
                    name="initialStock"
                    value={product.initialStock}
                    onChange={handleChange}
                    placeholder="500"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Number of Fabric Rolls (Optional)</label>
                  <input
                    type="number"
                    name="numberOfRolls"
                    value={product.numberOfRolls}
                    onChange={handleChange}
                    placeholder="10"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Opening Stock Date</label>
                  <input
                    type="date"
                    name="openingStockDate"
                    value={product.openingStockDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Low Stock Alert Level ({product.stockUnit}s)</label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={product.reorderLevel}
                    onChange={handleChange}
                    placeholder="50"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Warehouse</label>
                  <select
                    name="warehouseId"
                    value={product.warehouseId}
                    onChange={handleChange}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} {wh.code ? `(${wh.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Rack / Shelf / Bin Location</label>
                <input
                  type="text"
                  name="rackLocation"
                  value={product.rackLocation}
                  onChange={handleChange}
                  placeholder="e.g. Rack FAB-12"
                />
              </div>
            </div>
          </div>

          {/* STEP 4: Pricing & GST */}
          <div id="tex-pricing" className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.textileIconBox}>
                  <FiDollarSign />
                </div>
                <h2>4. Pricing & GST</h2>
              </div>
              <span style={{ fontSize: "12px", color: "#0d9488", fontWeight: "700" }}>
                Price Per {product.stockUnit}
              </span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Cost Price (₹ per {product.stockUnit})</label>
                  <input
                    type="number"
                    name="costPrice"
                    value={product.costPrice}
                    onChange={handleChange}
                    placeholder="240"
                    step="0.01"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Selling Price (₹ per {product.stockUnit}) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={product.sellingPrice}
                    onChange={handleChange}
                    placeholder="350"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Wholesale Price (₹ per {product.stockUnit}) (Optional)</label>
                  <input
                    type="number"
                    name="wholesalePrice"
                    value={product.wholesalePrice}
                    onChange={handleChange}
                    placeholder="310"
                    step="0.01"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>MRP / Retail Price (₹ per {product.stockUnit}) (Optional)</label>
                  <input
                    type="number"
                    name="retailPrice"
                    value={product.retailPrice}
                    onChange={handleChange}
                    placeholder="390"
                    step="0.01"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Default Discount (Optional)</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="number"
                      name="discountValue"
                      value={product.discountValue}
                      onChange={handleChange}
                      placeholder="0"
                      step="0.01"
                      style={{ width: "100%" }}
                    />
                    <select
                      name="discountType"
                      value={product.discountType}
                      onChange={handleChange}
                      style={{ width: "140px" }}
                    >
                      <option value="PERCENT">Percentage (%)</option>
                      <option value="FIXED">Flat (₹)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>GST Rate (%)</label>
                  <select
                    name="taxRate"
                    value={product.taxRate}
                    onChange={handleChange}
                  >
                    <option value="0">0% (Exempted)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 5: Supplier / Manufacturing Information */}
          <div id="tex-supplier" className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.textileIconBox}>
                  <FiTruck />
                </div>
                <h2>5. Supplier / Manufacturing Information</h2>
              </div>
              <span style={{ fontSize: "12px", color: "#0d9488", fontWeight: "700" }}>Supply & Mill</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Default Supplier / Manufacturer (Optional)</label>
                  <select
                    name="supplierId"
                    value={product.supplierId}
                    onChange={handleChange}
                  >
                    <option value="">Select Supplier / Manufacturer</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Supplier Product Code (Optional)</label>
                  <input
                    type="text"
                    name="supplierProductCode"
                    value={product.supplierProductCode}
                    onChange={handleChange}
                    placeholder="e.g. TEX-SUP-901"
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Manufacturing Unit (Optional)</label>
                  <select
                    name="branchId"
                    value={product.branchId}
                    onChange={handleChange}
                  >
                    <option value="">Select Manufacturing Unit / Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.code ? `(${b.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Lead Time in Days (Optional)</label>
                  <input
                    type="number"
                    name="leadTime"
                    value={product.leadTime}
                    onChange={handleChange}
                    placeholder="7"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 6: Product Variants */}
          <div id="tex-variants" className={styles.card}>
            <div className={styles.cardHeader} style={{ justifyContent: "space-between" }}>
              <div className={styles.headerLeft}>
                <div className={styles.textileIconBox}>
                  <FiGrid />
                </div>
                <h2>6. Product Variants</h2>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#0d9488" }}>
                <input
                  type="checkbox"
                  name="hasVariants"
                  checked={product.hasVariants}
                  onChange={handleChange}
                  style={{ width: "18px", height: "18px", accentColor: "#0d9488" }}
                />
                Enable Product Variants
              </label>
            </div>

            {product.hasVariants && (
              <div className={styles.cardBody}>
                {/* Quick Color Generator Box */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    padding: "18px",
                    marginBottom: "20px",
                  }}
                >
                  <label style={{ fontWeight: "800", color: "#166534", marginBottom: "6px", display: "block" }}>
                    ⚡ Quick Color Variants Generator
                  </label>
                  <p style={{ fontSize: "13px", color: "#15803d", margin: "0 0 12px 0" }}>
                    Enter color names separated by commas to instantly generate variant rows with matched color swatches:
                  </p>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      value={quickColors}
                      onChange={(e) => setQuickColors(e.target.value)}
                      placeholder="Royal Blue, Emerald Green, Crimson Red, Charcoal Black"
                      style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #86efac", fontSize: "14px" }}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateQuickColorVariants}
                      style={{
                        padding: "10px 18px",
                        background: "#15803d",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FiZap size={15} /> Generate Variant Rows
                    </button>
                  </div>
                </div>

                {/* Variants Matrix Table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "10px", textAlign: "left" }}>Color Name</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>Swatch / Hex</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>Variant SKU</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>Barcode</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>Stock ({product.stockUnit})</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>Price (₹)</th>
                        <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
                        <th style={{ padding: "10px", textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr key={v.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px" }}>
                            <input
                              type="text"
                              value={v.color}
                              onChange={(e) => handleVariantChange(v.id, "color", e.target.value)}
                              placeholder="e.g. Royal Blue"
                              style={{ width: "100%", minWidth: "120px", padding: "6px", fontSize: "13px" }}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                type="color"
                                value={v.colorCode || "#1e40af"}
                                onChange={(e) => handleVariantChange(v.id, "colorCode", e.target.value)}
                                style={{ width: "32px", height: "32px", padding: "2px", borderRadius: "6px", cursor: "pointer", border: "1px solid #cbd5e1" }}
                              />
                              <input
                                type="text"
                                value={v.colorCode || "#1e40af"}
                                onChange={(e) => handleVariantChange(v.id, "colorCode", e.target.value)}
                                style={{ width: "80px", padding: "6px", fontSize: "12px" }}
                              />
                            </div>
                          </td>
                          <td style={{ padding: "8px" }}>
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => handleVariantChange(v.id, "sku", e.target.value)}
                              style={{ width: "100%", minWidth: "130px", padding: "6px", fontSize: "13px" }}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <input
                              type="text"
                              value={v.barcode}
                              onChange={(e) => handleVariantChange(v.id, "barcode", e.target.value)}
                              placeholder="Optional"
                              style={{ width: "100px", padding: "6px", fontSize: "13px" }}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => handleVariantChange(v.id, "stock", e.target.value)}
                              style={{ width: "80px", padding: "6px", fontSize: "13px" }}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <input
                              type="number"
                              value={v.sellingPrice}
                              onChange={(e) => handleVariantChange(v.id, "sellingPrice", e.target.value)}
                              style={{ width: "80px", padding: "6px", fontSize: "13px" }}
                            />
                          </td>
                          <td style={{ padding: "8px" }}>
                            <select
                              value={v.status || "ACTIVE"}
                              onChange={(e) => handleVariantChange(v.id, "status", e.target.value)}
                              style={{ padding: "6px", fontSize: "12px" }}
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                            </select>
                          </td>
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "4px", padding: "6px", cursor: "pointer" }}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleAddVariant}
                  style={{
                    marginTop: "14px",
                    padding: "8px 14px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FiPlus size={15} /> Add Custom Variant Row
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.sideColumn}>
          {/* Swatch Upload Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.textileIconBox}>
                  <FiUpload />
                </div>
                <h2>Fabric Swatch Photo</h2>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div
                className={styles.imageUploadBox}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className={styles.previewContainer}>
                    <img src={imagePreview} alt="Preview" className={styles.previewImg} />
                    <button
                      type="button"
                      className={styles.removeImgBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <FiUpload className={styles.uploadIcon} style={{ color: "#0d9488" }} />
                    <span style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>Upload Fabric Swatch</span>
                    <small>Supports PNG, JPG up to 5MB</small>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Textile Guidance Card */}
          <div className={styles.card} style={{ background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)" }}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <FiCheckCircle style={{ color: "#0d9488", fontSize: "20px" }} />
                <h2>Textile ERP Guidance</h2>
              </div>
            </div>
            <div className={styles.cardBody} style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 12px 0" }}>
                <strong>Product vs Variants:</strong> Register base fabric composition (e.g. <em>100% Cotton Poplin</em>) and manage color ways under Product Variants.
              </p>
              <p style={{ margin: "0 0 12px 0" }}>
                <strong>Dynamic Unit Pricing:</strong> Pricing applies per selected stock unit ({product.stockUnit}), ensuring consistency across Meters, Yards, Rolls, or KG.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Opening Inventory:</strong> Registering initial stock creates warehouse inventory and an opening stock movement record.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* QUICK ADD CATEGORY MODAL */}
      {showCategoryModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#ccfbf1",
                    color: "#0f766e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiLayers size={18} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Add New Textile Category
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ padding: "20px 22px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Category Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Cotton Fabrics, Silk Blends, Denim"
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Description (Optional)
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category details, fabric classifications..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Status
                </label>
                <select
                  value={categoryFormData.status}
                  onChange={(e) => setCategoryFormData((prev) => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  style={{
                    padding: "9px 16px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  style={{
                    padding: "9px 18px",
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {savingCategory ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD BRAND / MILL MODAL */}
      {showBrandModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setShowBrandModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#ccfbf1",
                    color: "#0f766e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiPackage size={18} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  Add New Brand / Mill
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} style={{ padding: "20px 22px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Brand / Mill Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={brandFormData.name}
                    onChange={(e) => setBrandFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Vardhman Textiles, Kaveri Ginning Mills"
                    required
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Type
                  </label>
                  <select
                    value={brandFormData.type}
                    onChange={(e) => setBrandFormData((prev) => ({ ...prev, type: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="Textile Mill">Textile Mill</option>
                    <option value="Brand">Brand</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Status
                  </label>
                  <select
                    value={brandFormData.status}
                    onChange={(e) => setBrandFormData((prev) => ({ ...prev, status: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={brandFormData.location}
                  onChange={(e) => setBrandFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Surat, Gujarat / Coimbatore, Tamil Nadu"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "22px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Contact Person (Optional)
                  </label>
                  <input
                    type="text"
                    value={brandFormData.contactPerson}
                    onChange={(e) => setBrandFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="e.g. Rajesh Mill Manager"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={brandFormData.phone}
                    onChange={(e) => setBrandFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. +91 9876543210"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  style={{
                    padding: "9px 16px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBrand}
                  style={{
                    padding: "9px 18px",
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {savingBrand ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
