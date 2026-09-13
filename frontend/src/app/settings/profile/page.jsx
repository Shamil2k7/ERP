"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Mail,
  User,
} from "lucide-react";
import styles from "./profile.module.css";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth`;

/* ─── tiny helpers ─── */
function Alert({ type, msg }) {
  if (!msg) return null;
  return (
    <div className={`${styles.alert} ${type === "success" ? styles.alertSuccess : styles.alertError}`}>
      {type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      <span>{msg}</span>
    </div>
  );
}

function PasswordInput({ id, name, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.inputWrapper}>
      <Lock size={15} className={styles.inputIcon} />
      <input
        id={id}
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={styles.input}
        style={{ paddingRight: "2.6rem" }}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94a3b8",
          padding: 0,
          display: "flex",
        }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

/* ─── Change Password Card ─── */
function ChangePasswordCard() {
  const [form, setForm] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, msg: "" });

  const handle = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, msg: "" });

    if (form.newPassword !== form.confirmPassword) {
      setStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }
    if (form.newPassword.length < 6) {
      setStatus({ type: "error", msg: "New password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/change-password`, {
        email: form.email.trim().toLowerCase(),
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setStatus({ type: "success", msg: res.data.message || "Password changed successfully!" });
      setForm({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to change password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={`${styles.cardIcon} ${styles.purple}`}>
          <KeyRound size={18} />
        </div>
        <div>
          <p className={styles.cardTitle}>Change Password</p>
          <p className={styles.cardDesc}>Secure your account with a new password</p>
        </div>
      </div>

      <Alert type={status.type} msg={status.msg} />

      <form onSubmit={submit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="cp-email">
            Your Email Address
          </label>
          <div className={styles.inputWrapper}>
            <Mail size={15} className={styles.inputIcon} />
            <input
              id="cp-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handle}
              placeholder="you@example.com"
              className={styles.input}
              required
              autoComplete="username"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="cp-current">
            Current Password
          </label>
          <PasswordInput
            id="cp-current"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handle}
            placeholder="Enter current password"
          />
        </div>

        <div className={styles.divider} />

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="cp-new">
            New Password
          </label>
          <PasswordInput
            id="cp-new"
            name="newPassword"
            value={form.newPassword}
            onChange={handle}
            placeholder="Min. 6 characters"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="cp-confirm">
            Confirm New Password
          </label>
          <PasswordInput
            id="cp-confirm"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handle}
            placeholder="Repeat new password"
          />
        </div>

        <button
          type="submit"
          className={`${styles.submitBtn} ${styles.purple}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className={styles.spinner} />
              Saving…
            </>
          ) : (
            <>
              <KeyRound size={15} />
              Update Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}


/* ─── Page ─── */
export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse user in profile page", e);
    }
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getDisplayRole = (roleStr) => {
    if (!roleStr) return "Administrator";
    const r = roleStr.trim();
    if (r.toLowerCase() === "super_admin" || r.toLowerCase() === "super admin") return "Super Admin";
    if (r.toLowerCase() === "branch_manager" || r.toLowerCase() === "branch manager") return "Branch Manager";
    if (r.toLowerCase() === "inventory_manager" || r.toLowerCase() === "inventory manager") return "Inventory Manager";
    if (r.toLowerCase() === "cashier") return "Cashier";
    if (r.toLowerCase() === "admin") return "Admin";
    return r.charAt(0).toUpperCase() + r.slice(1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerIcon}>
            <User size={20} />
          </div>
          <h1 className={styles.title}>My Profile</h1>
        </div>
        <p className={styles.subtitle}>
          Manage your account profile details and security settings.
        </p>
      </div>

      <div className={styles.grid}>
        {/* User Info & Role Banner */}
        <div className={styles.profileInfoCard}>
          <div className={styles.profileAvatarGroup}>
            <div className={styles.largeAvatar}>
              {getInitials(user?.fullName || "User")}
            </div>
            <div className={styles.profileNameSection}>
              <h2>
                {user?.fullName || "Admin User"}
                <span className={styles.roleBadgeLarge}>
                  {getDisplayRole(user?.role)}
                </span>
              </h2>
              <div className={styles.profileMeta}>
                <span>📧 {user?.email || "user@erp.com"}</span>
                {user?.phone && <span>📞 {user.phone}</span>}
                {user?.employeeId && <span>🆔 ID: {user.employeeId}</span>}
              </div>
            </div>
          </div>
        </div>

        <ChangePasswordCard />
      </div>
    </div>
  );
}
