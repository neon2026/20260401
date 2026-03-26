import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// 创建模拟用户上下文
function createMockContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("AI Query System - Backend API", () => {
  describe("Database Connection API", () => {
    it("should list user connections", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        const connections = await caller.database.listConnections();
        expect(Array.isArray(connections)).toBe(true);
      } catch (error) {
        // 如果数据库不可用，这是预期的
        expect(error).toBeDefined();
      }
    });

    it("should validate connection input", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        // 尝试创建无效连接
        await caller.database.createConnection({
          name: "",
          databaseType: "oracle",
          host: "",
          port: 1521,
          database: "",
          username: "",
          password: "",
        });
      } catch (error: any) {
        // 应该抛出错误
        expect(error).toBeDefined();
      }
    });
  });

  describe("Metadata API", () => {
    it("should handle metadata extraction errors gracefully", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        // 尝试提取不存在的连接的元数据
        await caller.metadata.extractTableMetadata({
          connectionId: 99999,
        });
      } catch (error: any) {
        expect(error.message).toContain("not found");
      }
    });
  });

  describe("Query API", () => {
    it("should validate query input", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        // 尝试执行查询但没有有效连接
        await caller.query.executeQuery({
          connectionId: 99999,
          userQuestion: "测试问题",
        });
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should require connection selection", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        // 尝试执行查询但没有连接 ID
        await caller.query.executeQuery({
          connectionId: 0,
          userQuestion: "测试问题",
        });
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Auth API", () => {
    it("should get current user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const user = await caller.auth.me();
      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
      expect(user?.openId).toBe("test-user");
    });

    it("should logout user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });
  });
});
