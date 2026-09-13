"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./ForgotPasswordForm.module.css";
import { useAlert } from "@/context/AlertContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ForgotPasswordForm() {
  const { showSuccess } = useAlert();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/auth/forgot-password`, { email });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to send OTP");
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/auth/verify-reset-otp`, { email, otp });
      if (!response.data.success) {
        throw new Error(response.data.message || "Invalid OTP");
      }
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/reset-password`, { email, password });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to reset password");
      }

      showSuccess("Password Reset", "Password reset successfully! Redirecting to login...");
      window.location.href = "/auth/login";
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Reset Password</h1>
          <p>
            {step === 1 && "Enter your email to receive a reset OTP."}
            {step === 2 && "Enter the OTP sent to your email."}
            {step === 3 && "Create a new secure password."}
          </p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {step === 1 && (
          <form className={styles.form} onSubmit={handleRequestOTP}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputGroup}>
                <FiMail />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className={styles.form} onSubmit={handleVerifyOTP}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Enter OTP</label>
              <div className={styles.inputGroup}>
                <FiLock />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <p className={styles.otpMessage}>
                OTP sent to {email}
              </p>
            </div>
            
            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button 
              type="button" 
              className={styles.backBtn} 
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}

        {step === 3 && (
          <form className={styles.form} onSubmit={handleResetPassword}>
            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <div className={styles.inputGroup}>
                <FiLock />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eye}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <div className={styles.inputGroup}>
                <FiLock />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eye}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <p>
            Remember your password?{" "}
            <Link href="/auth/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
