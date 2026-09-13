"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, User, Loader2 } from "lucide-react";
import apiClient from "@/services/apiClient";
import { toast, Toaster } from "react-hot-toast";
import styles from "./addEmployees.module.css";
import { getRoles } from "@/services/roleService";
import { getBranches } from "@/services/branchService";
import { restaurantService } from "@/services/restaurantService";
import { createTextileEmployee } from "@/services/textileEmployeeService";
import { useCompany } from "@/context/CompanyContext";
import { RETAIL_ROLE_ACCESS, normalizeRetailRole } from "@/config/retailRoles";
import { TEXTILE_ROLE_ACCESS, normalizeTextileRole } from "@/config/textileRoles";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";


export default function AddEmployeePage() {
  const router = useRouter();
  const { user, company, industryCode, isRestaurant, isRetail, isLaundry, isGym, isTextile, isMedical } = useCompany();

  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    employeeId: "",
    role: "",
    branchId: "",
    password: "",
  });

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unitName: "",
    unitCode: "",
    unitType: "Weaving",
    location: "",
    status: "Active",
  });
  const [savingUnit, setSavingUnit] = useState(false);

  const [selectedModules, setSelectedModules] = useState([]);

  const availableModules = useMemo(() => {
    const isTex = Boolean(industryCode?.includes("TEXTILE"));
    const isGymMode = Boolean(industryCode?.includes("GYM"));
    const isRest = Boolean(industryCode?.includes("RESTAURANT"));
    const isLnd = Boolean(industryCode?.includes("LAUNDRY"));

    if (isLnd) {
      return [
        { code: "DASHBOARD", name: "Laundry Dashboard", description: "Washing operations summary & charts" },
        { code: "LAUNDRY", name: "Laundry POS & Operations", description: "Garment tracking, active orders & queue" },
        { code: "BRANCHES", name: "Outlets & Branches", description: "Laundry outlets & branch locations" },
        { code: "SERVICES", name: "Services & Categories", description: "Washing & dry cleaning catalog" },
        { code: "CUSTOMERS", name: "Customers", description: "Client profiles & phone directory" },
        { code: "EMPLOYEES", name: "Employees & Staff", description: "Washer, presser & driver team" },
        { code: "REPORTS", name: "Laundry Reports", description: "Revenue & garment delivery analytics" },
      ];
    } else if (isGymMode) {
      return [
        { code: "DASHBOARD", name: "Dashboard", description: "Business statistics & charts" },
        { code: "MEMBERS", name: "Members", description: "Manage gym member accounts" },
        { code: "MEMBERSHIP_PLANS", name: "Membership Plans", description: "Configure membership packages" },
        { code: "TRAINERS", name: "Trainers", description: "Gym instructors & schedules" },
        { code: "ATTENDANCE", name: "Attendance", description: "Daily gym check-ins logs" },
        { code: "PAYMENTS", name: "Payments", description: "Financial receipts & invoices" },
        { code: "EMPLOYEES", name: "Employees", description: "Manage staff & team permissions" },
        { code: "SUPPLIERS", name: "Suppliers", description: "Vendor catalog & logistics" },
        { code: "REPORTS", name: "Reports & Analytics", description: "Visual operations summaries" },
      ];
    } else if (isTex) {
      return [
        { code: "DASHBOARD", name: "Dashboard", description: "Industrial performance summary" },
        { code: "PRODUCTS", name: "Products Setup", description: "Manage product listings" },
        { code: "CATEGORIES", name: "Product Categories", description: "Configure category filters" },
        { code: "BRANDS", name: "Product Brands", description: "Configure product brand tags" },
        { code: "UNITS", name: "Units of Measure", description: "Configure units of measure (UoM)" },
        { code: "RAW_MATERIALS", name: "Raw Materials", description: "Weaving yarn & mill supplies" },
        { code: "PRODUCTION", name: "Production Run", description: "Textile manufacturing tracking" },
        { code: "INVENTORY", name: "Inventory", description: "Raw & finished product stocks" },
        { code: "WAREHOUSE", name: "Warehouse", description: "Storage mills & stock depots" },
        { code: "QUALITY_CONTROL", name: "Quality Control", description: "Fabric inspection sheets" },
        { code: "SUPPLIERS", name: "Suppliers", description: "Supplier records & bulk orders" },
        { code: "SALES", name: "Sales Orders", description: "Client sales & invoices" },
        { code: "PAYMENTS", name: "Payments", description: "Transactional records ledger" },
        { code: "EMPLOYEES", name: "Employees", description: "Manage workers & mill supervisors" },
        { code: "REPORTS", name: "Industrial Reports", description: "Factory output summaries" },
      ];
    } else if (isRest) {
      return [
        { code: "DASHBOARD", name: "Restaurant Dashboard", description: "Food sales charts & analytics" },
        { code: "RESTAURANT", name: "Restaurant POS & Floor", description: "POS terminal, KOT, tables & costing" },
        { code: "PRODUCTS", name: "Menu & Ingredients", description: "Manage raw ingredients & recipes" },
        { code: "CATEGORIES", name: "Menu Categories", description: "Configure menu categories" },
        { code: "BRANDS", name: "Ingredient Brands", description: "Configure ingredient brands" },
        { code: "UNITS", name: "Units of Measure", description: "Configure recipe units of measure" },
        { code: "INVENTORY", name: "Kitchen Inventory", description: "Stock control of kitchen supplies" },
        { code: "WAREHOUSE", name: "Outlets / Storage", description: "Store storage rooms & pantries" },
        { code: "SUPPLIERS", name: "Suppliers", description: "Vendor details for food orders" },
        { code: "EMPLOYEES", name: "Staff Management", description: "Waiters, kitchen & cashier accounts" },
        { code: "REPORTS", name: "Reports & Analytics", description: "Restaurant operations overview" },
      ];
    } else {
      const list = [
        { code: "DASHBOARD", name: "Dashboard", description: "Live metrics & charts" },
        { code: "PRODUCTS", name: "Products Setup", description: "Manage product listings" },
        { code: "CATEGORIES", name: "Product Categories", description: "Configure category filters" },
        { code: "BRANDS", name: "Product Brands", description: "Configure product brand tags" },
        { code: "UNITS", name: "Units of Measure", description: "Configure units of measure (UoM)" },
        { code: "INVENTORY", name: "Inventory", description: "Current stock catalogs" },
        { code: "WAREHOUSE", name: "Warehouse", description: "Store depots & physical logs" },
        { code: "STOCK_TRANSFER", name: "Stock Transfer", description: "Inter-branch product transfers" },
        { code: "CUSTOMERS", name: "Customers", description: "Client database & profiles" },
        { code: "SUPPLIERS", name: "Suppliers", description: "Vendor details & catalog" },
        { code: "PURCHASES", name: "Purchases", description: "Supplier purchase logs" },
        { code: "SALES", name: "Sales Orders", description: "Store sales & invoices" },
        { code: "REPORTS", name: "Reports & Analytics", description: "Operations summaries" },
        { code: "INVOICES", name: "Invoices", description: "Generate receipt documents" },
        { code: "EMPLOYEES", name: "Employees / Team", description: "Manage branch staff accounts" },
      ];
      return list;
    }
  }, [industryCode]);

  useEffect(() => {
    if (!formData.role) {
      setSelectedModules([]);
      return;
    }

    if (isRetail) {
      const normalized = normalizeRetailRole(formData.role);
      if (normalized && RETAIL_ROLE_ACCESS[normalized]) {
        setSelectedModules(RETAIL_ROLE_ACCESS[normalized]);
        return;
      }
    }

    if (isTextile) {
      const normalized = normalizeTextileRole(formData.role);
      if (normalized && TEXTILE_ROLE_ACCESS[normalized]) {
        setSelectedModules(TEXTILE_ROLE_ACCESS[normalized]);
        return;
      }
    }

    if (formData.role === "Manager") {
      const defaultManagerModules = [
        "DASHBOARD",
        "INVENTORY",
        "WAREHOUSE",
        "STOCK_TRANSFER",
        "CUSTOMERS",
        "SUPPLIERS",
        "PURCHASES",
        "SALES",
        "REPORTS",
        "INVOICES",
        "EMPLOYEES",
        "LAUNDRY",
        "BRANCHES",
        "SERVICES",
        "MEMBERS",
        "MEMBERSHIP_PLANS",
        "TRAINERS",
        "ATTENDANCE",
        "PAYMENTS",
      ];
      const valid = availableModules
        .map((m) => m.code)
        .filter((c) => defaultManagerModules.includes(c));
      setSelectedModules(valid.length > 0 ? valid : availableModules.map((m) => m.code));
    } else if (formData.role === "Admin") {
      setSelectedModules(availableModules.map((m) => m.code));
    } else if (formData.role === "Cashier") {
      const defaultCashierModules = ["SALES", "POS", "CUSTOMERS", "INVOICES", "DASHBOARD", "RESTAURANT", "LAUNDRY"];
      const valid = availableModules
        .map((m) => m.code)
        .filter((c) => defaultCashierModules.includes(c));
      setSelectedModules(valid);
    } else if (formData.role === "Inventory Manager") {
      const defaultInvModules = ["INVENTORY", "WAREHOUSE", "STOCK_TRANSFER", "PRODUCTS", "CATEGORIES", "BRANDS", "UNITS", "DASHBOARD", "STOCK-TRANSFER"];
      const valid = availableModules
        .map((m) => m.code)
        .filter((c) => defaultInvModules.includes(c));
      setSelectedModules(valid);
    } else if (formData.role === "Purchase Manager") {
      const defaultPurchModules = ["PURCHASES", "SUPPLIERS", "INVENTORY", "WAREHOUSE", "PRODUCTS", "DASHBOARD"];
      const valid = availableModules
        .map((m) => m.code)
        .filter((c) => defaultPurchModules.includes(c));
      setSelectedModules(valid);
    } else if (formData.role === "Accountant") {
      const defaultAcctModules = ["SALES", "PURCHASES", "INVOICES", "REPORTS", "PAYMENTS", "DASHBOARD"];
      const valid = availableModules
        .map((m) => m.code)
        .filter((c) => defaultAcctModules.includes(c));
      setSelectedModules(valid);
    } else if (formData.role === "Processing Staff" || formData.role === "Delivery Driver") {
      const defaultProcModules = ["LAUNDRY", "DASHBOARD"];
      const valid = availableModules
        .map((m) => m.code)
        .filter((c) => defaultProcModules.includes(c));
      setSelectedModules(valid);
    } else if (formData.role === "Trainer") {
      const defaultTrainerModules = ["DASHBOARD", "ATTENDANCE", "TRAINERS"];
      const valid = availableModules
        .map((m) => m.code)
        .filter((c) => defaultTrainerModules.includes(c));
      setSelectedModules(valid);
    } else if (formData.role === "Waiter") {
      const defaultWaiterModules = ["RESTAURANT", "DASHBOARD"];
      const valid = availableModules
        .map((m) => m.code)
        .filter((c) => defaultWaiterModules.includes(c));
      setSelectedModules(valid);
    } else if (formData.role === "Kitchen Staff") {
      const defaultKitchenModules = ["RESTAURANT", "INVENTORY", "DASHBOARD"];
      const valid = availableModules
        .map((m) => m.code)
        .filter((c) => defaultKitchenModules.includes(c));
      setSelectedModules(valid);
    } else {
      if (formData.role) {
        setSelectedModules(availableModules.map((m) => m.code));
      } else {
        setSelectedModules([]);
      }
    }
  }, [formData.role, availableModules]);

  const handleModuleToggle = (code) => {
    setSelectedModules((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const validateEmployeeForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Full name must be at least 3 characters";
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Enter a valid email address";
      }
    }

    const phoneErr = getPhoneValidationError(formData.phone, true);
    if (phoneErr) {
      newErrors.phone = phoneErr;
    }


    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (isTextile) {
      if (formData.role !== "Admin" && !formData.branchId) {
        newErrors.branchId = "Manufacturing Unit is required";
      }
    } else {
      if (!formData.branchId) {
        newErrors.branchId = isRestaurant ? "Outlet is required" : "Branch is required";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateEmployeeId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setFormData((prev) => ({
      ...prev,
      employeeId: `EMP-${randomNum}`,
    }));
  };

  useEffect(() => {
    fetchRoles();
    fetchBranches();
  }, [industryCode, user?.role]);

  useEffect(() => {
    generateEmployeeId();
  }, []);

  const handleCreateManufacturingUnit = async (e) => {
    e.preventDefault();
    if (!unitForm.unitName.trim()) {
      toast.error("Unit name is required");
      return;
    }
    try {
      setSavingUnit(true);
      const code = unitForm.unitCode.trim() || `MU-${Date.now().toString().slice(-4)}`;
      const res = await apiClient.post("/branches", {
        name: `${unitForm.unitName.trim()} (${unitForm.unitType})`,
        code,
        address: unitForm.location.trim() || `${unitForm.unitType} Unit Location`,
        isActive: unitForm.status === "Active",
        isTextile: true,
        type: "TEXTILE_MILL",
      });
      const newUnit = res.data?.data || res.data;
      toast.success(`Manufacturing Unit "${unitForm.unitName}" created successfully!`);
      await fetchBranches();
      if (newUnit?.id) {
        setFormData((prev) => ({ ...prev, branchId: newUnit.id }));
      }
      setShowUnitModal(false);
      setUnitForm({
        unitName: "",
        unitCode: "",
        unitType: "Weaving",
        location: "",
        status: "Active",
      });
    } catch (err) {
      console.error("Failed to create manufacturing unit:", err);
      toast.error(err.response?.data?.message || "Failed to create manufacturing unit");
    } finally {
      setSavingUnit(false);
    }
  };

  const fetchRoles = () => {
    const isTex = Boolean(industryCode?.includes("TEXTILE"));
    const isGymMode = Boolean(industryCode?.includes("GYM"));
    const isRestMode = Boolean(industryCode?.includes("RESTAURANT"));
    const isLndMode = Boolean(industryCode?.includes("LAUNDRY"));

    let combined = [];

    if (isGymMode) {
      combined = [
        { id: "Manager", name: "Manager" },
        { id: "Trainer", name: "Trainer" },
      ];
    } else if (isTex) {
      combined = [
        { id: "Admin", name: "Admin" },
        { id: "Manager", name: "Manager" },
        { id: "Weaver", name: "Weaver" },
        { id: "Dyer", name: "Dyer" },
        { id: "Quality Inspector", name: "Quality Inspector" },
      ];
    } else if (isRestMode) {
      combined = [
        { id: "Manager", name: "Manager" },
        { id: "Cashier", name: "Cashier" },
        { id: "Waiter", name: "Waiter" },
        { id: "Kitchen Staff", name: "Kitchen Staff" },
      ];
    } else if (isLndMode) {
      const userRoleUpper = (user?.role || "").toUpperCase();
      const isLaundryManager = userRoleUpper.includes("MANAGER") && !userRoleUpper.includes("SUPER") && !userRoleUpper.includes("ADMIN");

      if (isLaundryManager) {
        // Laundry Manager can only create subordinate staff
        combined = [
          { id: "Cashier", name: "Cashier" },
          { id: "Processing Staff", name: "Processing Staff" },
          { id: "Delivery Driver", name: "Delivery Driver" },
        ];
      } else {
        // Admin / Super Admin can create Manager and subordinate staff
        combined = [
          { id: "Manager", name: "Manager" },
          { id: "Cashier", name: "Cashier" },
          { id: "Processing Staff", name: "Processing Staff" },
          { id: "Delivery Driver", name: "Delivery Driver" },
        ];
      }
    } else {
      // Retail / default
      const userRoleUpper = (user?.role || "").toUpperCase();
      const isStoreManager = userRoleUpper.includes("MANAGER") && !userRoleUpper.includes("SUPER") && !userRoleUpper.includes("ADMIN");

      if (isStoreManager) {
        // Store Manager can only create subordinate staff
        combined = [
          { id: "Cashier", name: "Cashier" },
          { id: "Inventory Manager", name: "Inventory Manager" },
          { id: "Purchase Manager", name: "Purchase Manager" },
          { id: "Accountant", name: "Accountant" },
        ];
      } else {
        // Admin / Super Admin can create Store Manager and subordinate staff
        combined = [
          { id: "Store Manager", name: "Store Manager" },
          { id: "Cashier", name: "Cashier" },
          { id: "Inventory Manager", name: "Inventory Manager" },
          { id: "Purchase Manager", name: "Purchase Manager" },
          { id: "Accountant", name: "Accountant" },
        ];
      }
    }

    setRoles(combined);
  };

  const fetchBranches = async () => {
    try {
      const [branchRes, restRes, lndRes] = await Promise.all([
        getBranches().catch(() => []),
        restaurantService.getRestaurants().catch(() => []),
        apiClient.get("/laundries").catch(() => ({ data: [] })),
      ]);

      const bList = Array.isArray(branchRes?.data) ? branchRes.data : Array.isArray(branchRes) ? branchRes : (branchRes?.data?.data || []);
      const rList = Array.isArray(restRes?.data) ? restRes.data : Array.isArray(restRes) ? restRes : (restRes?.data?.data || []);
      const lList = Array.isArray(lndRes?.data?.data) ? lndRes.data.data : Array.isArray(lndRes?.data) ? lndRes.data : [];

      let combined = [];

      if (isRestaurant) {
        if (rList.length > 0) {
          combined = rList.map((r) => ({
            id: r.id,
            branchId: r.branchId || r.id,
            name: r.code ? `${r.name} (${r.code})` : r.name,
            code: r.code || "OUTLET",
          }));
        } else {
          combined = bList.map((b) => ({
            id: b.id,
            branchId: b.id,
            name: b.name,
            code: b.code || "BRANCH",
          }));
        }
      } else {
        combined = [...bList];

        rList.forEach((r) => {
          if (r?.id && !combined.some((b) => b.id === r.id || b.id === r.branchId)) {
            combined.push({
              id: r.id,
              branchId: r.branchId || r.id,
              name: `${r.name} (${r.code || "Outlet"})`,
              code: r.code || "OUTLET",
            });
          }
        });

        lList.forEach((l) => {
          if (l?.id && !combined.some((b) => b.id === l.id)) {
            combined.push({
              id: l.id,
              branchId: l.id,
              name: `${l.name} (${l.branch?.name || "Laundry"})`,
              code: "LAUNDRY",
            });
          }
        });
      }

      setBranches(combined);
    } catch (err) {
      console.error("Failed to fetch branches/outlets:", err);
      setBranches([]);
    }
  };


  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone" ? sanitizePhoneInput(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };


  const handleCancel = () => {
    router.push("/admin/employees/view");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmployeeForm()) {
      return;
    }

    setSubmitting(true);

    try {
      let response;
      if (isTextile) {
        response = await createTextileEmployee({
          ...formData,
          companyId: company?.id,
          manufacturingUnitId: formData.branchId,
          permissions: selectedModules.length > 0 ? selectedModules : undefined,
        });
      } else {
        response = await apiClient.post(
          "/employees",
          {
            ...formData,
            companyId: company?.id,
            type: industryCode,
            permissions: selectedModules.length > 0 ? selectedModules : undefined,
          }
        );
      }

      console.log("Employee created:", response);

      toast.success("Employee added successfully");

      setTimeout(() => {
        router.push("/admin/employees/view");
      }, 600);
    } catch (error) {
      console.error("Add employee error:", error);
      const serverMsg = error.response?.data?.message || error.message || "";
      const lower = serverMsg.toLowerCase();

      if (lower.includes("email")) {
        setErrors((prev) => ({ ...prev, email: serverMsg }));
      } else if (lower.includes("phone")) {
        setErrors((prev) => ({ ...prev, phone: serverMsg }));
      } else if (lower.includes("employee")) {
        setErrors((prev) => ({ ...prev, employeeId: serverMsg }));
      } else {
        toast.error(serverMsg || "Failed to add employee");
      }
    } finally {
      setSubmitting(false);
    }
  };


  const initials = formData.fullName.trim()
    ? formData.fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("")
    : "";

  return (
    <div className={styles.layout}>
      <Toaster position="top-right" />

      <div className={styles.container}>
        <div className={styles.content}>

          <form onSubmit={handleSubmit} noValidate>

            {/* Top Bar */}
            <div className={styles.topBar}>
              <div>
                <div className={styles.breadcrumb}>

                  <span
                    className={styles.breadcrumbLink}
                    onClick={handleCancel}
                  >
                    Employees
                  </span>

                  <ChevronRight size={14} />

                  <span>Add New</span>

                </div>

                <h1 className={styles.title}>
                  Add Employee
                </h1>
              </div>

              <div className={styles.topActions}>

                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitting}
                  style={isTextile ? { background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", boxShadow: "0 4px 12px rgba(8, 145, 178, 0.25)" } : undefined}
                >

                  {submitting && (
                    <Loader2
                      className={styles.spinnerIcon}
                      size={16}
                    />
                  )}

                  {submitting
                    ? "Saving..."
                    : "Save Employee"}

                </button>

              </div>
            </div>


            {/* Main Grid */}
            <div className={styles.grid}>

              {/* Employee Form */}
              <div className={styles.mainColumn}>

                <div className={styles.card}>

                  <h2 className={styles.cardTitle}>
                    Employee Information
                  </h2>


                  {/* Full Name + Employee ID */}
                  <div className={styles.formRow}>

                    <div className={styles.formGroup}>

                      <label className={styles.label}>
                        Full Name{" "}
                        <span className={styles.required}>
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="John Doe"
                        style={errors.fullName ? { borderColor: "#ef4444" } : {}}
                      />
                      {errors.fullName && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          {errors.fullName}
                        </span>
                      )}

                    </div>




                  </div>


                  {/* Email + Phone */}
                  <div className={styles.formRow}>

                    <div className={styles.formGroup}>

                      <label className={styles.label}>
                        Email{" "}
                        <span className={styles.required}>
                          *
                        </span>
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="john@example.com"
                        style={errors.email ? { borderColor: "#ef4444" } : {}}
                      />
                      {errors.email && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          {errors.email}
                        </span>
                      )}

                    </div>


                    <div className={styles.formGroup}>

                      <label className={styles.label}>
                        Phone Number{" "}
                        <span className={styles.required}>
                          *
                        </span>
                      </label>

                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="10-digit Phone Number"
                        style={errors.phone ? { borderColor: "#ef4444" } : {}}
                      />

                      {errors.phone && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          {errors.phone}
                        </span>
                      )}

                    </div>

                  </div>


                  {/* Role + Branch */}
                  <div className={styles.formRow}>

                    <div className={styles.formGroup}>

                      <label className={styles.label}>
                        Role{" "}
                        <span className={styles.required}>
                          *
                        </span>
                      </label>

                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className={styles.input}
                        style={errors.role ? { borderColor: "#ef4444" } : {}}
                      >
                        <option value="">Select Role</option>
                        {roles.length > 0 ? (
                          roles.map((r) => (
                            <option key={r.id} value={r.name}>
                              {r.name}
                            </option>
                          ))
                        ) : (
                          <>
                            {user?.role?.toUpperCase() !== "ADMIN" && <option value="Admin">Admin</option>}
                            <option value="Manager">Manager</option>
                            <option value="HR">HR</option>
                          </>
                        )}
                      </select>
                      {errors.role && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          {errors.role}
                        </span>
                      )}

                    </div>


                    <div className={styles.formGroup}>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <label className={styles.label} style={{ marginBottom: 0 }}>
                          {isTextile ? "Manufacturing Unit" : isRestaurant ? "Outlet" : "Branch"}{" "}
                          <span className={styles.required}>
                            *
                          </span>
                        </label>
                        {isTextile && (
                          <button
                            type="button"
                            onClick={() => setShowUnitModal(true)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#0d9488",
                              fontWeight: "700",
                              fontSize: "12px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            + Add Manufacturing Unit
                          </button>
                        )}
                      </div>

                      <select
                        name="branchId"
                        value={formData.branchId}
                        onChange={handleInputChange}
                        className={styles.input}
                        style={errors.branchId ? { borderColor: "#ef4444" } : {}}
                      >
                        <option value="">{isTextile ? "Select Manufacturing Unit" : isRestaurant ? "Select Outlet" : "Select Branch"}</option>
                        {isTextile && formData.role === "Admin" && (
                          <option value="ALL">All Manufacturing Units / General Office</option>
                        )}
                        {branches.length > 0 ? (
                          branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            {isTextile ? "No Manufacturing Units found" : isRestaurant ? "No outlets available" : "No branches available"}
                          </option>
                        )}
                      </select>
                      {errors.branchId && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          {errors.branchId}
                        </span>
                      )}

                    </div>

                  </div>


                  {/* Password */}
                  <div className={styles.formRow}>

                    <div className={styles.formGroup}>

                      <label className={styles.label}>
                        Password{" "}
                        <span className={styles.required}>
                          *
                        </span>
                      </label>

                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Enter temporary password"
                        style={errors.password ? { borderColor: "#ef4444" } : {}}
                      />
                      {errors.password && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                          {errors.password}
                        </span>
                      )}

                    </div>

                  </div>

                </div>

              </div>


              {/* Preview */}
              <div className={styles.sideColumn}>

                <div className={styles.card}>

                  <h2 className={styles.cardTitle}>
Preview
                  </h2>

                  <div className={styles.previewBody}>

                    <div className={styles.avatar} style={isTextile ? { background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", color: "#ffffff" } : undefined}>

                      {initials ? (
                        initials
                      ) : (
                        <User size={28} />
                      )}

                    </div>


                    <div className={styles.previewName}>
                      {formData.fullName || "New Employee"}
                    </div>


                    <div className={styles.previewRole}>
                      {formData.role || "Role not set"}
                    </div>

                    {formData.branchId && (
                      <div style={{ fontSize: "12px", color: isTextile ? "#0891b2" : "#94a3b8", fontWeight: isTextile ? "600" : "400", marginTop: "4px" }}>
                        📍 {formData.branchId === "ALL" ? "All Manufacturing Units / General Office" : branches.find((b) => b.id === formData.branchId || b.branchId === formData.branchId)?.name || ""}
                      </div>
                    )}

                    {formData.employeeId && (
                      <span
                        className={styles.previewIdBadge}
                        style={isTextile ? { background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" } : undefined}
                      >
                        {formData.employeeId}
                      </span>
                    )}

                  </div>


                  <p className={styles.previewHint}>
                    This is how the employee will appear in your team list once saved.
                  </p>

                </div>

                {formData.role && (
                  <div className={styles.card} style={{ marginTop: "24px" }}>
                    <h2 className={styles.cardTitle}>
                      {isRestaurant || isRetail || isLaundry || isTextile ? "Automatic Role Permissions" : "Module Access Permissions"}
                    </h2>

                    {isTextile ? (
                      <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155" }}>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 12px 0" }}>
                          Access is automatically assigned based on the selected role: <strong style={{ color: "#0d9488" }}>{formData.role}</strong>
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {(normalizeTextileRole(formData.role) === "ADMIN" || formData.role === "Admin") && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Full Textile ERP Operational & Administrative Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>
                                Dashboard, Textile Products, Raw Materials, Suppliers, Customers, Purchase Management, Production Management, Inventory Stock, Stock Movements, Warehouses, Quality Control, Manufacturing Units, Fabric Sales, Export Management, Units of Measure, Employees / Staff, Reports & Analytics
                              </div>
                            </>
                          )}
                          {normalizeTextileRole(formData.role) === "MANAGER" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Textile Management & Operations Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>
                                Dashboard, Textile Products, Raw Materials, Suppliers, Customers, Purchase Management, Production Management, Inventory Stock, Stock Movements, Warehouses, Quality Control, Manufacturing Units, Fabric Sales, Export Management, Reports & Analytics
                              </div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "2px" }}>
                                ✗ Restricted: Employees / Staff, Global Company Settings, Role Management
                              </div>
                            </>
                          )}
                          {normalizeTextileRole(formData.role) === "WEAVER" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Weaver Production Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>
                                Dashboard, Production Management (Assigned Production Orders, Production Tracking, Loom Weaving Operations, Assigned Material Details)
                              </div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "2px" }}>
                                ✗ Restricted: Products setup, Raw Materials master, Suppliers, Customers, Purchases, Warehouses, Quality Control, Sales, Exports, Employees, Financial Reports
                              </div>
                            </>
                          )}
                          {normalizeTextileRole(formData.role) === "DYER" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Dyer Dyeing Operations Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>
                                Dashboard, Production Management (Assigned Dyeing Batches, Dye Recipe Tracking, Chemical Materials Consumption)
                              </div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "2px" }}>
                                ✗ Restricted: Products setup, Raw Materials master, Suppliers, Customers, Purchases, Warehouses, Quality Control, Sales, Exports, Employees, Financial Reports
                              </div>
                            </>
                          )}
                          {normalizeTextileRole(formData.role) === "QUALITY_INSPECTOR" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Quality Inspector Inspection Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>
                                Dashboard, Quality Control (Fabric Defect Inspection, Grade Point Scoring, Inspection Sheet Recording, Pass/Fail Certification)
                              </div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "2px" }}>
                                ✗ Restricted: Products setup, Suppliers, Customers, Purchases, Production Batch Creation, Sales, Exports, Employees, Settings
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : isLaundry ? (
                      <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155" }}>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 12px 0" }}>
                          Access is automatically assigned based on the selected role: <strong style={{ color: "#6366f1" }}>{formData.role}</strong>
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {formData.role === "Laundry Staff" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Laundry Operations Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>
                                Dashboard, Laundry POS, Active Orders, Garment Tracking, Processing Queue, Ready Orders, Pickup & Deliveries, Customers
                              </div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "2px" }}>
                                ✗ Restricted: Outlets & Branches, Services & Categories, Employees / Staff, Laundry Reports
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : isRestaurant ? (
                      <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155" }}>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 12px 0" }}>
                          Access is automatically assigned based on the selected role: <strong style={{ color: "#6366f1" }}>{formData.role}</strong>
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {formData.role === "Admin" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Full Restaurant ERP Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>Dashboard, Outlets Setup, POS, Tables, Reservations, Menu & Recipes, KDS, Orders, Wastage, Staff, Reports</div>
                            </>
                          )}
                          {formData.role === "Manager" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Operational Restaurant Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>Dashboard, POS, Tables, Reservations, Menu & Recipes, KDS, Orders, Wastage, Staff, Reports</div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>✗ Restricted: Outlet Setup</div>
                            </>
                          )}
                          {formData.role === "Cashier" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Cashier Billing Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>Restaurant POS, Restaurant Orders, Order History, Payment & Billing, Print Bill</div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>✗ Restricted: Dashboard, Outlet Setup, Menu, KDS, Staff, Reports</div>
                            </>
                          )}
                          {formData.role === "Waiter" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Service Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>Restaurant POS, Floor & Tables, Reservations, My Orders</div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>✗ Restricted: Billing, Payments, Print Bill, KDS, Menu Setup</div>
                            </>
                          )}
                          {formData.role === "Kitchen Staff" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Kitchen Display Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>Kitchen Display System (KDS)</div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>✗ Restricted: POS, Billing, Orders Management, Reports</div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : isRetail ? (
                      <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155" }}>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 12px 0" }}>
                          Access is automatically assigned based on the assigned role: <strong style={{ color: "#6366f1" }}>{formData.role}</strong>
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {(normalizeRetailRole(formData.role) === "STORE_MANAGER" || formData.role === "Manager" || formData.role === "Admin") && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Full Store Operational Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>Dashboard, POS Terminal, Barcode Printing, Products, Categories, Brands, Warehouse Management, Customers, Suppliers, Purchases, Sales Orders, Invoices, Store Outlets & Branches, Employees / Staff, Reports & Analytics</div>
                              <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>• Restricted: Super Admin system settings, other ERP modes</div>
                            </>
                          )}
                          {normalizeRetailRole(formData.role) === "CASHIER" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Cashier Billing & Terminal Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>Dashboard, POS Terminal, Customers, Barcode Printing, Invoices / Receipts</div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>✗ Restricted: Products setup, Categories, Brands, Warehouse, Suppliers, Purchases, Employees, Reports, Store Settings</div>
                            </>
                          )}
                          {normalizeRetailRole(formData.role) === "INVENTORY_MANAGER" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Inventory & Stock Tracking Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>Dashboard, Products Setup, Categories, Brands, Barcode Printing, Warehouse Management</div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>✗ Restricted: POS Terminal, Purchases, Sales Orders, Invoices, Employees, Financial Reports</div>
                            </>
                          )}
                          {normalizeRetailRole(formData.role) === "PURCHASE_MANAGER" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Purchasing & Vendor Management Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>Dashboard, Products, Categories, Brands, Suppliers, Purchases, Warehouse Management</div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>✗ Restricted: POS Terminal, Sales Orders, Invoices, Employees, Accounting Reports</div>
                            </>
                          )}
                          {normalizeRetailRole(formData.role) === "ACCOUNTANT" && (
                            <>
                              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>✓ Financial Accounting & Audit Access</div>
                              <div style={{ color: "#cbd5e1", fontSize: "12px" }}>Dashboard, POS Sales History (view-only), Sales Orders, Invoices, Purchases (view), Customers (view), Suppliers (view), Reports & Analytics</div>
                              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>✗ Restricted: Operational POS Terminal, Barcode Printing, Product setup, Categories, Brands, Warehouse, Employees, Store Settings</div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>
                          Select which modules this {formData.role} can access.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {availableModules.map((mod) => {
                            const isSelected = selectedModules.includes(mod.code);
                            return (
                              <label
                                key={mod.code}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  padding: "10px 12px",
                                  borderRadius: "6px",
                                  backgroundColor: isSelected ? "rgba(79, 70, 229, 0.1)" : "#1e293b",
                                  border: `1px solid ${isSelected ? "#4f46e5" : "#334155"}`,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleModuleToggle(mod.code)}
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#4f46e5",
                                    cursor: "pointer",
                                  }}
                                />
                                <div>
                                  <strong style={{ display: "block", fontSize: "13px", color: "#f8fafc" }}>
                                    {mod.name}
                                  </strong>
                                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                    {mod.description}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>

            </div>

          </form>

        </div>
      </div>

      {/* QUICK CREATE MANUFACTURING UNIT MODAL */}
      {showUnitModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "480px", border: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", color: "#0f172a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Add New Manufacturing Unit</h2>
              <button
                type="button"
                onClick={() => setShowUnitModal(false)}
                style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManufacturingUnit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Unit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Loom Weaving Unit A"
                  value={unitForm.unitName}
                  onChange={(e) => setUnitForm({ ...unitForm, unitName: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "14px", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Unit Code</label>
                  <input
                    type="text"
                    placeholder="e.g. WEAV-01"
                    value={unitForm.unitCode}
                    onChange={(e) => setUnitForm({ ...unitForm, unitCode: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "14px", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Unit Type *</label>
                  <select
                    value={unitForm.unitType}
                    onChange={(e) => setUnitForm({ ...unitForm, unitType: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "14px", outline: "none" }}
                  >
                    <option value="Spinning">Spinning</option>
                    <option value="Weaving">Weaving</option>
                    <option value="Dyeing">Dyeing</option>
                    <option value="Printing">Printing</option>
                    <option value="Finishing">Finishing</option>
                    <option value="Quality Control">Quality Control</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. North Mill Complex, Sector 2"
                  value={unitForm.location}
                  onChange={(e) => setUnitForm({ ...unitForm, location: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "14px", outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Status</label>
                <select
                  value={unitForm.status}
                  onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "14px", outline: "none" }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  disabled={savingUnit}
                  style={{ padding: "10px 16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUnit}
                  style={{ padding: "10px 20px", borderRadius: "8px", background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", border: "none", color: "#ffffff", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(8, 145, 178, 0.25)" }}
                >
                  {savingUnit ? "Saving..." : "Save Manufacturing Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}