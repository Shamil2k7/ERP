"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { medicalService } from "@/services/medicalService";
import apiClient from "@/services/apiClient";
import toast, { Toaster } from "react-hot-toast";
import { 
  FiArrowLeft, 
  FiActivity, 
  FiTag, 
  FiDollarSign, 
  FiInfo, 
  FiLayers, 
  FiFileText, 
  FiPercent, 
  FiTruck,
  FiFilePlus
} from "react-icons/fi";

const DOSAGE_FORMS = ["TABLET", "CAPSULE", "SYRUP", "INJECTION", "CREAM", "OINTMENT", "DROPS", "INHALER", "POWDER", "OTHER"];

export default function AddMedicinePage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Product Fields
  const [tradeName, setTradeName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [description, setDescription] = useState("");

  // Medicine Specific Fields
  const [genericName, setGenericName] = useState("");
  const [strength, setStrength] = useState("");
  const [dosageForm, setDosageForm] = useState("TABLET");
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [manufacturer, setManufacturer] = useState("");

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const [catRes, unitRes] = await Promise.allSettled([
        apiClient.get("/categories"),
        apiClient.get("/units"),
      ]);

      if (catRes.status === "fulfilled") {
        const catList = catRes.value.data?.data || catRes.value.data || [];
        setCategories(Array.isArray(catList) ? catList : []);
        if (catList.length > 0) setCategoryId(catList[0].id);
      }
      if (unitRes.status === "fulfilled") {
        const unitList = unitRes.value.data?.data || unitRes.value.data || [];
        setUnits(Array.isArray(unitList) ? unitList : []);
        if (unitList.length > 0) setUnitId(unitList[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories or units setup options.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tradeName.trim()) {
      toast.error("Please enter the Drug Trade / Brand Name.");
      return;
    }
    if (!costPrice || parseFloat(costPrice) < 0) {
      toast.error("Please enter a valid Cost Price.");
      return;
    }
    if (!sellingPrice || parseFloat(sellingPrice) < 0) {
      toast.error("Please enter a valid Selling Price.");
      return;
    }
    if (!genericName.trim()) {
      toast.error("Please enter the Generic Formula Name.");
      return;
    }
    if (!strength.trim()) {
      toast.error("Please enter the drug strength.");
      return;
    }

    try {
      setSubmitting(true);
      
      // 1. Create Product
      const productPayload = {
        name: tradeName.trim(),
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        categoryId: categoryId || undefined,
        unitId: unitId || undefined,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        taxRate: taxRate ? parseFloat(taxRate) : 0,
        description: description.trim(),
        productType: "MEDICINE",
        status: "ACTIVE"
      };

      const prodRes = await apiClient.post("/products", productPayload);
      const createdProduct = prodRes.data?.data || prodRes.data;
      const createdProductId = createdProduct?.id;

      if (!createdProductId) {
        throw new Error("Product creation succeeded, but no Product ID was returned.");
      }

      // 2. Create Medicine profile linking to the newly created Product
      const medicinePayload = {
        productId: createdProductId,
        genericName: genericName.trim(),
        strength: strength.trim(),
        dosageForm,
        prescriptionRequired,
        manufacturer: manufacturer.trim() || undefined
      };

      const medRes = await medicalService.createMedicine(medicinePayload);
      if (medRes.success || medRes.data) {
        toast.success(`Medicine & Inventory Product registered successfully!`);
        setTimeout(() => {
          router.push("/medical/medicines");
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to register medicine", err);
      toast.error(err.response?.data?.message || err.message || "Failed to register medicine profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      
      {/* Back Button */}
      <div style={{ marginBottom: "24px" }}>
        <button 
          onClick={() => router.push("/medical/medicines")}
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px", 
            background: "none", 
            border: "none", 
            color: "#4f46e5", 
            fontWeight: "600", 
            cursor: "pointer",
            fontSize: "14px",
            padding: 0
          }}
        >
          <FiArrowLeft /> Back to Medicines Registry
        </button>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", background: "#ffffff", borderRadius: "16px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <div style={{ padding: "10px", borderRadius: "10px", background: "#f0fdf4", color: "#16a34a" }}>
            <FiActivity size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Register New Drug Profile</h1>
            <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>Input trade brand specs and drug composition to create both the medicine and its inventory items.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Loading configuration data...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* Split Form Columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
              
              {/* LEFT COLUMN: PRODUCT INVENTORY FIELDS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "700", color: "#1e293b", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiLayers style={{ color: "#3b82f6" }} /> 1. Inventory & Pricing Details
                </h3>

                {/* Drug Name / Trade Name */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>DRUG TRADE / BRAND NAME *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Panadol 500mg, Lipitor 10mg"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                {/* SKU and Barcode */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>SKU (PRODUCT CODE)</label>
                    <input 
                      type="text"
                      placeholder="Auto-generated if blank"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>BARCODE EAN</label>
                    <input 
                      type="text"
                      placeholder="e.g. 8901234567"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    />
                  </div>
                </div>

                {/* Category and Unit */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>PRODUCT CATEGORY *</label>
                    <select 
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "14px" }}
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>MEASUREMENT UNIT *</label>
                    <select 
                      value={unitId}
                      onChange={(e) => setUnitId(e.target.value)}
                      style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "14px" }}
                      required
                    >
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name || u.code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cost Price, Selling Price and Tax */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>COST PRICE ($) *</label>
                    <div style={{ position: "relative" }}>
                      <FiDollarSign style={{ position: "absolute", left: "10px", top: "14px", color: "#94a3b8" }} size={14} />
                      <input 
                        type="number"
                        step="0.01"
                        required
                        placeholder="Cost"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        style={{ width: "100%", padding: "11px 12px 11px 28px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>SELLING PRICE ($) *</label>
                    <div style={{ position: "relative" }}>
                      <FiDollarSign style={{ position: "absolute", left: "10px", top: "14px", color: "#94a3b8" }} size={14} />
                      <input 
                        type="number"
                        step="0.01"
                        required
                        placeholder="Retail"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        style={{ width: "100%", padding: "11px 12px 11px 28px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tax rate */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>GST / TAX RATE (%)</label>
                  <div style={{ position: "relative" }}>
                    <FiPercent style={{ position: "absolute", right: "12px", top: "14px", color: "#94a3b8" }} size={14} />
                    <input 
                      type="number"
                      placeholder="e.g. 18"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    />
                  </div>
                </div>

                {/* Product Description */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>DESCRIPTION</label>
                  <textarea 
                    placeholder="General description or storage requirements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", fontFamily: "inherit", resize: "none" }}
                  />
                </div>

              </div>

              {/* RIGHT COLUMN: CLINICAL DRUG SPECIFIC FIELDS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "700", color: "#1e293b", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiInfo style={{ color: "#10b981" }} /> 2. Clinical & Medical Specs
                </h3>

                {/* Generic Name */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>GENERIC FORMULA NAME *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Paracetamol, Ibuprofen, Atorvastatin"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                {/* Strength */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>STRENGTH *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 500mg, 10ml, 250mcg"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                {/* Dosage Form */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>DOSAGE FORM *</label>
                  <select 
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "14px" }}
                  >
                    {DOSAGE_FORMS.map(df => (
                      <option key={df} value={df}>{df}</option>
                    ))}
                  </select>
                </div>

                {/* Manufacturer */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>MANUFACTURER / DRUG LAB</label>
                  <div style={{ position: "relative" }}>
                    <FiTruck style={{ position: "absolute", left: "10px", top: "14px", color: "#94a3b8" }} size={14} />
                    <input 
                      type="text"
                      placeholder="e.g. Pfizer, GlaxoSmithKline, Novartis"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      style={{ width: "100%", padding: "11px 12px 11px 28px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    />
                  </div>
                </div>

                {/* Prescription Required RX Lock */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", background: "#fef2f2", padding: "14px", borderRadius: "10px", border: "1px solid #fee2e2" }}>
                  <input 
                    type="checkbox"
                    id="rx"
                    checked={prescriptionRequired}
                    onChange={(e) => setPrescriptionRequired(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <div style={{ cursor: "pointer" }}>
                    <label htmlFor="rx" style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#991b1b", cursor: "pointer" }}>
                      PRESCRIPTION REQUIRED (RX LOCK)
                    </label>
                    <span style={{ fontSize: "11px", color: "#ef4444" }}>Requires matching doctor prescription details on checkout checkouts.</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={submitting}
              style={{ 
                width: "100%", 
                padding: "16px", 
                border: "none", 
                background: submitting ? "#a7f3d0" : "#10b981", 
                color: "#ffffff", 
                borderRadius: "10px", 
                fontWeight: "700", 
                fontSize: "15px",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <FiFilePlus size={16} />
              {submitting ? "Registering Medicine..." : "Complete Drug Registration"}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
