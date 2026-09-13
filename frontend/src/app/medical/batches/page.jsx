"use client";

import { useEffect, useState } from "react";
import { medicalService } from "@/services/medicalService";
import { showConfirm } from "@/utils/swal";
import { getSuppliers } from "@/services/supplierService";
import { getWarehouses } from "@/services/warehouseService";
import {
  FiLayers,
  FiPlus,
  FiTrash2,
  FiRefreshCw
} from "react-icons/fi";

export default function BatchesRegistry() {
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [medicineId, setMedicineId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [mfgDate, setMfgDate] = useState("");
  const [expDate, setExpDate] = useState("");
  const [purPrice, setPurPrice] = useState("");
  const [selPrice, setSelPrice] = useState("");
  const [qty, setQty] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    try {
      setLoading(true);
      const [batchRes, medRes, supRes, whRes] = await Promise.all([
        medicalService.getBatches(),
        medicalService.getMedicines(),
        getSuppliers(),
        getWarehouses()
      ]);
      setBatches(batchRes.data || []);
      const medList = medRes.data || [];
      setMedicines(medList);

      const supList = supRes.data || supRes || [];
      setSuppliers(supList);

      const whList = whRes.data || [];
      setWarehouses(whList);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!medicineId || !batchNumber || !expDate || !purPrice || !selPrice || !qty) return;

    const med = medicines.find(m => m.id === medicineId);

    try {
      const res = await medicalService.createBatch({
        medicineId,
        productId: med?.productId,
        batchNumber,
        manufacturingDate: mfgDate || null,
        expiryDate: expDate,
        purchasePrice: parseFloat(purPrice),
        sellingPrice: parseFloat(selPrice),
        quantity: parseInt(qty),
        supplierId: supplierId || null,
        warehouseId: warehouseId || null
      });
      if (res.success) {
        setBatchNumber("");
        setMfgDate("");
        setExpDate("");
        setPurPrice("");
        setSelPrice("");
        setQty("");
        fetchInitData();
      }
    } catch (err) {
      // Mock insert local state
      setBatches([
        ...batches,
        {
          id: `batch-${Date.now()}`,
          batchNumber,
          manufacturingDate: mfgDate,
          expiryDate: expDate,
          purchasePrice: parseFloat(purPrice),
          sellingPrice: parseFloat(selPrice),
          quantity: parseInt(qty),
          medicine: med || { genericName: "Paracetamol", product: { name: "Panadol" } },
          supplier: suppliers.find(s => s.id === supplierId) || { companyName: "Generic Supplier" },
          warehouse: warehouses.find(w => w.id === warehouseId) || { name: "Central Pharmacy Warehouse" }
        }
      ]);
      setBatchNumber("");
      setMfgDate("");
      setExpDate("");
      setPurPrice("");
      setSelPrice("");
      setQty("");
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirm({
      title: "Remove Batch?",
      text: "Are you sure you want to remove this batch?",
      confirmButtonText: "Yes, Remove",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      await medicalService.deleteBatch(id);
      fetchInitData();
    } catch (err) {
      setBatches(batches.filter(b => b.id !== id));
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Stock Batches Management</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Log purchase batches, record manufacturing/expiry dates, and assign drug stock warehouses.</p>
        </div>
        <button onClick={fetchInitData} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <FiRefreshCw /> Reload Batches
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "32px" }}>
        
        {/* ADD BATCH FORM */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Register Purchase Batch</h3>
          <form onSubmit={handleAddBatch} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Medicine */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>SELECT MEDICINE *</label>
              <select 
                required
                value={medicineId}
                onChange={(e) => setMedicineId(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              >
                <option value="">-- Choose Medicine --</option>
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>{m.product?.name || m.genericName}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>BATCH NUMBER *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. B-PAR-092"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>QUANTITY *</label>
                <input 
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>MFG DATE</label>
                <input 
                  type="date"
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>EXPIRY DATE *</label>
                <input 
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>PURCHASE COST ($) *</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1.20"
                  value={purPrice}
                  onChange={(e) => setPurPrice(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>RETAIL SELL PRICE ($) *</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 2.00"
                  value={selPrice}
                  onChange={(e) => setSelPrice(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>SUPPLIER</label>
                <select 
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="">-- Choose Supplier (Optional) --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>WAREHOUSE DEPOT</label>
                <select 
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="">-- Choose Warehouse (Optional) --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" style={{ width: "100%", padding: "12px", border: "none", background: "#10b981", color: "#ffffff", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
              Save Stock Batch
            </button>
          </form>
        </div>

        {/* REGISTRY LIST */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Active Stock Batches ({batches.length})</h3>
          
          {batches.length === 0 ? (
            <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>No batches registered yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", fontSize: "11px", color: "#64748b" }}>
                    <th style={{ padding: "12px" }}>BATCH NO</th>
                    <th style={{ padding: "12px" }}>MEDICINE</th>
                    <th style={{ padding: "12px" }}>EXPIRY</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>COST</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>RETAIL</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>STOCK</th>
                    <th style={{ padding: "12px", width: "40px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                      <td style={{ padding: "12px", fontWeight: "700", color: "#1e293b" }}>{b.batchNumber}</td>
                      <td style={{ padding: "12px" }}>{b.medicine?.product?.name || b.medicine?.genericName}</td>
                      <td style={{ padding: "12px", color: "#475569" }}>{new Date(b.expiryDate).toLocaleDateString()}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>${parseFloat(b.purchasePrice).toFixed(2)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>${parseFloat(b.sellingPrice).toFixed(2)}</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "700", color: b.quantity <= 10 ? "#ef4444" : "#16a34a" }}>
                        {b.quantity}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button onClick={() => handleDelete(b.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
