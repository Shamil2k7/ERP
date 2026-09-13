"use client";

import { useEffect, useState } from "react";
import { getCustomers } from "@/services/customerService";
import { medicalService } from "@/services/medicalService";
import { getWarehouses } from "@/services/warehouseService";
import { showWarning, showConfirm, showError } from "@/utils/swal";
import {
  FiUsers,
  FiShoppingBag,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiPrinter,
  FiActivity,
  FiCheckCircle,
  FiFileText,
  FiAlertTriangle
} from "react-icons/fi";

export default function PharmacyPOS() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");

  // Cart
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Selector
  const [selectedMedId, setSelectedMedId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    fetchInitData();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerPrescriptions(selectedCustomerId);
    } else {
      setPrescriptions([]);
      setSelectedPrescriptionId("");
    }
  }, [selectedCustomerId]);

  const fetchInitData = async () => {
    try {
      setLoading(true);
      const [custRes, whRes, medRes] = await Promise.all([
        getCustomers(),
        getWarehouses(),
        medicalService.getMedicines()
      ]);
      setCustomers(custRes.data || custRes || []);
      
      const whList = whRes.data || [];
      setWarehouses(whList);
      if (whList.length > 0) {
        setSelectedWarehouseId(whList[0].id);
      }

      setMedicines(medRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerPrescriptions = async (customerId) => {
    try {
      const res = await medicalService.getPrescriptions({ customerId });
      setPrescriptions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyPrescription = () => {
    if (!selectedPrescriptionId) return;
    const presc = prescriptions.find(p => p.id === selectedPrescriptionId);
    if (!presc) return;

    const itemsToAdd = [];
    presc.items?.forEach(item => {
      const matchingMed = medicines.find(m => m.id === item.medicineId);
      if (matchingMed) {
        itemsToAdd.push({
          medicineId: matchingMed.id,
          name: matchingMed.product?.name || matchingMed.genericName,
          productId: matchingMed.productId,
          unitPrice: parseFloat(matchingMed.product?.sellingPrice || 10),
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          totalAmount: item.quantity * parseFloat(matchingMed.product?.sellingPrice || 10),
          prescriptionRequired: matchingMed.prescriptionRequired,
        });
      }
    });

    setCart(itemsToAdd);
  };

  const handleAddToCart = async () => {
    if (!selectedMedId) return;
    const med = medicines.find(m => m.id === selectedMedId);
    if (!med) return;

    // Check prescription condition
    if (med.prescriptionRequired && !selectedPrescriptionId) {
      const ok = await showConfirm({
        title: "Prescription Required",
        text: "Warning: This drug requires a doctor's prescription. Do you want to override and continue?",
        confirmButtonText: "Yes, Override",
        icon: "warning",
      });
      if (!ok) return;
    }

    const existingIndex = cart.findIndex(i => i.medicineId === selectedMedId);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += selectedQty;
      updated[existingIndex].totalAmount = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          medicineId: med.id,
          name: med.product?.name || med.genericName,
          productId: med.productId,
          unitPrice: parseFloat(med.product?.sellingPrice || 12),
          quantity: selectedQty,
          dosage: "1 tab",
          frequency: "Once daily",
          totalAmount: selectedQty * parseFloat(med.product?.sellingPrice || 12),
          prescriptionRequired: med.prescriptionRequired
        }
      ]);
    }
    setSelectedQty(1);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartQty = (index, delta) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty < 1) return;
    updated[index].quantity = newQty;
    updated[index].totalAmount = newQty * updated[index].unitPrice;
    setCart(updated);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.totalAmount, 0);
  const taxAmount = parseFloat(((subtotal - discountAmount) * 0.05).toFixed(2)); // 5% VAT
  const totalAmount = subtotal - discountAmount + taxAmount;

  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) return;
    try {
      // Perform FEFO batch stock deductions for each cart item
      for (const item of cart) {
        await medicalService.deductStockFEFO({
          productId: item.productId,
          quantity: item.quantity,
          warehouseId: selectedWarehouseId,
          referenceNo: `POS-${Date.now().toString().slice(-6)}`,
          remarks: `POS Pharmacy checkout: ${item.name}`
        });
      }
      setCheckoutSuccess(true);
      setCart([]);
      setDiscountAmount(0);
      setNotes("");
    } catch (err) {
      showError("Checkout Shortage", "Checkout failed (stock shortage): " + err.message);
    }
  };

  const currentCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* BUILD DISPENSE BASKET */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* CUSTOMER & CLINICAL PRESCRIPTION */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>1. Link Patient & Prescriptions</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: "16px", alignItems: "end" }}>
            
            {/* Customer select */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>PATIENT / CUSTOMER</label>
              <select 
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              >
                <option value="">-- Walk-in Patient --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            {/* Prescriptions select */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>ACTIVE DOCTOR PRESCRIPTIONS</label>
              <select 
                value={selectedPrescriptionId}
                disabled={!selectedCustomerId || prescriptions.length === 0}
                onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              >
                <option value="">-- No script selected --</option>
                {prescriptions.map(p => (
                  <option key={p.id} value={p.id}>{p.prescriptionNumber} (Dr. {p.doctorName})</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleApplyPrescription}
              disabled={!selectedPrescriptionId}
              style={{
                width: "100%",
                background: selectedPrescriptionId ? "#10b981" : "#e2e8f0",
                color: selectedPrescriptionId ? "#ffffff" : "#94a3b8",
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Load Script
            </button>

          </div>
        </div>

        {/* MEDICINE PICKER */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>2. Select Medicines</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "2fr 100px", gap: "16px", alignItems: "end", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>SEARCH DRUG DATABASE</label>
              <select 
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              >
                <option value="">-- Select drug --</option>
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.product?.name || m.genericName} {m.strength} [{m.dosageForm}] {m.prescriptionRequired ? "(Script Req.)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>QUANTITY</label>
              <input 
                type="number"
                min="1"
                value={selectedQty}
                onChange={(e) => setSelectedQty(parseInt(e.target.value) || 1)}
                style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}
              />
            </div>
          </div>

          <button 
            onClick={handleAddToCart}
            style={{ width: "100%", background: "#10b981", color: "#ffffff", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
          >
            Add Drug to Basket
          </button>
        </div>

        {/* BASKET DISPLAY */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", flexGrow: 1 }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0" }}>Dispensing Basket</h2>
          
          {cart.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              <FiShoppingBag size={32} style={{ marginBottom: "12px" }} />
              <p>Basket is empty. Choose medicines above or load doctor prescription.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {cart.map((item, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9", background: "#f8fafc" }}>
                  <div>
                    <span style={{ fontWeight: "700", color: "#1e293b" }}>{item.name}</span>
                    {item.prescriptionRequired && (
                      <span style={{ marginLeft: "8px", padding: "2px 6px", background: "#fff1f2", color: "#f43f5e", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                        SCRIPT REQUIRED
                      </span>
                    )}
                    <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Dosage: {item.dosage} | Frequency: {item.frequency}</span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "4px 8px" }}>
                      <button onClick={() => updateCartQty(index, -1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><FiMinus size={12} /></button>
                      <span style={{ fontWeight: "700", color: "#334155" }}>{item.quantity}</span>
                      <button onClick={() => updateCartQty(index, 1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><FiPlus size={12} /></button>
                    </div>
                    <span style={{ fontWeight: "800", color: "#0f172a", minWidth: "60px", textAlign: "right" }}>${item.totalAmount.toFixed(2)}</span>
                    <button onClick={() => removeFromCart(index)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><FiTrash2 /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SUMMARY PANEL */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 20px 0" }}>Bill Invoice Summary</h2>
          
          {/* Dispatch Warehouse */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>DISPENSE FROM WAREHOUSE</label>
            <select 
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px dashed #e2e8f0", paddingBottom: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: "700" }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#475569" }}>Discount ($):</span>
              <input 
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                style={{ width: "80px", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", textAlign: "right", fontWeight: "700" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
              <span>VAT / Tax (5%):</span>
              <span style={{ fontWeight: "700" }}>${taxAmount.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "24px" }}>
            <span>Total Payable:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={() => setShowInvoiceModal(true)}
            style={{
              width: "100%",
              background: cart.length > 0 ? "#10b981" : "#e2e8f0",
              color: "#ffffff",
              border: "none",
              padding: "14px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "16px",
              cursor: cart.length > 0 ? "pointer" : "not-allowed"
            }}
          >
            Confirm & Dispense Medicines
          </button>
        </div>

      </div>

      {/* CHECKOUT MODAL */}
      {showInvoiceModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "32px", maxWidth: "480px", width: "100%" }}>
            
            {!checkoutSuccess ? (
              <>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <FiActivity size={48} style={{ color: "#10b981", marginBottom: "16px" }} />
                  <h2>Validate Stock & Dispense</h2>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Confirming this order will release stocks from warehouse using <strong>FEFO (First Expiry First Out)</strong> batch deduction rules.</p>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => setShowInvoiceModal(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "none", cursor: "pointer", fontWeight: "600" }}>Cancel</button>
                  <button onClick={handleCheckoutSubmit} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#10b981", color: "#ffffff", cursor: "pointer", fontWeight: "700" }}>Dispense Drugs</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <FiCheckCircle size={48} style={{ color: "#10b981", marginBottom: "16px" }} />
                  <h2 style={{ color: "#10b981" }}>Checkout Successful!</h2>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Stocks deducted from first-expiring batches. Invoice printed.</p>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => window.print()} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "none", cursor: "pointer", fontWeight: "600" }}><FiPrinter /> Print Invoice</button>
                  <button 
                    onClick={() => {
                      setShowInvoiceModal(false);
                      setCheckoutSuccess(false);
                    }}
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#0f172a", color: "#ffffff", cursor: "pointer", fontWeight: "700" }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
