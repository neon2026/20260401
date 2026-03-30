import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import crypto from "crypto";

/**
 * Local Authentication Module
 * Provides username/password authentication without OAuth
 */

// Simple in-memory user store for demo (in production, use database)
// Format: { username: { passwordHash, userId } }
const localUsers: Record<string, { passwordHash: string; userId: string }> = {};

/**
 * Hash password using SHA256
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Initialize default test user
 */
export async function initializeLocalUsers() {
  // Create a test user: username="admin", password="admin123"
  const testUsername = "admin";
  const testPassword = "admin123";
  const testUserId = "local-user-1";

  localUsers[testUsername] = {
    passwordHash: hashPassword(testPassword),
    userId: testUserId,
  };

  // Also create the user in the database
  try {
    await db.upsertUser({
      openId: testUserId,
      name: "Admin User",
      email: "admin@localhost",
      loginMethod: "local",
      role: "admin",
    });
    console.log("[Local Auth] Test user initialized: admin / admin123");
  } catch (error) {
    console.error("[Local Auth] Failed to initialize test user:", error);
  }
}

/**
 * Verify username and password
 */
export function verifyCredentials(username: string, password: string): boolean {
  const user = localUsers[username];
  if (!user) return false;

  const passwordHash = hashPassword(password);
  return user.passwordHash === passwordHash;
}

/**
 * Get user ID by username
 */
export function getUserIdByUsername(username: string): string | null {
  const user = localUsers[username];
  return user ? user.userId : null;
}

/**
 * Register local authentication routes
 */
export function registerLocalAuthRoutes(app: Express) {
  /**
   * POST /api/auth/login
   * Local username/password login
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "username and password are required" });
      return;
    }

    try {
      // Verify credentials
      if (!verifyCredentials(username, password)) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }

      // Get user ID
      const userId = getUserIdByUsername(username);
      if (!userId) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      // Get user from database
      const user = await db.getUserByOpenId(userId);
      if (!user) {
        res.status(401).json({ error: "User not found in database" });
        return;
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(userId, {
        name: user.name || username,
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Return user info
      res.json({
        success: true,
        user: {
          id: user.id,
          openId: user.openId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Local Auth] Login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  /**
   * POST /api/auth/register
   * Register new local user (optional, for demo)
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { username, password, name, email } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "username and password are required" });
      return;
    }

    // Check if user already exists
    if (localUsers[username]) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    try {
      // Create new user
      const userId = `local-user-${Date.now()}`;
      localUsers[username] = {
        passwordHash: hashPassword(password),
        userId,
      };

      // Save to database
      await db.upsertUser({
        openId: userId,
        name: name || username,
        email: email || null,
        loginMethod: "local",
        role: "user",
      });

      res.json({
        success: true,
        message: "User registered successfully",
        userId,
      });
    } catch (error) {
      console.error("[Local Auth] Registration failed:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
}
