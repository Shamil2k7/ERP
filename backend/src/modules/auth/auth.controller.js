import {
  loginService,
  changePasswordService,
  changeEmailService,
  forgotPasswordService,
  verifyResetOTPService,
  resetPasswordService,
  getMeService,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  signupService,
} from "./auth.service.js";
import { recordAuditLog } from "../audit/audit.service.js";

// Login
const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    const result = await loginService(login, password);

    if (result.success && result.user) {
      if (result.token) {
        res.cookie("token", result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      const timeStr = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      await recordAuditLog(req, {
        action: "LOGIN",
        entity: "Employee",
        entityId: result.user.id,
        user: result.user,
        details: {
          fullName: result.user.fullName,
          email: result.user.email,
          employeeId: result.user.employeeId,
          role: result.user.role,
          description: `Employee logged in at ${timeStr}`,
        },
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};


// Change Password
const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    const result = await changePasswordService(
      email,
      currentPassword,
      newPassword
    );

    recordAuditLog(req, {
      action: "UPDATE",
      entity: "Employee",
      user: req.user || { email },
      details: {
        email,
        description: `Employee changed password`,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await forgotPasswordService(email);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify Reset OTP
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyResetOTPService(email, otp);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await resetPasswordService(email, password);

    recordAuditLog(req, {
      action: "UPDATE",
      entity: "Employee",
      user: req.user || { email },
      details: {
        email,
        description: `Employee reset password`,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Change Email
const changeEmail = async (req, res) => {
  try {
    const { currentEmail, password, newEmail } = req.body;

    const result = await changeEmailService(
      currentEmail,
      password,
      newEmail
    );

    recordAuditLog(req, {
      action: "UPDATE",
      entity: "Employee",
      user: req.user || { email: currentEmail },
      details: {
        currentEmail,
        newEmail,
        description: `Employee changed email`,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current logged-in user profile (JWT protected)
const getMe = async (req, res) => {
  try {
    const result = await getMeService(req.user);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout (clears JWT cookie)
const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Send OTP for user registration
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await sendRegistrationOTP(email);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify OTP for user registration
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyRegistrationOTP(email, otp);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Signup / Register New Account
const signup = async (req, res) => {
  try {
    const { email, phone, password, employeeId, fullName } = req.body;
    const result = await signupService({
      email,
      phone,
      password,
      employeeId,
      fullName,
    });

    if (result.token) {
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  login,
  logout,
  getMe,
  sendOTP,
  verifyOTP,
  signup,
  changePassword,
  changeEmail,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
};