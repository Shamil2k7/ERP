
import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "EMAIL_USER or EMAIL_PASS is missing in the .env file."
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};


// Send employee login details
const sendEmployeeCredentialsEmail = async (
  email,
  employeeId,
  password,
  branchName = null
) => {
  try {
    const tx = getTransporter();

    const branchHtml = branchName
      ? `
            <p>
              <strong>Branch:</strong>
              ${branchName}
            </p>
      `
      : "";

    await tx.sendMail({
      from: `"ERP System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your ERP Employee Account",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 25px;
          border: 1px solid #ddd;
          border-radius: 10px;
        ">

          <h2 style="color: #2563eb;">
            Welcome to ERP System
          </h2>

          <p>
            Your employee account has been created by the administrator.
          </p>

          <p>
            You can use the following details to login:
          </p>

          <div style="
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          ">

            <p>
              <strong>Employee ID:</strong>
              ${employeeId}
            </p>

            <p>
              <strong>Email:</strong>
              ${email}
            </p>

            ${branchHtml}

            <p>
              <strong>Temporary Password:</strong>
              ${password}
            </p>

          </div>

          <p>
            You can login using either your
            <strong>Email</strong> or
            <strong>Employee ID</strong>.
          </p>

          <p style="color: #dc2626;">
            Please change your password after logging in.
          </p>

          <p>
            If you did not expect this account, please contact your
            administrator.
          </p>

          <p style="margin-top: 30px;">
            Regards,<br>
            <strong>ERP System</strong>
          </p>

        </div>
      `,
    });

    console.log("Employee credentials email sent");
  } catch (error) {
    console.error("Failed to send employee credentials email");
    console.error(error);

    throw error;
  }
};


// // Email Verification Link
// const sendVerificationEmail = async (email, token) => {
//   try {
//     const tx = getTransporter();

//     const verifyLink =
//       `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

//     const info = await tx.sendMail({
//       from: `"ERP System" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "Verify Your ERP Account",

//       html: `
//         <div style="font-family: Arial; padding:20px;">

//           <h2>Welcome to ERP System</h2>

//           <p>
//             Your employee account has been created by the administrator.
//           </p>

//           <p>
//             Please click the button below to verify your email address.
//           </p>

//           <a
//             href="${verifyLink}"
//             style="
//               background:#2563eb;
//               color:white;
//               padding:12px 20px;
//               text-decoration:none;
//               border-radius:5px;
//               display:inline-block;
//             "
//           >
//             Verify Email
//           </a>

//           <p style="margin-top:20px;">
//             This verification link will expire in 30 minutes.
//           </p>

//           <p>
//             If you didn't expect this email, you can safely ignore it.
//           </p>

//         </div>
//       `,
//     });

//     console.log("Verification Email Sent");
//     console.log(info.messageId);
//   } catch (error) {
//     console.error("Failed to send verification email");
//     console.error(error);

//     throw error;
//   }
// };


// Forgot Password OTP
const sendOTPEmail = async (email, otp) => {
  try {
    const tx = getTransporter();

    await tx.sendMail({
      from: `"ERP System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Password OTP",

      html: `
        <h2>Password Reset</h2>

        <p>Your OTP is</p>

        <h1>${otp}</h1>

        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    console.log("OTP Email Sent");
  } catch (error) {
    console.log(error);
    throw error;
  }
};


// Send employee update notification email
const sendEmployeeUpdatedEmail = async (
  email,
  employeeId,
  fullName,
  newPassword = null,
  branchName = null
) => {
  try {
    const tx = getTransporter();

    let passwordHtml = "";
    if (newPassword) {
      passwordHtml = `
        <p style="margin-top: 10px;">
          <strong>Account Password:</strong>
          <span style="font-family: monospace; background: #e0e7ff; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 15px;">
            ${newPassword}
          </span>
        </p>
      `;
    }

    const branchHtml = branchName
      ? `
            <p>
              <strong>Branch:</strong>
              ${branchName}
            </p>
      `
      : "";

    await tx.sendMail({
      from: `"ERP System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your ERP Employee Account Has Been Updated",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 25px;
          border: 1px solid #ddd;
          border-radius: 10px;
        ">

          <h2 style="color: #2563eb;">
            ERP Account Details Updated
          </h2>

          <p>
            Hello ${fullName},
          </p>

          <p>
            Your employee account email or information has been updated by the administrator.
          </p>

          <div style="
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          ">

            <p>
              <strong>Employee ID:</strong>
              ${employeeId}
            </p>

            <p>
              <strong>Updated Email Address:</strong>
              ${email}
            </p>

            ${branchHtml}

            ${passwordHtml}

          </div>

          <p>
            You can use your updated <strong>Email (${email})</strong> or <strong>Employee ID (${employeeId})</strong> to log into the ERP system.
          </p>

          <p style="color: #dc2626;">
            If you did not request or expect this change, please contact your administrator immediately.
          </p>

          <p style="margin-top: 30px;">
            Regards,<br>
            <strong>ERP System</strong>
          </p>

        </div>
      `,
    });

    console.log(`Employee update notification email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send employee update notification email:", error.message);
    console.error(error);
  }
};


// Send admin creation credentials email
const sendAdminCredentialsEmail = async (
  email,
  adminId,
  fullName,
  password,
  businessType
) => {
  try {
    const tx = getTransporter();

    await tx.sendMail({
      from: `"ERP System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your ERP Admin Account Credentials",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 25px;
          border: 1px solid #ddd;
          border-radius: 10px;
        ">

          <h2 style="color: #2563eb;">
            Welcome to ERP System - Administrator Account
          </h2>

          <p>
            Hello <strong>${fullName}</strong>,
          </p>

          <p>
            Your administrator account has been created by the Super Admin.
          </p>

          <p>
            You can use the following credentials to log in:
          </p>

          <div style="
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          ">

            <p style="margin: 6px 0;">
              <strong>Admin ID:</strong> ${adminId}
            </p>

            <p style="margin: 6px 0;">
              <strong>Email Address:</strong> ${email}
            </p>

            <p style="margin: 6px 0;">
              <strong>Business Type:</strong> ${businessType || 'N/A'}
            </p>

            <p style="margin: 6px 0;">
              <strong>Password:</strong> 
              <span style="font-family: monospace; background: #e0e7ff; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                ${password}
              </span>
            </p>

          </div>

          <p>
            You can sign in to the ERP Portal using your <strong>Email Address (${email})</strong> or <strong>Admin ID (${adminId})</strong>.
          </p>

          <p style="color: #dc2626; margin-top: 15px;">
            Please change your password after your first login for security.
          </p>

          <p style="margin-top: 30px;">
            Regards,<br>
            <strong>ERP System Management</strong>
          </p>

        </div>
      `,
    });

    console.log(`Admin credentials email sent successfully to ${email}`);
  } catch (error) {
    console.error("Failed to send admin credentials email:", error.message);
  }
};


export {
  sendEmployeeCredentialsEmail,
  // sendVerificationEmail,
  sendOTPEmail,
  sendEmployeeUpdatedEmail,
  sendAdminCredentialsEmail,
};


