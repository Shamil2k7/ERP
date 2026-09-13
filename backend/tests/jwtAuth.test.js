import assert from "assert";
import {
  generateToken,
  verifyToken,
  extractToken,
  getJwtSecret,
} from "../src/config/jwt.js";
import { requireAuth, requireRoles } from "../src/middlewares/auth.middleware.js";

async function runTests() {
  console.log("=========================================");
  console.log("     RUNNING JWT AUTHENTICATION TESTS    ");
  console.log("=========================================\n");

  // 1. Token Generation (with string ID)
  console.log("Test 1: Token Generation with string ID");
  const tokenStringId = generateToken("user-12345");
  assert(typeof tokenStringId === "string", "Token should be a string");
  const decoded1 = verifyToken(tokenStringId);
  assert.strictEqual(decoded1.id, "user-12345", "Decoded token should have correct id");
  console.log(" Passed\n");

  // 2. Token Generation (with payload object)
  console.log("Test 2: Token Generation with payload object");
  const tokenObj = generateToken({
    id: "user-67890",
    email: "admin@erp.com",
    role: "ADMIN",
    companyId: "comp-100",
  });
  const decoded2 = verifyToken(tokenObj);
  assert.strictEqual(decoded2.id, "user-67890");
  assert.strictEqual(decoded2.email, "admin@erp.com");
  assert.strictEqual(decoded2.role, "ADMIN");
  assert.strictEqual(decoded2.companyId, "comp-100");
  console.log(" Passed\n");

  // 3. Token Verification Rejects Tampered Token
  console.log("Test 3: Token Verification rejects tampered token");
  assert.throws(
    () => {
      verifyToken("tampered.token.signature");
    },
    (err) => err.name === "JsonWebTokenError" || err.message.includes("jwt"),
    "Should throw error on invalid/tampered token"
  );
  console.log(" Passed\n");

  // 4. Token Verification Rejects Expired Token
  console.log("Test 4: Token Verification rejects expired token");
  const expiredToken = generateToken({ id: "user-exp" }, { expiresIn: "1ms" });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.throws(
    () => {
      verifyToken(expiredToken);
    },
    (err) => err.name === "TokenExpiredError",
    "Should throw TokenExpiredError on expired token"
  );
  console.log(" Passed\n");

  // 5. Token Extraction from Authorization Header
  console.log("Test 5: Token Extraction from Authorization Header");
  const reqWithHeader = {
    headers: { authorization: "Bearer my-jwt-token-123" },
  };
  assert.strictEqual(extractToken(reqWithHeader), "my-jwt-token-123");
  console.log(" Passed\n");

  // 6. Token Extraction from Cookies
  console.log("Test 6: Token Extraction from Cookie");
  const reqWithCookie = {
    headers: {},
    cookies: { token: "cookie-jwt-token-456" },
  };
  assert.strictEqual(extractToken(reqWithCookie), "cookie-jwt-token-456");
  console.log(" Passed\n");

  // 7. requireAuth Middleware - Missing Token
  console.log("Test 7: requireAuth rejects request with missing token");
  const reqNoToken = { headers: {}, cookies: {} };
  let statusResult = 0;
  let jsonResult = null;
  const resMock = {
    status(s) {
      statusResult = s;
      return this;
    },
    json(data) {
      jsonResult = data;
      return this;
    },
  };
  let nextCalled = false;
  await requireAuth(reqNoToken, resMock, () => {
    nextCalled = true;
  });
  assert.strictEqual(statusResult, 401, "Should return 401 status");
  assert.strictEqual(nextCalled, false, "next() should NOT be called");
  assert.strictEqual(jsonResult?.success, false);
  console.log(" Passed\n");

  // 8. requireAuth Middleware - Invalid Token
  console.log("Test 8: requireAuth rejects request with invalid token");
  const reqInvalidToken = {
    headers: { authorization: "Bearer invalid.token.here" },
  };
  statusResult = 0;
  jsonResult = null;
  nextCalled = false;
  await requireAuth(reqInvalidToken, resMock, () => {
    nextCalled = true;
  });
  assert.strictEqual(statusResult, 401, "Should return 401 status for invalid token");
  assert.strictEqual(nextCalled, false, "next() should NOT be called");
  assert.strictEqual(jsonResult?.success, false);
  console.log(" Passed\n");

  // 9. requireRoles Middleware - Unauthenticated User
  console.log("Test 9: requireRoles rejects unauthenticated request");
  const roleMiddleware = requireRoles(["ADMIN", "MANAGER"]);
  statusResult = 0;
  jsonResult = null;
  nextCalled = false;
  roleMiddleware({ user: null }, resMock, () => {
    nextCalled = true;
  });
  assert.strictEqual(statusResult, 401);
  assert.strictEqual(nextCalled, false);
  console.log(" Passed\n");

  // 10. requireRoles Middleware - Insufficient Role
  console.log("Test 10: requireRoles rejects user with insufficient role");
  statusResult = 0;
  jsonResult = null;
  nextCalled = false;
  roleMiddleware({ user: { role: "CASHIER" } }, resMock, () => {
    nextCalled = true;
  });
  assert.strictEqual(statusResult, 403);
  assert.strictEqual(nextCalled, false);
  console.log(" Passed\n");

  // 11. requireRoles Middleware - Authorized Role
  console.log("Test 11: requireRoles allows user with authorized role");
  nextCalled = false;
  roleMiddleware({ user: { role: "MANAGER" } }, resMock, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true, "next() should be called for matching role");
  console.log(" Passed\n");

  // 12. requireRoles Middleware - Super Admin unrestricted bypass
  console.log("Test 12: requireRoles allows SUPER_ADMIN bypass");
  nextCalled = false;
  roleMiddleware({ user: { role: "SUPER_ADMIN" } }, resMock, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true, "next() should be called for SUPER_ADMIN");
  console.log(" Passed\n");

  console.log("=========================================");
  console.log("  ALL 12 JWT AUTH TESTS PASSED CLEANLY!  ");
  console.log("=========================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
