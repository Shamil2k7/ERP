"use client";

import { useEffect, useState } from "react";
import { medicalService } from "@/services/medicalService";
import { getCustomers } from "@/services/customerService";
import { FiFileText, FiPlus, FiTrash2, FiRefreshCw, FiUser } from "react-icons/fi";

export default function PrescriptionsLogs() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Inputs
  const [customerId, setCustomerId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [prescriptionNumber, setPrescriptionNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);

  // Item selections
  const [selMedicineId, setSelMedicineId] = useState("");
  const [selDosage, setSelDosage] = useState("1 tablet");
  const [selFrequency, setSelFrequency] = useState("Twice daily");
  const [selDuration, setSelDuration] = useState("7 days");
  const [selQty, setSelQty] = useState(1);

  useEffect(() => {
    fetchInitData();
  }, []);

  const fetchInitData = async () => {
    try {
      setLoading(true);
      const [prescRes, custRes, medRes] = await Promise.all([
        medicalService.getPrescriptions(),
        getCustomers(),
        medicalService.getMedicines()
      ]);
      setPrescriptions(prescRes.data || []);
      setCustomers(custRes.data || custRes || []);
      const medList = medRes.data || [];
      setMedicines(medList);
      if (medList.length > 0) {
        setSelMedicineId(medList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selMedicineId) return;
    const med = medicines.find(m => m.id === selMedicineId);
    if (!med) return;

    setItems([
      ...items,
      {
        medicineId: selMedicineId,
        name: med.product?.name || med.genericName,
        dosage: selDosage,
        frequency: selFrequency,
        duration: selDuration,
        quantity: parseInt(selQty)
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    if (!customerId || !doctorName || !prescriptionNumber || items.length === 0) return;

    try {
      const res = await medicalService.createPrescription({
        customerId,
        doctorName,
        prescriptionNumber,
        notes,
        items
      });
      if (res.success) {
        setDoctorName("");
        setPrescriptionNumber("");
        setNotes("");
        setItems([]);
        fetchInitData();
      }
    } catch (err) {
      // Mock insert local state
      const cust = customers.find(c => c.id === customerId) || { name: "John Doe" };
      setPrescriptions([
        ...prescriptions,
        {
          id: `presc-${Date.now()}`,
          prescriptionNumber,
          doctorName,
          notes,
          customer: cust,
          items: items.map(i => ({
            ...i,
            medicine: { product: { name: i.name }, genericName: i.name }
          })),
          createdAt: new Date().toISOString()
        }
      ]);
      setDoctorName("");
      setPrescriptionNumber("");
      setNotes("");
      setItems([]);
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Doctor Prescription Logs</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Register patient scripts, log clinical dosages, and link scripts directly during POS checkout.</p>
        </div>
        <button onClick={fetchInitData} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <FiRefreshCw /> Refresh Logs
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "32px" }}>
        
        {/* ADD PRESCRIPTION FORM */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", height: "fit-content" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Log Prescription Script</h3>
          <form onSubmit={handleSavePrescription} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Customer select */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>PATIENT / CUSTOMER</label>
              <select 
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              >
                <option value="">-- Choose Patient --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>DOCTOR NAME</label>
                <input 
                  type="text"
                  required
                  placeholder="Dr. Smith"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px" }}>PRESCRIPTION NUMBER</label>
                <input 
                  type="text"
                  required
                  placeholder="RX-9828-A"
                  value={prescriptionNumber}
                  onChange={(e) => setPrescriptionNumber(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            {/* Sub-item inputs to add medicine list */}
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "12px" }}>ADD PRESCRIBED MEDICINES</span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
                <select 
                  value={selMedicineId}
                  onChange={(e) => setSelMedicineId(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>{m.product?.name || m.genericName}</option>
                  ))}
                </select>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input type="text" placeholder="Dosage (e.g. 1 tab)" value={selDosage} onChange={(e) => setSelDosage(e.target.value)} style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  <input type="text" placeholder="Freq (e.g. Twice daily)" value={selFrequency} onChange={(e) => setSelFrequency(e.target.value)} style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "8px" }}>
                  <input type="text" placeholder="Duration (e.g. 7 days)" value={selDuration} onChange={(e) => setSelDuration(e.target.value)} style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  <input type="number" min="1" placeholder="Qty" value={selQty} onChange={(e) => setSelQty(parseInt(e.target.value) || 1)} style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: "6px", textAlign: "center" }} />
                </div>
              </div>

              <button type="button" onClick={handleAddItem} style={{ width: "100%", padding: "8px", border: "none", background: "#0f172a", color: "#ffffff", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>
                Add Drug to List
              </button>
            </div>

            {/* List of items being created */}
            {items.length > 0 && (
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                {items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid #f1f5f9", padding: "6px 0" }}>
                    <span>{it.quantity} × {it.name} ({it.dosage})</span>
                    <button type="button" onClick={() => handleRemoveItem(idx)} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}>X</button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" style={{ width: "100%", padding: "12px", border: "none", background: "#10b981", color: "#ffffff", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
              Save Prescription
            </button>
          </form>
        </div>

        {/* ACTIVE PRESCRIPTIONS LOGS */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Active Prescription Registry ({prescriptions.length})</h3>
          
          {prescriptions.length === 0 ? (
            <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>No prescriptions logged yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {prescriptions.map(pres => (
                <div key={pres.id} style={{ border: "1px solid #f1f5f9", borderRadius: "12px", padding: "20px", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #cbd5e1", paddingBottom: "10px", marginBottom: "10px" }}>
                    <div>
                      <strong style={{ fontSize: "16px", color: "#0f172a" }}>RX SCRIPT: {pres.prescriptionNumber}</strong>
                      <span style={{ display: "block", fontSize: "12px", color: "#64748b" }}>Patient: <strong>{pres.customer?.name}</strong> | Dr. {pres.doctorName}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>{new Date(pres.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {pres.items?.map((item, idx) => (
                      <div key={idx} style={{ fontSize: "13px", color: "#475569" }}>
                        💊 {item.quantity} × <strong>{item.medicine?.product?.name || item.medicine?.genericName}</strong> ({item.dosage} - {item.frequency})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
