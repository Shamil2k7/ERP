"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
} from "react-icons/fi";
import ConfirmModal from "@/components/common/ConfirmModal";

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "danger",
    onConfirm: null,
  });

  const [confirmLoading, setConfirmLoading] = useState(false);

  /* =========================================================
     1. SUCCESS TOAST
  ========================================================= */
  const showSuccess = useCallback((title, description = "") => {
    toast.custom((t) => (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          border: "1px solid #bbf7d0",
          borderRadius: "14px",
          padding: "14px 16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? "translateY(0)" : "translateY(-10px)",
          transition: "all 0.2s ease-in-out",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            minWidth: "34px",
            borderRadius: "10px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "1px",
          }}
        >
          <FiCheckCircle size={18} />
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
            {title}
          </h4>
          {description && (
            <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#475569", lineHeight: "1.5" }}>
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "14px",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: "6px",
          }}
        >
          ✕
        </button>
      </div>
    ), { duration: 4000 });
  }, []);

  /* =========================================================
     2. WARNING TOAST
  ========================================================= */
  const showWarning = useCallback((title, description = "") => {
    toast.custom((t) => (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          border: "1px solid #fde68a",
          borderRadius: "14px",
          padding: "14px 16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? "translateY(0)" : "translateY(-10px)",
          transition: "all 0.2s ease-in-out",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            minWidth: "34px",
            borderRadius: "10px",
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#d97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "1px",
          }}
        >
          <FiAlertTriangle size={18} />
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
            {title}
          </h4>
          {description && (
            <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#475569", lineHeight: "1.5" }}>
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "14px",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: "6px",
          }}
        >
          ✕
        </button>
      </div>
    ), { duration: 4500 });
  }, []);

  /* =========================================================
     3. ERROR TOAST
  ========================================================= */
  const showError = useCallback((title, description = "") => {
    toast.custom((t) => (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          border: "1px solid #fecaca",
          borderRadius: "14px",
          padding: "14px 16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? "translateY(0)" : "translateY(-10px)",
          transition: "all 0.2s ease-in-out",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            minWidth: "34px",
            borderRadius: "10px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "1px",
          }}
        >
          <FiXCircle size={18} />
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
            {title}
          </h4>
          {description && (
            <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#475569", lineHeight: "1.5" }}>
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "14px",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: "6px",
          }}
        >
          ✕
        </button>
      </div>
    ), { duration: 5000 });
  }, []);

  /* =========================================================
     4. CONFIRMATION MODAL DIALOG
  ========================================================= */
  const showConfirm = useCallback(
    ({
      title = "Confirm Action",
      message = "Are you sure you want to proceed?",
      confirmText = "Confirm",
      cancelText = "Cancel",
      type = "danger",
      onConfirm,
    }) => {
      setConfirmConfig({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm,
      });
    },
    []
  );

  const handleModalConfirm = async () => {
    if (confirmConfig.onConfirm) {
      try {
        setConfirmLoading(true);
        await confirmConfig.onConfirm();
      } catch (err) {
        console.error("Confirmation action error:", err);
      } finally {
        setConfirmLoading(false);
      }
    }
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleModalCancel = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AlertContext.Provider
      value={{
        showSuccess,
        showWarning,
        showError,
        showConfirm,
      }}
    >
      {children}
      <Toaster position="top-right" reverseOrder={false} />
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        loading={confirmLoading}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
