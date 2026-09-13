"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Edit2,
  Trash2,
  X,
  Users,
  Loader2,
  Plus,
  CreditCard,
  Mail,
  Phone,
  Building2,
  Eye,
} from "lucide-react";

import styles from "./viewEmployees.module.css";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

import { getRoles } from "@/services/roleService";
import { getBranches } from "@/services/branchService";
import { restaurantService } from "@/services/restaurantService";
import apiClient from "@/services/apiClient";
import { getTextileEmployees } from "@/services/textileEmployeeService";

import { useSettings } from "@/context/SettingsContext";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import { RETAIL_ROLE_ACCESS, normalizeRetailRole } from "@/config/retailRoles";
import { TEXTILE_ROLE_ACCESS, normalizeTextileRole } from "@/config/textileRoles";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";




export default function EmployeePage() {
  const router = useRouter();

  const {
    user,
    company,
    industryCode,
    isGym,
    isTextile,
    isRestaurant,
    isRetail,
    isLaundry,
  } = useCompany();

  const { settings, logoUrl } = useSettings();

  const {
    showSuccess,
    showError,
    showConfirm,
  } = useAlert();


  /* =====================================================
     PAGE TEXT
  ===================================================== */

  const pageTitle = isGym
    ? "Gym Fitness Trainers & Staff Roster"
    : isTextile
    ? "Mill Machine Operators, Technicians & QC Staff"
    : "Employees & Staff Directory";


  const pageSub = isGym
    ? "Manage personal trainers, front-desk staff, and fitness managers."
    : isTextile
    ? "Manage weaving loom operators, dyeing technicians, quality inspectors, and mill supervisors."
    : "Manage store employees, sales cashiers, and department staff.";


  const addBtnText = isGym
    ? "Add Trainer / Staff"
    : isTextile
    ? "Add Operator / Staff"
    : "Add Employee";


  /* =====================================================
     STATE
  ===================================================== */

  const [roles, setRoles] = useState([]);

  const [branches, setBranches] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [errors, setErrors] = useState({});

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [currentEmployee, setCurrentEmployee] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [filterType, setFilterType] =
    useState("all");

  const [selectedModules, setSelectedModules] =
    useState([]);


  /* =====================================================
     AVAILABLE MODULES
  ===================================================== */

  const availableModules = useMemo(() => {
    const isTex = Boolean(
      industryCode?.includes("TEXTILE")
    );

    const isGymMode = Boolean(
      industryCode?.includes("GYM")
    );

    const isRest = Boolean(
      industryCode?.includes("RESTAURANT")
    );

    const isLnd = Boolean(
      industryCode?.includes("LAUNDRY")
    );


    /* ===============================
       LAUNDRY
    =============================== */

    if (isLnd) {
      return [
        {
          code: "DASHBOARD",
          name: "Laundry Dashboard",
          description:
            "Washing operations summary & charts",
        },
        {
          code: "LAUNDRY",
          name: "Laundry POS & Operations",
          description:
            "Garment tracking, active orders & queue",
        },
        {
          code: "BRANCHES",
          name: "Outlets & Branches",
          description:
            "Laundry outlets & branch locations",
        },
        {
          code: "SERVICES",
          name: "Services & Categories",
          description:
            "Washing & dry cleaning catalog",
        },
        {
          code: "CUSTOMERS",
          name: "Customers",
          description:
            "Client profiles & phone directory",
        },
        {
          code: "EMPLOYEES",
          name: "Employees & Staff",
          description:
            "Washer, presser & driver team",
        },
        {
          code: "REPORTS",
          name: "Laundry Reports",
          description:
            "Revenue & garment delivery analytics",
        },
      ];
    }


    /* ===============================
       GYM
    =============================== */

    else if (isGymMode) {
      return [
        {
          code: "DASHBOARD",
          name: "Dashboard",
          description:
            "Business statistics & charts",
        },
        {
          code: "MEMBERS",
          name: "Members",
          description:
            "Manage gym member accounts",
        },
        {
          code: "MEMBERSHIP_PLANS",
          name: "Membership Plans",
          description:
            "Configure membership packages",
        },
        {
          code: "TRAINERS",
          name: "Trainers",
          description:
            "Gym instructors & schedules",
        },
        {
          code: "ATTENDANCE",
          name: "Attendance",
          description:
            "Daily gym check-ins logs",
        },
        {
          code: "PAYMENTS",
          name: "Payments",
          description:
            "Financial receipts & invoices",
        },
        {
          code: "EMPLOYEES",
          name: "Employees",
          description:
            "Manage staff & team permissions",
        },
        {
          code: "SUPPLIERS",
          name: "Suppliers",
          description:
            "Vendor catalog & logistics",
        },
        {
          code: "REPORTS",
          name: "Reports & Analytics",
          description:
            "Visual operations summaries",
        },
      ];
    }


    /* ===============================
       TEXTILE
    =============================== */

    else if (isTex) {
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
    }


    /* ===============================
       RESTAURANT
    =============================== */

    else if (isRest) {
      return [
        {
          code: "DASHBOARD",
          name: "Restaurant Dashboard",
          description:
            "Food sales charts & analytics",
        },
        {
          code: "RESTAURANT",
          name: "Restaurant POS & Floor",
          description:
            "POS terminal, KOT, tables & costing",
        },
        {
          code: "PRODUCTS",
          name: "Menu & Ingredients",
          description:
            "Manage raw ingredients & recipes",
        },
        {
          code: "CATEGORIES",
          name: "Menu Categories",
          description:
            "Configure menu categories",
        },
        {
          code: "BRANDS",
          name: "Ingredient Brands",
          description:
            "Configure ingredient brands",
        },
        {
          code: "UNITS",
          name: "Units of Measure",
          description:
            "Configure recipe units of measure",
        },
        {
          code: "INVENTORY",
          name: "Kitchen Inventory",
          description:
            "Stock control of kitchen supplies",
        },
        {
          code: "WAREHOUSE",
          name: "Outlets / Storage",
          description:
            "Store storage rooms & pantries",
        },
        {
          code: "SUPPLIERS",
          name: "Suppliers",
          description:
            "Vendor details for food orders",
        },
        {
          code: "PURCHASES",
          name: "Food Purchases",
          description:
            "Supplier ingredients procurement",
        },
        {
          code: "EMPLOYEES",
          name: "Staff Management",
          description:
            "Waiters, kitchen & cashier accounts",
        },
        {
          code: "REPORTS",
          name: "Analytics & Reports",
          description:
            "Restaurant operations overview",
        },
      ];
    }


    /* ===============================
       RETAIL / DEFAULT
    =============================== */

    return [
      {
        code: "DASHBOARD",
        name: "Dashboard",
        description:
          "Live metrics & charts",
      },
      {
        code: "PRODUCTS",
        name: "Products Setup",
        description:
          "Manage product listings",
      },
      {
        code: "CATEGORIES",
        name: "Product Categories",
        description:
          "Configure category filters",
      },
      {
        code: "BRANDS",
        name: "Product Brands",
        description:
          "Configure product brand tags",
      },
      {
        code: "UNITS",
        name: "Units of Measure",
        description:
          "Configure units of measure (UoM)",
      },
      {
        code: "INVENTORY",
        name: "Inventory",
        description:
          "Current stock catalogs",
      },
      {
        code: "WAREHOUSE",
        name: "Warehouse",
        description:
          "Store depots & physical logs",
      },
      {
        code: "STOCK_TRANSFER",
        name: "Stock Transfer",
        description:
          "Inter-branch product transfers",
      },
      {
        code: "CUSTOMERS",
        name: "Customers",
        description:
          "Client database & profiles",
      },
      {
        code: "SUPPLIERS",
        name: "Suppliers",
        description:
          "Vendor details & catalog",
      },
      {
        code: "PURCHASES",
        name: "Purchases",
        description:
          "Supplier purchase logs",
      },
      {
        code: "SALES",
        name: "Sales Orders",
        description:
          "Store sales & invoices",
      },
      {
        code: "REPORTS",
        name: "Reports & Analytics",
        description:
          "Operations summaries",
      },
      {
        code: "INVOICES",
        name: "Invoices",
        description:
          "Generate receipt documents",
      },
      {
        code: "EMPLOYEES",
        name: "Employees / Team",
        description:
          "Manage branch staff accounts",
      },
    ];
  }, [industryCode]);


  /* =====================================================
     MODULE TOGGLE
  ===================================================== */

  const handleModuleToggle = (code) => {
    setSelectedModules((previous) =>
      previous.includes(code)
        ? previous.filter(
            (item) => item !== code
          )
        : [...previous, code]
    );
  };


  /* =====================================================
     FORM DATA
  ===================================================== */

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    employeeId: "",
    role: "",
    branchId: "",
  });

  /* =====================================================
     VALIDATE FORM
  ===================================================== */


  const validateEditEmployeeForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Enter a valid email address";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(formData.phone.trim(), true)) {
      newErrors.phone = getPhoneValidationError(formData.phone.trim(), true) || "Phone number must contain exactly 10 digits";
    }



    if (!formData.branchId) {
      newErrors.branchId =
        isRestaurant
          ? "Outlet is required"
          : "Branch is required";
    }


    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };


  /* =====================================================
     FETCH DATA
  ===================================================== */

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
    fetchBranches();
  }, [company?.id, industryCode, isTextile, user?.role]);


  /* =====================================================
     FETCH ROLES
  ===================================================== */

  const fetchRoles = () => {
    let combined = [];


    if (isGym) {
      combined = [
        {
          id: "Manager",
          name: "Manager",
        },
        {
          id: "Trainer",
          name: "Trainer",
        },
      ];
    }


    else if (isTextile) {
      combined = [
        {
          id: "Manager",
          name: "Manager",
        },
        {
          id: "Weaver",
          name: "Weaver",
        },
        {
          id: "Dyer",
          name: "Dyer",
        },
        {
          id: "Quality Inspector",
          name: "Quality Inspector",
        },
      ];
    }


    else if (isRestaurant) {
      combined = [
        {
          id: "Manager",
          name: "Manager",
        },
        {
          id: "Cashier",
          name: "Cashier",
        },
        {
          id: "Waiter",
          name: "Waiter",
        },
        {
          id: "Kitchen Staff",
          name: "Kitchen Staff",
        },
      ];
    }


    else if (isLaundry) {
      const userRoleUpper = (user?.role || "").toUpperCase();
      const isLaundryManager = userRoleUpper.includes("MANAGER") && !userRoleUpper.includes("SUPER") && !userRoleUpper.includes("ADMIN");

      if (isLaundryManager) {
        combined = [
          {
            id: "Cashier",
            name: "Cashier",
          },
          {
            id: "Processing Staff",
            name: "Processing Staff",
          },
          {
            id: "Delivery Driver",
            name: "Delivery Driver",
          },
        ];
      } else {
        combined = [
          {
            id: "Manager",
            name: "Manager",
          },
          {
            id: "Cashier",
            name: "Cashier",
          },
          {
            id: "Processing Staff",
            name: "Processing Staff",
          },
          {
            id: "Delivery Driver",
            name: "Delivery Driver",
          },
        ];
      }
    }


    else {
      // Retail / default
      const userRoleUpper = (user?.role || "").toUpperCase();
      const isStoreManager = userRoleUpper.includes("MANAGER") && !userRoleUpper.includes("SUPER") && !userRoleUpper.includes("ADMIN");

      if (isStoreManager) {
        // Store Manager can only assign subordinate roles
        combined = [
          {
            id: "Cashier",
            name: "Cashier",
          },
          {
            id: "Inventory Manager",
            name: "Inventory Manager",
          },
          {
            id: "Purchase Manager",
            name: "Purchase Manager",
          },
          {
            id: "Accountant",
            name: "Accountant",
          },
        ];
      } else {
        // Admin / Super Admin can assign Store Manager and subordinate staff
        combined = [
          {
            id: "Store Manager",
            name: "Store Manager",
          },
          {
            id: "Cashier",
            name: "Cashier",
          },
          {
            id: "Inventory Manager",
            name: "Inventory Manager",
          },
          {
            id: "Purchase Manager",
            name: "Purchase Manager",
          },
          {
            id: "Accountant",
            name: "Accountant",
          },
        ];
      }
    }


    setRoles(combined);
  };


  /* =====================================================
     FETCH BRANCHES / OUTLETS
  ===================================================== */

  const fetchBranches = async () => {
    try {
      const [
        res,
        restRes,
      ] = await Promise.all([
        getBranches().catch(() => []),
        restaurantService
          .getRestaurants()
          .catch(() => []),
      ]);


      const bList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : res?.data?.data || [];


      const rList = Array.isArray(
        restRes?.data
      )
        ? restRes.data
        : Array.isArray(restRes)
        ? restRes
        : restRes?.data?.data || [];


      let combined = [];


      if (isRestaurant) {
        if (rList.length > 0) {
          combined = rList.map((restaurant) => ({
            id: restaurant.id,

            branchId:
              restaurant.branchId ||
              restaurant.id,

            name: restaurant.code
              ? `${restaurant.name} (${restaurant.code})`
              : restaurant.name,

            code:
              restaurant.code ||
              "OUTLET",
          }));
        } else {
          combined = bList.map((branch) => ({
            id: branch.id,

            branchId: branch.id,

            name: branch.name,

            code:
              branch.code ||
              "BRANCH",
          }));
        }
      }


      else {
        combined = [...bList];

        rList.forEach((restaurant) => {
          if (
            restaurant?.id &&
            !combined.some(
              (branch) =>
                branch.id === restaurant.id ||
                branch.id ===
                  restaurant.branchId
            )
          ) {
            combined.push({
              id: restaurant.id,

              branchId:
                restaurant.branchId ||
                restaurant.id,

              name: `${restaurant.name} (${
                restaurant.code ||
                "Outlet"
              })`,

              code:
                restaurant.code ||
                "OUTLET",
            });
          }
        });
      }


      setBranches(combined);
    } catch (error) {
      console.error(
        "Failed to fetch branches/outlets:",
        error
      );
    }
  };


  /* =====================================================
     AUTH HEADERS
  ===================================================== */

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;

    return token
      ? {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      : {};
  };


  /* =====================================================
     FETCH EMPLOYEES
  ===================================================== */

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      let rawList = [];

      if (isTextile) {
        try {
          const res = await getTextileEmployees();
          rawList = res.data?.data || res.data || [];
        } catch (tErr) {
          console.warn("Failed to fetch via /textile/employees, falling back:", tErr);
          const response = await apiClient.get(
            `/employees?companyId=${company?.id || ""}&type=TEXTILE`
          );
          rawList = response.data?.data || [];
        }
      } else {
        const response = await apiClient.get(
          `/employees?companyId=${company?.id || ""}&type=${industryCode || ""}`
        );
        rawList = response.data?.data || [];
      }

      let baseList = rawList;

      /* =========================================
         HIDE ADMIN EMPLOYEES FOR BUSINESS ADMIN & LAUNDRY
      ========================================= */

      if (
        isLaundry ||
        (!isTextile &&
          user?.role?.toUpperCase() ===
          "ADMIN")
      ) {
        baseList =
          rawList.filter(
            (employee) => {
              const empRole = (employee.role || employee.roleRef?.name || "").toUpperCase();
              return (
                empRole !== "ADMIN" &&
                empRole !== "SUPER_ADMIN" &&
                empRole !== "SUPERADMIN" &&
                !empRole.includes("SUPER") &&
                !empRole.includes("ADMIN")
              );
            }
          );
      }

      /* =========================================
         INDUSTRY FILTER
      ========================================= */

      const filteredList =
        baseList.filter((employee) => {
          if (isTextile) {
            return (
              employee.type === "TEXTILE" ||
              employee.erpType === "TEXTILE" ||
              employee.isTextile ||
              !employee.type ||
              employee.employeeId?.startsWith("EMP-TEX") ||
              ["weaver", "dyer", "quality inspector", "manager", "admin", "operator", "mill", "loom", "supervisor"].some((r) =>
                (employee.role || employee.roleRef?.name || "").toLowerCase().includes(r)
              )
            );
          }

          if (
            employee.type &&
            industryCode &&
            employee.type.toUpperCase() ===
              industryCode.toUpperCase()
          ) {
            return true;
          }

          const isGymEmp =
            employee.type ===
              "GYM" ||
            employee.employeeId?.startsWith(
              "EMP-GYM"
            ) ||
            employee.role
              ?.toLowerCase()
              .includes("trainer") ||
            employee.role
              ?.toLowerCase()
              .includes("nutrition") ||
            employee.role
              ?.toLowerCase()
              .includes("fitness") ||
            employee.role
              ?.toLowerCase()
              .includes("desk") ||
            employee.role
              ?.toLowerCase()
              .includes("check-in") ||
            employee.role
              ?.toLowerCase()
              .includes("receptionist");

          if (isGym) {
            return (
              isGymEmp ||
              !employee.type
            );
          }

          return true;
        });

      setEmployees(filteredList);

    } catch (error) {
      console.error(
        "Fetch employees error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };


  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleInputChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    const finalVal = name === "phone" ? sanitizePhoneInput(value) : value;

    setFormData((previous) => ({
      ...previous,
      [name]: finalVal,
    }));


    if (name === "role" && isRetail) {
      const normalized = normalizeRetailRole(value);
      if (normalized && RETAIL_ROLE_ACCESS[normalized]) {
        setSelectedModules(RETAIL_ROLE_ACCESS[normalized]);
      }
    }

    if (name === "role" && isTextile) {
      const normalized = normalizeTextileRole(value);
      if (normalized && TEXTILE_ROLE_ACCESS[normalized]) {
        setSelectedModules(TEXTILE_ROLE_ACCESS[normalized]);
      }
    }

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: undefined,
      }));
    }
  };


  /* =====================================================
     ADD EMPLOYEE
  ===================================================== */

  const handleAddEmployee = () => {
    router.push(
      "/admin/employees/add"
    );
  };


  /* =====================================================
     EDIT EMPLOYEE
  ===================================================== */

  const handleEditEmployee = (
    employee
  ) => {
    setCurrentEmployee(employee);

    setErrors({});

    const matchingOption =
      branches.find(
        (branch) =>
          branch.id ===
            employee.branchId ||
          branch.branchId ===
            employee.branchId ||
          branch.id ===
            employee.branch?.id
      );

    let existingPerms = [];

    if (isRetail) {
      const normalized = normalizeRetailRole(employee.role?.name || employee.role);
      if (normalized && RETAIL_ROLE_ACCESS[normalized]) {
        existingPerms = RETAIL_ROLE_ACCESS[normalized];
      } else {
        existingPerms = RETAIL_ROLE_ACCESS.STORE_MANAGER;
      }
    } else if (isTextile) {
      const normalized = normalizeTextileRole(employee.role?.name || employee.role);
      if (normalized && TEXTILE_ROLE_ACCESS[normalized]) {
        existingPerms = TEXTILE_ROLE_ACCESS[normalized];
      } else {
        existingPerms = TEXTILE_ROLE_ACCESS.ADMIN;
      }
    } else if (employee.permissions) {
      try {
        existingPerms =
          typeof employee.permissions ===
          "string"
            ? JSON.parse(
                employee.permissions
              )
            : employee.permissions;
      } catch (error) {
        if (
          typeof employee.permissions ===
          "string"
        ) {
          existingPerms =
            employee.permissions
              .split(",")
              .map((item) =>
                item.trim().toUpperCase()
              );
        }
      }
    }

    setSelectedModules(
      Array.isArray(existingPerms) &&
        existingPerms.length > 0
        ? existingPerms
        : availableModules.map(
            (module) => module.code
          )
    );


    setFormData({
      fullName:
        employee.fullName || "",

      email:
        employee.email || "",

      phone:
        employee.phone || "",

      employeeId:
        employee.employeeId || "",

      role:
        employee.role?.name ||
        employee.role ||
        "Admin",

      branchId:
        matchingOption?.id ||
        employee.branchId ||
        employee.branch?.id ||
        "",
    });


    setIsModalOpen(true);
  };


  /* =====================================================
     DELETE EMPLOYEE
  ===================================================== */

  const handleDeleteEmployee = (
    employeeId
  ) => {
    showConfirm({
      title: "Delete Employee",

      message:
        "Are you sure you want to delete this employee record? This action cannot be undone.",

      confirmText:
        "Delete Employee",

      type: "danger",

      onConfirm: async () => {
        try {

          if (
            typeof employeeId ===
              "string" &&
            !employeeId.startsWith(
              "emp-"
            )
          ) {
            await apiClient.delete(
              `/employees/${employeeId}`
            );
          }


          showSuccess(
            "Employee Deleted",
            "Employee profile deleted successfully."
          );


          setEmployees(
            (previous) =>
              previous.filter(
                (employee) =>
                  employee.id !==
                  employeeId
              )
          );

        } catch (error) {

          console.error(
            "Delete employee error:",
            error
          );


          showError(
            "Employee Deletion Failed",
            error.response?.data
              ?.message ||
              "Failed to delete employee."
          );
        }
      },
    });
  };


  /* =====================================================
     UPDATE EMPLOYEE
  ===================================================== */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();


    if (!currentEmployee) {
      return;
    }


    if (!validateEditEmployeeForm()) {
      return;
    }


    setSubmitting(true);


    try {

      const updateData = {
        ...formData,
        permissions: isLaundry ? undefined : selectedModules,
      };



      const response =
        await apiClient.put(
          `/employees/${currentEmployee.id}`,
          updateData
        );


      toast.success(
        response.data?.message ||
          "Employee updated successfully"
      );


      closeModal();

      fetchEmployees();

    } catch (error) {

      console.error(
        "Update employee error:",
        error
      );


      const serverMsg =
        error.response?.data
          ?.message || "";

      const lower =
        serverMsg.toLowerCase();


      if (
        lower.includes("email")
      ) {
        setErrors(
          (previous) => ({
            ...previous,
            email: serverMsg,
          })
        );
      }


      else if (
        lower.includes("phone")
      ) {
        setErrors(
          (previous) => ({
            ...previous,
            phone: serverMsg,
          })
        );
      }


      else if (
        lower.includes("employee")
      ) {
        setErrors(
          (previous) => ({
            ...previous,
            employeeId:
              serverMsg,
          })
        );
      }


      else {
        toast.error(
          serverMsg ||
            "Failed to update employee"
        );
      }

    } finally {
      setSubmitting(false);
    }
  };


  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const closeModal = () => {
    if (submitting) {
      return;
    }


    setIsModalOpen(false);

    setCurrentEmployee(null);

    setErrors({});


    setFormData({
      fullName: "",
      email: "",
      phone: "",
      employeeId: "",
      role: "",
      branchId: "",
    });
  };


  /* =====================================================
     GET INITIALS
  ===================================================== */

  const getInitials = (name) => {
    if (!name) {
      return "EM";
    }


    return name
      .trim()
      .split(/\s+/)
      .map(
        (word) =>
          word.charAt(0)
      )
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };


  /* =====================================================
     GET ROLE
  ===================================================== */

  const getRoleName = (
    employee
  ) => {

    if (!employee) {
      return "Employee";
    }


    if (
      employee.role &&
      typeof employee.role ===
        "object"
    ) {
      return (
        employee.role?.name ||
        "Employee"
      );
    }

    if (
      employee.roleRef &&
      typeof employee.roleRef ===
        "object"
    ) {
      return (
        employee.roleRef?.name ||
        "Employee"
      );
    }

    if (
      employee.role &&
      typeof employee.role ===
        "string"
    ) {
      return employee.role;
    }


    return "Employee";
  };


  /* =====================================================
     GET EMPLOYEE IMAGE
  ===================================================== */

  const getEmployeeImage = (
    employee
  ) => {

    if (!employee) {
      return null;
    }


    return (
      employee.image ||
      employee.profileImage ||
      employee.photo ||
      employee.avatar ||
      null
    );
  };


  /* =====================================================
     TRAINER CHECK
  ===================================================== */

  const isTrainerRole = (
    employee
  ) => {

    const roleName =
      getRoleName(
        employee
      ).toLowerCase();


    return (
      roleName.includes(
        "trainer"
      ) ||
      roleName.includes(
        "nutrition"
      ) ||
      roleName.includes(
        "coach"
      ) ||
      roleName.includes(
        "instructor"
      ) ||
      employee.employeeId?.startsWith(
        "EMP-TRN"
      )
    );
  };


  /* =====================================================
     DISPLAYED EMPLOYEES
  ===================================================== */

  const displayedEmployees =
    employees.filter(
      (employee) => {

        const callerRole =
          (
            user?.role || ""
          ).toUpperCase();


        if (
          callerRole !==
            "SUPER_ADMIN" &&
          callerRole !==
            "SUPERADMIN"
        ) {

          const employeeRole =
            (
              typeof employee.role ===
              "string"
                ? employee.role
                : employee.role
                    ?.name || ""
            ).toUpperCase();


          if (
            employeeRole ===
              "ADMIN" ||
            employeeRole ===
              "SUPER_ADMIN" ||
            employeeRole ===
              "SUPERADMIN"
          ) {
            return false;
          }
        }


        if (!isGym) {
          return true;
        }


        if (
          filterType ===
          "staff"
        ) {
          return !isTrainerRole(
            employee
          );
        }


        if (
          filterType ===
          "trainers"
        ) {
          return isTrainerRole(
            employee
          );
        }


        return true;
      }
    );


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className={styles.layout}>

      <div className={styles.container}>

        <div className={styles.content}>

          {/* =================================================
              TOASTER
          ================================================= */}

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
            }}
          />


          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div
            className={
              styles.header
            }
          >

            <div>

              <h1
                className={
                  styles.title
                }
              >
                {pageTitle}
              </h1>


              <p
                className={
                  styles.subtitle
                }
              >
                {pageSub}
              </p>

            </div>


            <button
              type="button"
              className={
                styles.addButton
              }
              onClick={
                handleAddEmployee
              }
            >

              <Plus size={18} />

              {addBtnText}

            </button>

          </div>


          {/* =================================================
              GYM FILTER
          ================================================= */}

          {isGym && (
            <div
              className={
                styles.filterContainer
              }
            >

              <button
                type="button"
                className={`
                  ${styles.filterButton}
                  ${
                    filterType ===
                    "all"
                      ? styles.filterButtonActive
                      : ""
                  }
                `}
                onClick={() =>
                  setFilterType(
                    "all"
                  )
                }
              >
                All Employees
              </button>


              <button
                type="button"
                className={`
                  ${styles.filterButton}
                  ${
                    filterType ===
                    "staff"
                      ? styles.filterButtonActive
                      : ""
                  }
                `}
                onClick={() =>
                  setFilterType(
                    "staff"
                  )
                }
              >
                Staff Only
              </button>


              <button
                type="button"
                className={`
                  ${styles.filterButton}
                  ${
                    filterType ===
                    "trainers"
                      ? styles.filterButtonActive
                      : ""
                  }
                `}
                onClick={() =>
                  setFilterType(
                    "trainers"
                  )
                }
              >
                Trainers Only
              </button>

            </div>
          )}


          {/* =================================================
              EMPLOYEE GRID
          ================================================= */}

          <div
            className={
              styles.employeeGrid
            }
          >

            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
              <div
                className={
                  styles.loadingState
                }
              >

                <Loader2
                  size={38}
                  className={
                    styles.spinner
                  }
                />

                <p>
                  Loading employees...
                </p>

              </div>
            )}


            {/* =================================================
                NO EMPLOYEES
            ================================================= */}

            {!loading &&
              employees.length ===
                0 && (

                <div
                  className={
                    styles.emptyState
                  }
                >

                  <Users
                    className={
                      styles.emptyIcon
                    }
                  />

                  <h3>
                    No employees found
                  </h3>

                  <p>
                    Start by adding your
                    first employee.
                  </p>

                  <button
                    type="button"
                    className={
                      styles.emptyAddButton
                    }
                    onClick={
                      handleAddEmployee
                    }
                  >

                    <Plus size={17} />

                    Add Employee

                  </button>

                </div>
              )}


            {/* =================================================
                FILTER EMPTY
            ================================================= */}

            {!loading &&
              employees.length >
                0 &&
              displayedEmployees.length ===
                0 && (

                <div
                  className={
                    styles.emptyState
                  }
                >

                  <Users
                    className={
                      styles.emptyIcon
                    }
                  />

                  <h3>
                    No employees match
                    this filter
                  </h3>

                  <p>
                    Try switching to
                    another filter tab.
                  </p>

                </div>
              )}


            {/* =================================================
                EMPLOYEE CARDS
            ================================================= */}

            {!loading &&
              displayedEmployees.length >
                0 &&
              displayedEmployees.map(
                (employee) => {

                  const employeeName =
                    employee.fullName ||
                    "Unknown Employee";


                  const initials =
                    getInitials(
                      employeeName
                    );


                  const role =
                    getRoleName(
                      employee
                    );


                  const image =
                    getEmployeeImage(
                      employee
                    );


                  const employeeId =
                    employee.employeeId ||
                    "EMP-000";


                  const isVerified =
                    Boolean(
                      employee.isVerified
                    );


                  return (
                    <div
                      className={
                        styles.employeeCard
                      }
                      key={
                        employee.id
                      }
                    >

                      {/* =================================================
                          3D CARD INNER
                      ================================================= */}

                      <div
                        className={
                          styles.cardInner
                        }
                      >

                        {/* =================================================
                            FRONT
                        ================================================= */}

                        <div
                          className={`
                            ${styles.cardFace}
                            ${styles.cardFront}
                          `}
                        >

                          {/* Top Area */}

                          <div
                            className={
                              styles.frontTop
                            }
                          >

                            <div
                              className={
                                styles.companyLogo
                              }
                            >

                              {logoUrl ? (
                                <img
                                  src={
                                    logoUrl
                                  }
                                  alt={
                                    settings?.companyName ||
                                    "Company Logo"
                                  }
                                />
                              ) : (
                                (
                                  settings?.companyName ||
                                  "ERP"
                                )
                                  .substring(
                                    0,
                                    2
                                  )
                                  .toUpperCase()
                              )}

                            </div>


                            <span
                              className={
                                styles.frontLabel
                              }
                            >
                              EMPLOYEE
                            </span>

                          </div>


                          {/* =================================================
                              EMPLOYEE PHOTO
                          ================================================= */}

                          <div
                            className={
                              styles.photoWrapper
                            }
                          >

                            {image ? (

                              <img
                                src={
                                  image
                                }
                                alt={
                                  employeeName
                                }
                                className={
                                  styles.employeePhoto
                                }
                              />

                            ) : (

                              <div
                                className={
                                  styles.initialAvatar
                                }
                              >
                                {initials}
                              </div>

                            )}

                          </div>


                          {/* =================================================
                              NAME
                          ================================================= */}

                          <div
                            className={
                              styles.frontName
                            }
                          >

                            <h2>
                              {employeeName}
                            </h2>

                            <p>
                              {role}
                            </p>

                          </div>


                          {/* =================================================
                              FLIP HINT
                          ================================================= */}

                          <div
                            className={
                              styles.flipHint
                            }
                          >
                            <span>
                              Hover to view details
                            </span>
                          </div>

                        </div>


                        {/* =================================================
                            BACK
                        ================================================= */}

                        <div
                          className={`
                            ${styles.cardFace}
                            ${styles.cardBack}
                          `}
                        >

                          {/* =================================================
                              BACK HEADER
                          ================================================= */}

                          <div
                            className={
                              styles.backHeader
                            }
                          >

                            <div
                              className={
                                styles.backBrand
                              }
                            >

                              {logoUrl ? (

                                <img
                                  src={
                                    logoUrl
                                  }
                                  alt={
                                    settings?.companyName ||
                                    "Company Logo"
                                  }
                                />

                              ) : (

                                (
                                  settings?.companyName ||
                                  "ERP"
                                )
                                  .substring(
                                    0,
                                    2
                                  )
                                  .toUpperCase()

                              )}

                            </div>


                            <span
                              className={
                                styles.cardType
                              }
                            >
                              EMPLOYEE PROFILE
                            </span>

                          </div>


                          {/* =================================================
                              EMPLOYEE NAME
                          ================================================= */}

                          <div
                            className={
                              styles.backName
                            }
                          >

                            <h2>
                              {employeeName}
                            </h2>

                            <p>
                              {role}
                            </p>

                          </div>


                          {/* =================================================
                              DETAILS
                          ================================================= */}

                          <div
                            className={
                              styles.detailsList
                            }
                          >

                            {/* EMPLOYEE ID */}

                            <div
                              className={
                                styles.detailRow
                              }
                            >

                              <div
                                className={
                                  styles.detailLabel
                                }
                              >

                                <CreditCard
                                  size={13}
                                />

                                <span>
                                  Employee ID
                                </span>

                              </div>


                              <strong>
                                {employeeId}
                              </strong>

                            </div>


                            {/* EMAIL */}

                            <div
                              className={
                                styles.detailRow
                              }
                            >

                              <div
                                className={
                                  styles.detailLabel
                                }
                              >

                                <Mail
                                  size={13}
                                />

                                <span>
                                  Email
                                </span>

                              </div>


                              <strong
                                title={
                                  employee.email ||
                                  "N/A"
                                }
                              >
                                {employee.email ||
                                  "N/A"}
                              </strong>

                            </div>


                            {/* PHONE */}

                            <div
                              className={
                                styles.detailRow
                              }
                            >

                              <div
                                className={
                                  styles.detailLabel
                                }
                              >

                                <Phone
                                  size={13}
                                />

                                <span>
                                  Phone
                                </span>

                              </div>


                              <strong>
                                {employee.phone ||
                                  "N/A"}
                              </strong>

                            </div>


                            {/* BRANCH */}

                            <div
                              className={
                                styles.detailRow
                              }
                            >

                              <div
                                className={
                                  styles.detailLabel
                                }
                              >

                                <Building2
                                  size={13}
                                />

                                <span>
                                  {isTextile
                                    ? "Manufacturing Unit"
                                    : isRestaurant
                                    ? "Outlet"
                                    : "Branch"}
                                </span>

                              </div>


                              <strong
                                title={
                                  employee
                                    .branch
                                    ?.name ||
                                  "N/A"
                                }
                              >
                                {employee
                                  .branch
                                  ?.name ||
                                  "N/A"}
                              </strong>

                            </div>

                          </div>


                          {/* =================================================
                              BACK FOOTER
                          ================================================= */}

                          <div
                            className={
                              styles.backFooter
                            }
                          >

                            {/* VERIFICATION */}

                            <span
                              className={`
                                ${styles.status}
                                ${
                                  isVerified
                                    ? styles.statusVerified
                                    : styles.statusPending
                                }
                              `}
                            >

                              <span
                                className={
                                  styles.statusDot
                                }
                              />

                              {isVerified
                                ? "Verified"
                                : "Pending"}

                            </span>


                            {/* ACTIONS */}

                            <div
                              className={
                                styles.cardActions
                              }
                            >

                                {/* VIEW DETAILS */}
                                <button
                                  type="button"
                                  className={styles.editButton}
                                  style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (isTextile) {
                                      router.push(`/textile/employees/${employee.id}`);
                                    } else {
                                      handleEditEmployee(employee);
                                    }
                                  }}
                                  title="View Full Profile"
                                  aria-label="View Full Profile"
                                >
                                  <Eye size={14} />
                                </button>

                              {/* EDIT */}

                              <button
                                type="button"
                                className={
                                  styles.editButton
                                }
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  handleEditEmployee(
                                    employee
                                  );
                                }}
                                title="Edit Employee"
                                aria-label="Edit Employee"
                              >

                                <Edit2
                                  size={14}
                                />

                              </button>


                              {/* DELETE */}

                              <button
                                type="button"
                                className={
                                  styles.deleteButton
                                }
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  handleDeleteEmployee(
                                    employee.id
                                  );
                                }}
                                title="Delete Employee"
                                aria-label="Delete Employee"
                              >

                                <Trash2
                                  size={14}
                                />

                              </button>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

          </div>


          {/* =================================================
              EDIT EMPLOYEE MODAL
          ================================================= */}

          {isModalOpen && (

            <div
              className={
                styles.modalOverlay
              }
              onClick={closeModal}
            >

              <div
                className={
                  styles.modalContent
                }
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                {/* =================================================
                    MODAL HEADER
                ================================================= */}

                <div
                  className={
                    styles.modalHeader
                  }
                >

                  <div>

                    <h2
                      className={
                        styles.modalTitle
                      }
                    >
                      Edit Employee
                    </h2>

                    <p
                      className={
                        styles.modalSubtitle
                      }
                    >
                      Update employee information
                    </p>

                  </div>


                  <button
                    type="button"
                    className={
                      styles.closeButton
                    }
                    onClick={
                      closeModal
                    }
                    disabled={
                      submitting
                    }
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>

                </div>


                {/* =================================================
                    FORM
                ================================================= */}

                <form
                  onSubmit={
                    handleSubmit
                  }
                  noValidate
                >

                  {/* FULL NAME */}

                  <div
                    className={
                      styles.formGroup
                    }
                  >

                    <label
                      className={
                        styles.label
                      }
                      htmlFor="fullName"
                    >
                      Full Name
                    </label>


                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      value={
                        formData.fullName
                      }
                      onChange={
                        handleInputChange
                      }
                      className={
                        styles.input
                      }
                      placeholder="Enter full name"
                      style={
                        errors.fullName
                          ? {
                              borderColor:
                                "#ef4444",
                            }
                          : {}
                      }
                    />


                    {errors.fullName && (
                      <span
                        style={{
                          color:
                            "#ef4444",
                          fontSize:
                            "12px",
                          marginTop:
                            "4px",
                          display:
                            "block",
                        }}
                      >
                        {
                          errors.fullName
                        }
                      </span>
                    )}

                  </div>


                  {/* EMPLOYEE ID */}

                  <div
                    className={
                      styles.formGroup
                    }
                  >

                    <label
                      className={
                        styles.label
                      }
                      htmlFor="employeeId"
                    >
                      Employee ID
                    </label>


                    <input
                      id="employeeId"
                      type="text"
                      name="employeeId"
                      value={
                        formData.employeeId
                      }
                      onChange={
                        handleInputChange
                      }
                      className={
                        styles.input
                      }
                      placeholder="EMP-001"
                      style={
                        errors.employeeId
                          ? {
                              borderColor:
                                "#ef4444",
                            }
                          : {}
                      }
                    />


                    {errors.employeeId && (
                      <span
                        style={{
                          color:
                            "#ef4444",
                          fontSize:
                            "12px",
                          marginTop:
                            "4px",
                          display:
                            "block",
                        }}
                      >
                        {
                          errors.employeeId
                        }
                      </span>
                    )}

                  </div>


                  {/* ROLE */}

                  <div
                    className={
                      styles.formGroup
                    }
                  >

                    <label
                      className={
                        styles.label
                      }
                      htmlFor="role"
                    >
                      Role
                    </label>


                    <select
                      id="role"
                      name="role"
                      value={
                        formData.role
                      }
                      onChange={
                        handleInputChange
                      }
                      className={
                        styles.input
                      }
                      style={
                        errors.role
                          ? {
                              borderColor:
                                "#ef4444",
                            }
                          : {}
                      }
                    >

                      <option value="">
                        Select Role
                      </option>


                      {roles.length >
                      0 ? (

                        roles.map(
                          (role) => (
                            <option
                              key={
                                role.id
                              }
                              value={
                                role.name
                              }
                            >
                              {
                                role.name
                              }
                            </option>
                          )
                        )

                      ) : (

                        <>
                          <option value="Admin">
                            Admin
                          </option>

                          <option value="Manager">
                            Manager
                          </option>

                          <option value="HR">
                            HR
                          </option>
                        </>

                      )}

                    </select>


                    {errors.role && (
                      <span
                        style={{
                          color:
                            "#ef4444",
                          fontSize:
                            "12px",
                          marginTop:
                            "4px",
                          display:
                            "block",
                        }}
                      >
                        {
                          errors.role
                        }
                      </span>
                    )}

                  </div>


                  {/* BRANCH / OUTLET */}

                  <div
                    className={
                      styles.formGroup
                    }
                  >

                    <label
                      className={
                        styles.label
                      }
                      htmlFor="branchId"
                    >
                      {isTextile
                        ? "Manufacturing Unit"
                        : isRestaurant
                        ? "Outlet"
                        : "Branch"}
                    </label>


                    <select
                      id="branchId"
                      name="branchId"
                      value={
                        formData.branchId
                      }
                      onChange={
                        handleInputChange
                      }
                      className={
                        styles.input
                      }
                      style={
                        errors.branchId
                          ? {
                              borderColor:
                                "#ef4444",
                            }
                          : {}
                      }
                    >

                      <option value="">
                        {isTextile
                          ? "Select Manufacturing Unit"
                          : isRestaurant
                          ? "Select Outlet"
                          : "Select Branch"}
                      </option>
                      {isTextile && formData.role === "Admin" && (
                        <option value="ALL">All Manufacturing Units / General Office</option>
                      )}

                      {branches.length >
                      0 ? (

                        branches.map(
                          (branch) => (
                            <option
                              key={
                                branch.id
                              }
                              value={
                                branch.id
                              }
                            >
                              {
                                branch.name
                              }
                            </option>
                          )
                        )

                      ) : (

                        <option
                          value=""
                          disabled
                        >
                          {isTextile
                            ? "No Manufacturing Units found"
                            : isRestaurant
                            ? "No outlets available"
                            : "No branches available"}
                        </option>

                      )}

                    </select>


                    {errors.branchId && (
                      <span
                        style={{
                          color:
                            "#ef4444",
                          fontSize:
                            "12px",
                          marginTop:
                            "4px",
                          display:
                            "block",
                        }}
                      >
                        {
                          errors.branchId
                        }
                      </span>
                    )}

                  </div>


                  {/* EMAIL */}

                  <div
                    className={
                      styles.formGroup
                    }
                  >

                    <label
                      className={
                        styles.label
                      }
                      htmlFor="email"
                    >
                      Email Address
                    </label>


                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleInputChange
                      }
                      className={
                        styles.input
                      }
                      placeholder="employee@example.com"
                      style={
                        errors.email
                          ? {
                              borderColor:
                                "#ef4444",
                            }
                          : {}
                      }
                    />


                    {errors.email && (
                      <span
                        style={{
                          color:
                            "#ef4444",
                          fontSize:
                            "12px",
                          marginTop:
                            "4px",
                          display:
                            "block",
                        }}
                      >
                        {
                          errors.email
                        }
                      </span>
                    )}

                  </div>


                  {/* PHONE */}

                  <div
                    className={
                      styles.formGroup
                    }
                  >

                    <label
                      className={
                        styles.label
                      }
                      htmlFor="phone"
                    >
                      Phone Number
                    </label>


                    <input
                      id="phone"
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
                      <span
                        style={{
                          color:
                            "#ef4444",
                          fontSize:
                            "12px",
                          marginTop:
                            "4px",
                          display:
                            "block",
                        }}
                      >
                        {
                          errors.phone
                        }
                      </span>
                    )}

                  </div>


                  {/* =================================================
                      MODULE ACCESS PERMISSIONS / AUTOMATIC ROLE PERMISSIONS
                  ================================================= */}

                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "16px",
                      borderTop: "1px solid #334155",
                    }}
                  >
                    {isTextile ? (
                      <div>
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#f8fafc",
                            marginBottom: "4px",
                          }}
                        >
                          Automatic Role Permissions
                        </h3>

                        <div style={{ padding: "14px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", marginTop: "8px" }}>
                          <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 10px 0" }}>
                            Access is automatically assigned based on role: <strong style={{ color: "#0d9488" }}>{formData.role}</strong>
                          </p>

                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(normalizeTextileRole(formData.role) === "ADMIN" || formData.role === "Admin") && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Full Textile ERP Operational & Administrative Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Textile Products, Raw Materials, Suppliers, Customers, Purchase Management, Production Management, Inventory Stock, Stock Movements, Warehouses, Quality Control, Manufacturing Units, Fabric Sales, Export Management, Units of Measure, Employees / Staff, Reports & Analytics</div>
                              </>
                            )}
                            {normalizeTextileRole(formData.role) === "MANAGER" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Textile Management & Operations Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Textile Products, Raw Materials, Suppliers, Customers, Purchase Management, Production Management, Inventory Stock, Stock Movements, Warehouses, Quality Control, Manufacturing Units, Fabric Sales, Export Management, Reports & Analytics</div>
                                <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "2px" }}>✗ Restricted: Employees / Staff, Global Company Settings, Role Management</div>
                              </>
                            )}
                            {normalizeTextileRole(formData.role) === "WEAVER" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Weaver Production Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Production Management (Assigned Production Orders, Production Tracking, Loom Weaving Operations, Assigned Material Details)</div>
                                <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "2px" }}>✗ Restricted: Products setup, Raw Materials master, Suppliers, Customers, Purchases, Warehouses, Quality Control, Sales, Exports, Employees, Financial Reports</div>
                              </>
                            )}
                            {normalizeTextileRole(formData.role) === "DYER" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Dyer Production Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Production Management (Assigned Production Orders, Production Tracking, Dyeing & Washing Stage, Assigned Material Details)</div>
                                <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "2px" }}>✗ Restricted: Products setup, Raw Materials master, Suppliers, Customers, Purchases, Warehouses, Quality Control, Sales, Exports, Employees, Financial Reports</div>
                              </>
                            )}
                            {normalizeTextileRole(formData.role) === "QUALITY_INSPECTOR" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Quality Inspector Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Quality Control (Inspections, Defect Grading, QC Logs & Approvals), Assigned Production Tracking</div>
                                <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "2px" }}>✗ Restricted: Products setup, Raw Materials, Suppliers, Customers, Purchases, Sales, Exports, Employees, Financial Reports</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : isLaundry ? (
                      <div>
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#f8fafc",
                            marginBottom: "4px",
                          }}
                        >
                          Automatic Role Permissions
                        </h3>

                        <div style={{ padding: "14px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", marginTop: "8px" }}>
                          <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 10px 0" }}>
                            Access is automatically assigned based on role: <strong style={{ color: "#6366f1" }}>{formData.role}</strong>
                          </p>

                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(formData.role === "Manager" || formData.role === "Admin") && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Full Laundry ERP Operational & Management Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Laundry POS, Active Orders, Outlets & Branches, Services & Categories, Garment Tracking, Processing Queue, Ready Orders, Pickup & Deliveries, Customers, Employees & Staff, Laundry Reports</div>
                              </>
                            )}
                            {formData.role === "Cashier" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Cashier POS & Billing Operations</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Laundry POS, Active Orders, Customers, Pickup / Deliveries</div>
                                <div style={{ color: "#ef4444", fontSize: "11px" }}>✗ Restricted: Outlets & Branches, Services & Categories, Employees / Staff, Laundry Reports</div>
                              </>
                            )}
                            {formData.role === "Processing Staff" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Laundry Processing Operations</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Active Orders, Garment Tracking & Barcode Scan, Processing Queue, Ready Orders</div>
                                <div style={{ color: "#ef4444", fontSize: "11px" }}>✗ Restricted: Laundry POS, Services & Categories, Outlets, Employees / Staff, Reports, Customers</div>
                              </>
                            )}
                            {formData.role === "Delivery Driver" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Delivery & Dispatch Operations</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Ready Orders, Pickup / Deliveries</div>
                                <div style={{ color: "#ef4444", fontSize: "11px" }}>✗ Restricted: Laundry POS, Active Orders, Processing Queue, Garment Tracking, Services, Outlets, Employees, Reports</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : isRetail ? (
                      <div>
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#f8fafc",
                            marginBottom: "4px",
                          }}
                        >
                          Automatic Role Permissions
                        </h3>

                        <div style={{ padding: "14px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", marginTop: "8px" }}>
                          <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 10px 0" }}>
                            Access is automatically assigned based on role: <strong style={{ color: "#6366f1" }}>{formData.role}</strong>
                          </p>

                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(normalizeRetailRole(formData.role) === "STORE_MANAGER" || formData.role === "Manager" || formData.role === "Admin") && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Full Store Operational Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, POS Terminal, Barcode Printing, Products, Categories, Brands, Warehouse Management, Customers, Suppliers, Purchases, Sales Orders, Invoices, Store Outlets & Branches, Employees / Staff, Reports & Analytics</div>
                              </>
                            )}
                            {normalizeRetailRole(formData.role) === "CASHIER" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Cashier Billing & Terminal Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, POS Terminal, Customers, Barcode Printing, Invoices / Receipts</div>
                                <div style={{ color: "#ef4444", fontSize: "11px" }}>✗ Restricted: Products, Categories, Brands, Warehouse, Suppliers, Purchases, Employees, Reports</div>
                              </>
                            )}
                            {normalizeRetailRole(formData.role) === "INVENTORY_MANAGER" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Inventory & Stock Tracking Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Products Setup, Categories, Brands, Barcode Printing, Warehouse Management</div>
                                <div style={{ color: "#ef4444", fontSize: "11px" }}>✗ Restricted: POS, Purchases, Sales Orders, Invoices, Employees, Reports</div>
                              </>
                            )}
                            {normalizeRetailRole(formData.role) === "PURCHASE_MANAGER" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Purchasing & Vendor Management Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, Products, Categories, Brands, Suppliers, Purchases, Warehouse Management</div>
                                <div style={{ color: "#ef4444", fontSize: "11px" }}>✗ Restricted: POS, Sales Orders, Invoices, Employees, Reports</div>
                              </>
                            )}
                            {normalizeRetailRole(formData.role) === "ACCOUNTANT" && (
                              <>
                                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>✓ Financial Accounting & Audit Access</div>
                                <div style={{ color: "#cbd5e1", fontSize: "11px" }}>Dashboard, POS Sales History (view-only), Sales Orders, Invoices, Purchases (view), Customers (view), Suppliers (view), Reports & Analytics</div>
                                <div style={{ color: "#ef4444", fontSize: "11px" }}>✗ Restricted: Operational POS Terminal, Barcode Printing, Product setup, Categories, Brands, Warehouse, Employees, Store Settings</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#f8fafc",
                            marginBottom: "4px",
                          }}
                        >
                          Module Access Permissions
                        </h3>

                        <p
                          style={{
                            fontSize: "12px",
                            color: "#94a3b8",
                            marginBottom: "12px",
                          }}
                        >
                          Select which modules this employee can access.
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: "8px",
                          }}
                        >
                          {availableModules.map((module) => {
                            const isSelected = selectedModules.includes(module.code);

                            return (
                              <label
                                key={module.code}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "8px 10px",
                                  borderRadius: "6px",
                                  backgroundColor: isSelected ? "rgba(79, 70, 229, 0.1)" : "#1e293b",
                                  border: `1px solid ${isSelected ? "#4f46e5" : "#334155"}`,
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  color: "#f8fafc",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleModuleToggle(module.code)}
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    accentColor: "#4f46e5",
                                  }}
                                />
                                <span>{module.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>


                  {/* =================================================
                      FORM ACTIONS
                  ================================================= */}

                  <div
                    className={
                      styles.formActions
                    }
                  >

                    <button
                      type="button"
                      className={
                        styles.cancelButton
                      }
                      onClick={
                        closeModal
                      }
                      disabled={
                        submitting
                      }
                    >
                      Cancel
                    </button>


                    <button
                      type="submit"
                      className={
                        styles.submitButton
                      }
                      disabled={
                        submitting
                      }
                    >

                      {submitting ? (

                        <>
                          <Loader2
                            size={16}
                            className={
                              styles.buttonSpinner
                            }
                          />

                          Saving...
                        </>

                      ) : (

                        "Save Changes"

                      )}

                    </button>

                  </div>

                </form>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}