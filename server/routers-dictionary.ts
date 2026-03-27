/**
 * 数据字典 API 路由
 * 提供表结构查看和注释编辑功能
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { 
  databaseConnections,
  semanticTableDefinitions, 
  semanticColumnDefinitions 
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const dictionaryRouter = router({
  // 获取连接的所有表
  getTables: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 验证连接所有权
      const conn = await db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.connectionId),
            eq(databaseConnections.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!conn.length) throw new Error("Connection not found");

      // 获取所有表定义
      const tables = await db
        .select()
        .from(semanticTableDefinitions)
        .where(eq(semanticTableDefinitions.connectionId, input.connectionId));

      return tables;
    }),

  // 获取表的详细信息（包含所有字段）
  getTableDetails: protectedProcedure
    .input(z.object({ tableId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const table = await db
        .select()
        .from(semanticTableDefinitions)
        .where(eq(semanticTableDefinitions.id, input.tableId))
        .limit(1);

      if (!table.length) throw new Error("Table not found");

      const columns = await db
        .select()
        .from(semanticColumnDefinitions)
        .where(eq(semanticColumnDefinitions.tableId, input.tableId));

      return {
        ...table[0],
        columns,
      };
    }),

  // 更新表的注释
  updateTableComment: protectedProcedure
    .input(
      z.object({
        tableId: z.number(),
        comment: z.string().max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(semanticTableDefinitions)
        .set({ 
          comment: input.comment,
          updatedAt: new Date(),
        })
        .where(eq(semanticTableDefinitions.id, input.tableId));

      return { success: true };
    }),

  // 更新字段的注释
  updateColumnComment: protectedProcedure
    .input(
      z.object({
        columnId: z.number(),
        comment: z.string().max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(semanticColumnDefinitions)
        .set({ 
          comment: input.comment,
          updatedAt: new Date(),
        })
        .where(eq(semanticColumnDefinitions.id, input.columnId));

      return { success: true };
    }),

  // 批量获取表的基本信息（用于列表展示）
  getTablesSummary: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 验证连接所有权
      const conn = await db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.connectionId),
            eq(databaseConnections.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!conn.length) throw new Error("Connection not found");

      // 获取所有表
      const tables = await db
        .select()
        .from(semanticTableDefinitions)
        .where(eq(semanticTableDefinitions.connectionId, input.connectionId));

      // 获取每个表的字段数量
      const tablesWithColumnCount = await Promise.all(
        tables.map(async (table) => {
          const columns = await db
            .select()
            .from(semanticColumnDefinitions)
            .where(eq(semanticColumnDefinitions.tableId, table.id));

          return {
            ...table,
            columnCount: columns.length,
          };
        })
      );

      return tablesWithColumnCount;
    }),

  // 搜索表和字段
  search: protectedProcedure
    .input(
      z.object({
        connectionId: z.number(),
        keyword: z.string().min(1).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 验证连接所有权
      const conn = await db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.connectionId),
            eq(databaseConnections.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!conn.length) throw new Error("Connection not found");

      const keyword = `%${input.keyword}%`;

      // 搜索表
      const tables = await db
        .select()
        .from(semanticTableDefinitions)
        .where(eq(semanticTableDefinitions.connectionId, input.connectionId));

      const matchedTables = tables.filter(
        (t) =>
          t.tableName.toLowerCase().includes(input.keyword.toLowerCase()) ||
          t.tableAlias?.toLowerCase().includes(input.keyword.toLowerCase()) ||
          t.tableComment?.toLowerCase().includes(input.keyword.toLowerCase())
      );

      // 搜索字段
      const allColumns = await Promise.all(
        tables.map((table) =>
          db
            .select()
            .from(semanticColumnDefinitions)
            .where(eq(semanticColumnDefinitions.tableId, table.id))
        )
      );

      const matchedColumns = allColumns
        .flat()
        .filter(
          (c) =>
            c.columnName.toLowerCase().includes(input.keyword.toLowerCase()) ||
            c.columnAlias?.toLowerCase().includes(input.keyword.toLowerCase()) ||
            c.columnComment?.toLowerCase().includes(input.keyword.toLowerCase())
        );

      return {
        tables: matchedTables,
        columns: matchedColumns,
      };
    }),
});
