import jwt from "jsonwebtoken";

const getJwtSecret = () => process.env.JWT_SECRET || "supersecretkey";

/**
 * Generate a signed JWT token
 * @param {string|object} payload - User ID or object containing user claims
 * @param {object} [options] - Additional jwt.sign options
 * @returns {string} - Signed JWT string
 */
const generateToken = (payload, options = {}) => {
  const secret = getJwtSecret();
  const claims = typeof payload === "string" ? { id: payload } : { ...payload };
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(claims, secret, {
    expiresIn,
    ...options,
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token string
 * @returns {object} - Decoded payload
 */
const verifyToken = (token) => {
  if (!token) {
    throw new Error("Token must be provided");
  }
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

/**
 * Extract token from HTTP request (checks Authorization header and cookies)
 * @param {import("express").Request} req
 * @returns {string|null}
 */
const extractToken = (req) => {
  if (!req) return null;

  if (
    req.headers?.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1].trim();
  }

  if (req.cookies?.token) {
    return req.cookies.token.trim();
  }

  return null;
};

export {
  getJwtSecret,
  generateToken,
  verifyToken,
  extractToken,
};