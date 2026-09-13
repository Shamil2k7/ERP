import Swal from "sweetalert2";

/**
 * Centralized SweetAlert2 Utility Helper for ERP System
 */

export const showSuccess = (title = "Success!", text = "") => {
  return Swal.fire({
    icon: "success",
    title,
    text: typeof text === "string" ? text : "",
    confirmButtonColor: "#10b981",
    timer: 2500,
    timerProgressBar: true,
  });
};

export const showError = (title = "Error", text = "") => {
  return Swal.fire({
    icon: "error",
    title,
    text: typeof text === "string" ? text : String(text || ""),
    confirmButtonColor: "#ef4444",
  });
};

export const showWarning = (title = "Warning", text = "") => {
  return Swal.fire({
    icon: "warning",
    title,
    text: typeof text === "string" ? text : "",
    confirmButtonColor: "#f59e0b",
  });
};

export const showInfo = (title = "Information", text = "") => {
  return Swal.fire({
    icon: "info",
    title,
    text: typeof text === "string" ? text : "",
    confirmButtonColor: "#2563eb",
  });
};

export const showConfirm = async ({
  title = "Are you sure?",
  text = "",
  confirmButtonText = "Yes, proceed",
  cancelButtonText = "Cancel",
  icon = "question",
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    confirmButtonText,
    cancelButtonText,
  });
  return result.isConfirmed;
};

export const showDeleteConfirm = async (itemName = "this item") => {
  const result = await Swal.fire({
    title: `Delete ${itemName}?`,
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
  });
  return result.isConfirmed;
};

export const showLoading = (title = "Please wait...", text = "") => {
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const closeLoading = () => {
  Swal.close();
};

export const showToastNotification = (title, text = "", icon = "info") => {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    text,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
};

export default Swal;
