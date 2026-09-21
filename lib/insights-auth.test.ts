import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { verifyAdminToken, extractTokenFromHeader } from "./insights-auth";

describe("insights-auth", () => {
  const originalEnv = process.env.INSIGHTS_ADMIN_TOKEN;

  afterEach(() => {
    process.env.INSIGHTS_ADMIN_TOKEN = originalEnv;
  });

  describe("verifyAdminToken", () => {
    it("returns false when no token is configured", () => {
      delete process.env.INSIGHTS_ADMIN_TOKEN;
      expect(verifyAdminToken("any-token")).toBe(false);
    });

    it("returns true when token matches configured token", () => {
      process.env.INSIGHTS_ADMIN_TOKEN = "test-secret-token";
      expect(verifyAdminToken("test-secret-token")).toBe(true);
    });

    it("returns false when token does not match", () => {
      process.env.INSIGHTS_ADMIN_TOKEN = "test-secret-token";
      expect(verifyAdminToken("wrong-token")).toBe(false);
    });

    it("returns false when token is null", () => {
      process.env.INSIGHTS_ADMIN_TOKEN = "test-secret-token";
      expect(verifyAdminToken(null)).toBe(false);
    });
  });

  describe("extractTokenFromHeader", () => {
    it("extracts token from Bearer header", () => {
      const token = extractTokenFromHeader("Bearer my-secret-token-123");
      expect(token).toBe("my-secret-token-123");
    });

    it("returns null for malformed header", () => {
      const token = extractTokenFromHeader("Basic xyz");
      expect(token).toBeNull();
    });

    it("returns null for null header", () => {
      const token = extractTokenFromHeader(null);
      expect(token).toBeNull();
    });

    it("returns null for header without space", () => {
      const token = extractTokenFromHeader("Bearertoken");
      expect(token).toBeNull();
    });
  });
});
