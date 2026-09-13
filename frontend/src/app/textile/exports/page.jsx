"use client";

import { useState, useEffect } from "react";
import {
  FiGlobe,
  FiPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiFileText,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiX,
  FiMapPin,
  FiAward,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

const INITIAL_EXPORTS = [
  {
    id: "EXP-2026-001",
    buyer: "Apex Global Garments Ltd",
    country: "United States (US)",
    portOfDischarge: "Port of Los Angeles (LAX)",
    fabricType: "100% Combed Cotton Poplin (40s)",
    quantityMeters: 45000,
    incoterm: "FOB Nhava Sheva (Mumbai)",
    currency: "USD",
    orderValue: 148500,
    lcNumber: "LC-CITI-NY-99210",
    blNumber: "BL-MAERSK-881920",
    shipmentDate: "2026-09-15",
    status: "CUSTOMS_CLEARED",
  },
  {
    id: "EXP-2026-002",
    buyer: "Nordic Fashion Exports A/S",
    country: "Denmark / European Union",
    portOfDischarge: "Port of Hamburg (Germany)",
    fabricType: "Denim Twill 12oz Indigo Blue",
    quantityMeters: 32000,
    incoterm: "CIF Hamburg",
    currency: "EUR",
    orderValue: 112000,
    lcNumber: "LC-BNP-PARIBAS-4019",
    blNumber: "BL-HAPAG-339102",
    shipmentDate: "2026-09-22",
    status: "UNDER_PRODUCTION",
  },
  {
    id: "EXP-2026-003",
    buyer: "SilkRoute Apparel LLC",
    country: "United Arab Emirates (UAE)",
    portOfDischarge: "Jebel Ali Port (Dubai)",
    fabricType: "Viscose Rayon Printed Chiffon",
    quantityMeters: 18500,
    incoterm: "FOB Tuticorin Port",
    currency: "USD",
    orderValue: 64750,
    lcNumber: "LC-EMIRATES-NBD-771",
    blNumber: "BL-MSC-449102",
    shipmentDate: "2026-08-30",
    status: "SHIPPED",
  },
  {
    id: "EXP-2026-004",
    buyer: "Pacific Textiles Trading Pty",
    country: "Australia (Sydney)",
    portOfDischarge: "Port Botany (Sydney)",
    fabricType: "Polyester Knitted Fleece (280 GSM)",
    quantityMeters: 25000,
    incoterm: "CFR Sydney",
    currency: "USD",
    orderValue: 87500,
    lcNumber: "LC-ANZ-MEL-1092",
    blNumber: "BL-ONE-LINE-55102",
    shipmentDate: "2026-08-10",
    status: "DELIVERED",
  },
];

export default function TextileExportManagementPage() {
  const [exports, setExports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    buyer: "",
    country: "",
    portOfDischarge: "",
    fabricType: "",
    quantityMeters: "",
    incoterm: "FOB",
    currency: "USD",
    orderValue: "",
    lcNumber: "",
    shipmentDate: "",
    status: "UNDER_PRODUCTION",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("textile_export_orders");
      if (stored) {
        setExports(JSON.parse(stored));
      } else {
        setExports(INITIAL_EXPORTS);
        localStorage.setItem("textile_export_orders", JSON.stringify(INITIAL_EXPORTS));
      }
    }
  }, []);

  const saveExports = (newExports) => {
    setExports(newExports);
    if (typeof window !== "undefined") {
      localStorage.setItem("textile_export_orders", JSON.stringify(newExports));
    }
  };

  const handleCreateExport = (e) => {
    e.preventDefault();
    if (!formData.buyer || !formData.country || !formData.orderValue) {
      toast.error("Please fill in required export details");
      return;
    }

    const newExp = {
      id: `EXP-2026-00${exports.length + 1}`,
      buyer: formData.buyer,
      country: formData.country,
      portOfDischarge: formData.portOfDischarge || "Designated Port",
      fabricType: formData.fabricType || "Mill Export Fabric",
      quantityMeters: Number(formData.quantityMeters || 10000),
      incoterm: formData.incoterm,
      currency: formData.currency,
      orderValue: Number(formData.orderValue),
      lcNumber: formData.lcNumber || `LC-STANDARD-${Math.floor(1000 + Math.random() * 9000)}`,
      blNumber: `BL-LINE-${Math.floor(100000 + Math.random() * 900000)}`,
      shipmentDate: formData.shipmentDate || "2026-09-30",
      status: formData.status,
    };

    saveExports([newExp, ...exports]);
    toast.success(`Export shipment ${newExp.id} booked successfully!`);
    setShowModal(false);
    setFormData({
      buyer: "",
      country: "",
      portOfDischarge: "",
      fabricType: "",
      quantityMeters: "",
      incoterm: "FOB",
      currency: "USD",
      orderValue: "",
      lcNumber: "",
      shipmentDate: "",
      status: "UNDER_PRODUCTION",
    });
  };

  const filtered = exports.filter((exp) => {
    const matchesStatus = statusFilter === "ALL" || exp.status === statusFilter;
    const matchesSearch =
      exp.buyer.toLowerCase().includes(search.toLowerCase()) ||
      exp.country.toLowerCase().includes(search.toLowerCase()) ||
      exp.id.toLowerCase().includes(search.toLowerCase()) ||
      exp.fabricType.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalValueUSD = exports.reduce((acc, e) => acc + (e.orderValue || 0), 0);
  const totalMeters = exports.reduce((acc, e) => acc + (e.quantityMeters || 0), 0);
  const activeShipments = exports.filter((e) => e.status === "SHIPPED" || e.status === "CUSTOMS_CLEARED").length;

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", maxWidth: "1400px", margin: "0 auto" }}>
      <Toaster position="top-right" />

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FiGlobe style={{ color: "#2563eb" }} /> Global Textile Export Management
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            International fabric export consignments, Letter of Credit (LC), Customs documentation, Incoterms & container tracking.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
          }}
        >
          <FiPlus size={16} /> New Export Consignment
        </button>
      </div>

      {/* TOP KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Export Revenue</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb", marginTop: "6px" }}>${totalValueUSD.toLocaleString()}</div>
          <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "600" }}>USD Value Invoiced</span>
        </div>

        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Total Export Volume</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "6px" }}>{totalMeters.toLocaleString()} <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>meters</span></div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Export Grade Fabrics</span>
        </div>

        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Active Sea Shipments</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0891b2", marginTop: "6px" }}>{activeShipments} Consignments</div>
          <span style={{ fontSize: "12px", color: "#0891b2", fontWeight: "600" }}>In-Transit / Customs</span>
        </div>

        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Export Destination Markets</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#7c3aed", marginTop: "6px" }}>USA, EU, UAE, AUS</div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>100% Compliance Verified</span>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px", overflowX: "auto" }}>
        {[
          { id: "ALL", label: "All Export Orders" },
          { id: "UNDER_PRODUCTION", label: "Under Production" },
          { id: "CUSTOMS_CLEARED", label: "Customs Cleared" },
          { id: "SHIPPED", label: "Shipped / In Transit" },
          { id: "DELIVERED", label: "Delivered to Destination" },
        ].map((btn) => {
          const isActive = statusFilter === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id)}
              style={{
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                borderBottom: isActive ? "3px solid #2563eb" : "3px solid transparent",
                color: isActive ? "#2563eb" : "#64748b",
                fontWeight: isActive ? "700" : "500",
                fontSize: "13px",
                cursor: "pointer",
                marginBottom: "-2px",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* SEARCH BAR */}
      <div
        style={{
          background: "#ffffff",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <FiSearch style={{ color: "#64748b" }} />
        <input
          type="text"
          placeholder="Search by Export ID, Buyer Name, Destination Country or Fabric..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            width: "100%",
            fontSize: "14px",
          }}
        />
      </div>

      {/* EXPORT ORDERS TABLE */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>
              <tr>
                <th style={{ padding: "14px 18px" }}>Consignment Ref</th>
                <th style={{ padding: "14px 18px" }}>Buyer / Importer</th>
                <th style={{ padding: "14px 18px" }}>Destination Market</th>
                <th style={{ padding: "14px 18px" }}>Fabric Details</th>
                <th style={{ padding: "14px 18px" }}>Quantity</th>
                <th style={{ padding: "14px 18px" }}>Incoterms & Value</th>
                <th style={{ padding: "14px 18px" }}>LC / BL Docs</th>
                <th style={{ padding: "14px 18px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 18px", fontWeight: "700", color: "#2563eb" }}>
                    {e.id}
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "400" }}>ETD: {e.shipmentDate}</div>
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: "600", color: "#1e293b" }}>{e.buyer}</td>
                  <td style={{ padding: "14px 18px", color: "#475569" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <FiMapPin size={13} style={{ color: "#ef4444" }} />
                      <strong>{e.country}</strong>
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>{e.portOfDischarge}</div>
                  </td>
                  <td style={{ padding: "14px 18px", color: "#475569" }}>{e.fabricType}</td>
                  <td style={{ padding: "14px 18px", fontWeight: "700", color: "#0f172a" }}>
                    {e.quantityMeters.toLocaleString()} m
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <strong style={{ color: "#059669", fontSize: "14px" }}>${e.orderValue.toLocaleString()} {e.currency}</strong>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{e.incoterm}</div>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: "12px" }}>
                    <div style={{ color: "#0284c7", fontWeight: "600" }}>{e.lcNumber}</div>
                    <div style={{ color: "#64748b" }}>{e.blNumber}</div>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background:
                          e.status === "DELIVERED"
                            ? "#d1fae5"
                            : e.status === "SHIPPED"
                            ? "#cffafe"
                            : e.status === "CUSTOMS_CLEARED"
                            ? "#e0e7ff"
                            : "#fef3c7",
                        color:
                          e.status === "DELIVERED"
                            ? "#047857"
                            : e.status === "SHIPPED"
                            ? "#0891b2"
                            : e.status === "CUSTOMS_CLEARED"
                            ? "#4338ca"
                            : "#b45309",
                      }}
                    >
                      {e.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NEW EXPORT ORDER */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Book New Export Consignment</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleCreateExport}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Foreign Buyer / Client *</label>
                <input type="text" required placeholder="e.g., European Apparel Holdings BV" value={formData.buyer} onChange={(e) => setFormData({ ...formData, buyer: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Destination Country *</label>
                  <input type="text" required placeholder="e.g., Germany / EU" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Port of Discharge</label>
                  <input type="text" placeholder="e.g., Port of Hamburg" value={formData.portOfDischarge} onChange={(e) => setFormData({ ...formData, portOfDischarge: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px" }} />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Fabric Specification</label>
                <input type="text" placeholder="e.g., 100% Combed Cotton Poplin (40s)" value={formData.fabricType} onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Volume (Meters)</label>
                  <input type="number" placeholder="25000" value={formData.quantityMeters} onChange={(e) => setFormData({ ...formData, quantityMeters: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Order Value (USD) *</label>
                  <input type="number" required placeholder="85000" value={formData.orderValue} onChange={(e) => setFormData({ ...formData, orderValue: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Incoterm</label>
                  <select value={formData.incoterm} onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
                    <option value="FOB Nhava Sheva">FOB Nhava Sheva (Mumbai)</option>
                    <option value="CIF Hamburg">CIF Hamburg</option>
                    <option value="CFR Los Angeles">CFR Los Angeles</option>
                    <option value="EXW Mill Factory">EXW Mill Factory</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Shipment ETD Date</label>
                  <input type="date" value={formData.shipmentDate} onChange={(e) => setFormData({ ...formData, shipmentDate: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 16px", border: "1px solid #cbd5e1", background: "#f8fafc", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Book Consignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
