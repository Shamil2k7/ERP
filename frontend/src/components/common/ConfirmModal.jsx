"use client";

import React from "react";
import {
  FiAlertTriangle,
  FiTrash2,
  FiCheckCircle,
  FiHelpCircle,
  FiX,
} from "react-icons/fi";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // 'danger', 'warning', 'success', 'info'
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <FiTrash2 size={22} color="#dc2626" />;
      case "warning":
        return <FiAlertTriangle size={22} color="#d97706" />;
      case "success":
        return <FiCheckCircle size={22} color="#16a34a" />;
      case "info":
      default:
        return <FiHelpCircle size={22} color="#2563eb" />;
    }
  };

  const getIconBadgeStyle = () => {
    switch (type) {
      case "danger":
        return {
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
        };
      case "warning":
        return {
          backgroundColor: "#fffbeb",
          border: "1px solid #fde68a",
        };
      case "success":
        return {
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
        };
      case "info":
      default:
        return {
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
        };
    }
  };

  const getConfirmBtnStyle = () => {
    switch (type) {
      case "danger":
        return {
          backgroundColor: "#dc2626",
          boxShadow: "0 2px 8px rgba(220, 38, 38, 0.35)",
        };
      case "warning":
        return {
          backgroundColor: "#d97706",
          boxShadow: "0 2px 8px rgba(217, 119, 6, 0.35)",
        };
      case "success":
        return {
          backgroundColor: "#16a34a",
          boxShadow: "0 2px 8px rgba(22, 163, 74, 0.35)",
        };
      case "info":
      default:
        return {
          backgroundColor: "#2563eb",
          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
        };
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow:
            "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.9)",
          width: "100%",
          maxWidth: "480px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                minWidth: "44px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...getIconBadgeStyle(),
              }}
            >
              {getIcon()}
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "#0f172a",
                  lineHeight: "1.3",
                }}
              >
                {title}
              </h3>
              <span
                style={{
                  display: "block",
                  marginTop: "2px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#64748b",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                ERP Confirmation Required
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              padding: "8px",
              borderRadius: "8px",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div
          style={{
            padding: "24px",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#334155",
            backgroundColor: "#ffffff",
          }}
        >
          {message}
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            padding: "16px 24px",
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "10px 22px",
              borderRadius: "10px",
              border: "none",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
              minWidth: "120px",
              textAlign: "center",
              ...getConfirmBtnStyle(),
            }}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
