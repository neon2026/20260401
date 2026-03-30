import { describe, it, expect, beforeAll } from "vitest";
import * as localAuth from "./_core/local-auth";

describe("Local Authentication", () => {
  beforeAll(async () => {
    // Initialize local users before running tests
    await localAuth.initializeLocalUsers();
  });

  describe("verifyCredentials", () => {
    it("should verify correct credentials", () => {
      const result = localAuth.verifyCredentials("admin", "admin123");
      expect(result).toBe(true);
    });

    it("should reject incorrect password", () => {
      const result = localAuth.verifyCredentials("admin", "wrongpassword");
      expect(result).toBe(false);
    });

    it("should reject non-existent user", () => {
      const result = localAuth.verifyCredentials("nonexistent", "password");
      expect(result).toBe(false);
    });
  });

  describe("getUserIdByUsername", () => {
    it("should return user ID for existing user", () => {
      const userId = localAuth.getUserIdByUsername("admin");
      expect(userId).toBe("local-user-1");
    });

    it("should return null for non-existent user", () => {
      const userId = localAuth.getUserIdByUsername("nonexistent");
      expect(userId).toBeNull();
    });
  });
});
