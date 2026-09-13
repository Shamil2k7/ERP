import apiClient from "./apiClient";

export const authService = {
  /**
   * Log in user with identifier and password
   * @param {string} login
   * @param {string} password
   */
  login: async (login, password) => {
    const response = await apiClient.post("/auth/login", {
      login: login.trim(),
      password,
    });
    if (response.data?.token && typeof window !== "undefined") {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  /**
   * Log out user, clear cookie and local storage
   */
  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("company");
        localStorage.removeItem("modules");
        localStorage.removeItem("permissions");
      }
    }
  },

  /**
   * Fetch current authenticated user profile using JWT token
   */
  getMe: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  /**
   * Send OTP for account registration
   * @param {string} email
   */
  sendOtp: async (email) => {
    const response = await apiClient.post("/auth/send-otp", { email });
    return response.data;
  },

  /**
   * Verify registration OTP
   * @param {string} email
   * @param {string} otp
   */
  verifyOtp: async (email, otp) => {
    const response = await apiClient.post("/auth/verify-otp", { email, otp });
    return response.data;
  },

  /**
   * Complete new account registration
   * @param {object} payload - { email, phone, password, employeeId, fullName }
   */
  signup: async (payload) => {
    const response = await apiClient.post("/auth/signup", payload);
    if (response.data?.token && typeof window !== "undefined") {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  /**
   * Change password for logged-in user
   * @param {string} email
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  changePassword: async (email, currentPassword, newPassword) => {
    const response = await apiClient.post("/auth/change-password", {
      email,
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Request OTP for forgotten password
   * @param {string} email
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  /**
   * Verify password reset OTP
   * @param {string} email
   * @param {string} otp
   */
  verifyResetOtp: async (email, otp) => {
    const response = await apiClient.post("/auth/verify-reset-otp", { email, otp });
    return response.data;
  },

  /**
   * Set new password after verifying reset OTP
   * @param {string} email
   * @param {string} password
   */
  resetPassword: async (email, password) => {
    const response = await apiClient.post("/auth/reset-password", { email, password });
    return response.data;
  },

  /**
   * Get stored JWT token
   * @returns {string|null}
   */
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  },

  /**
   * Check if user is currently authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("token");
    }
    return false;
  },
};

export default authService;
