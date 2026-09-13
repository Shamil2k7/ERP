
"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiBriefcase,
} from "react-icons/fi";
import { useSettings } from "@/context/SettingsContext";
import { useAlert } from "@/context/AlertContext";
import styles from "./LoginForm.module.css";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";


export default function LoginForm() {
  const { settings, logoUrl } = useSettings();
  const { showSuccess } = useAlert();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    login: "",
    password: "",
    remember: false,
  });

  const [fieldErrors, setFieldErrors] = useState({
    login: "",
    password: "",
  });

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    const errors = {
      login: "",
      password: "",
    };

    const login = formData.login.trim();
    const password = formData.password;

    // Login validation
    if (!login) {
      errors.login = "Email or Employee ID is required";
    } else if (
      login.includes("@") &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)
    ) {
      errors.login = "Enter a valid email address";
    }

    // Password validation
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password =
        "Password must be at least 6 characters";
    }

    setFieldErrors(errors);

    return !errors.login && !errors.password;
  };

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked : value,
    }));

    // Remove field error while typing
    if (name === "login" || name === "password") {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Remove API error while typing
    setError("");
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Stop if validation fails
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/auth/login`,
        {
          login: formData.login.trim(),
          password: formData.password,
        }
      );

      const data = response.data;

      if (!data.success && !data.token) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      /* =====================================================
         CLEAR PREVIOUS SESSION OVERRIDES
      ===================================================== */

      localStorage.removeItem("industryOverride");
      localStorage.removeItem("companyOverride");
      localStorage.removeItem("branchOverride");

      /* =====================================================
         SAVE TOKEN
      ===================================================== */

      localStorage.setItem(
        "token",
        data.token
      );

      /* =====================================================
         SAVE USER
      ===================================================== */

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      /* =====================================================
         SAVE COMPANY
      ===================================================== */

      if (data.company) {
        localStorage.setItem(
          "company",
          JSON.stringify(data.company)
        );
      }

      /* =====================================================
         SAVE MODULES
      ===================================================== */

      if (data.modules) {
        localStorage.setItem(
          "modules",
          JSON.stringify(data.modules)
        );
      }

      /* =====================================================
         SAVE PERMISSIONS
      ===================================================== */

      if (data.permissions) {
        localStorage.setItem(
          "permissions",
          JSON.stringify(data.permissions)
        );
      }

      window.dispatchEvent(
        new Event("user-updated")
      );

      /* =====================================================
         SUCCESS MESSAGE
      ===================================================== */

      showSuccess(
        "Login Successful",
        "User logged in successfully! Redirecting..."
      );

      /* =====================================================
         ROLE / USER TYPE
      ===================================================== */

      const userRole = (
        data.user?.role || ""
      ).toUpperCase();

      const userType = (
        data.user?.type ||
        data.company?.industry?.code ||
        ""
      ).toUpperCase();

      /* =====================================================
         REDIRECT
      ===================================================== */

      if (userRole.includes("SUPER")) {
        window.location.href =
          "/admin/superadmin-dashboard";
      } else if (
        userType.includes("RESTAURANT")
      ) {
        // Waiter / Steward / Server
        if (
          userRole.includes("WAITER") ||
          userRole.includes("STEWARD") ||
          userRole.includes("SERVER")
        ) {
          window.location.href =
            "/restaurant/pos";
        }

        // Kitchen / Chef / Cook
        else if (
          userRole.includes("KITCHEN") ||
          userRole.includes("CHEF") ||
          userRole.includes("COOK")
        ) {
          window.location.href =
            "/restaurant/kitchen";
        }

        // Cashier
        else if (
          userRole.includes("CASHIER")
        ) {
          window.location.href =
            "/restaurant/pos";
        }

        // Restaurant admin / manager
        else {
          window.location.href =
            "/restaurant/dashboard";
        }
      } else if (userType.includes("LAUNDRY")) {
        if (userRole.includes("CASHIER") || userRole.includes("BILLING") || userRole.includes("COUNTER") || userRole.includes("POS")) {
          window.location.href = "/laundry/pos";
        } else if (userRole.includes("DELIVERY") || userRole.includes("DRIVER") || userRole.includes("RIDER")) {
          window.location.href = "/laundry/delivery";
        } else if (userRole.includes("PROCESS") || userRole.includes("WASHER") || userRole.includes("STAFF") || userRole.includes("IRON")) {
          window.location.href = "/laundry/orders";
        } else {
          window.location.href = "/laundry/dashboard";
        }
      } else if (userRole.includes("CASHIER")) {
        window.location.href = "/pos";
      } else {
        window.location.href = "/dashboard";
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        {/* HEADER */}
        <div className={styles.header}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={
                settings?.companyName ||
                "Company Logo"
              }
              style={{
                maxHeight: "60px",
                maxWidth: "200px",
                objectFit: "contain",
                marginBottom: "12px",
              }}
            />
          ) : null}

          <h1>Welcome Back</h1>

          <p>
            Sign in to your{" "}
            {settings?.companyName ||
              "ERP Suite"}{" "}
            account.
          </p>
        </div>

        {/* API ERROR */}
        {error && (
          <div
            className={styles.errorMessage}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
        >

          {/* =================================================
              EMAIL / EMPLOYEE ID
          ================================================= */}

          <div className={styles.formGroup}>
            <label
              className={styles.label}
              htmlFor="login"
            >
              Email / Employee ID
            </label>

            <div
              className={`${styles.inputGroup} ${
                fieldErrors.login
                  ? styles.inputError
                  : ""
              }`}
            >
              {formData.login.includes("@") ? (
                <FiMail />
              ) : (
                <FiBriefcase />
              )}

              <input
                id="login"
                type="text"
                name="login"
                placeholder="admin@company.com, ADM-001"
                value={formData.login}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            {fieldErrors.login && (
              <span className={styles.fieldError}>
                {fieldErrors.login}
              </span>
            )}
          </div>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className={styles.formGroup}>
            <label
              className={styles.label}
              htmlFor="password"
            >
              Password
            </label>

            <div
              className={`${styles.inputGroup} ${
                fieldErrors.password
                  ? styles.inputError
                  : ""
              }`}
            >
              <FiLock />

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />

              <button
                type="button"
                className={styles.eye}
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <FiEyeOff />
                ) : (
                  <FiEye />
                )}
              </button>
            </div>

            {fieldErrors.password && (
              <span className={styles.fieldError}>
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* =================================================
              OPTIONS
          ================================================= */}

          <div className={styles.options}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
              />

              <span>Remember Me</span>
            </label>

            <Link href="/auth/forgot-password">
              Forgot Password?
            </Link>
          </div>

          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <button
            className={styles.loginBtn}
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  );
}
