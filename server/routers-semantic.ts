/**
 * 语义层管理 API 路由
 * 这个文件包含语义导入、编辑等 API
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { semanticTableDefinitions, semanticColumnDefinitions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const semanticRouter = router({
  // 导入 AI 推断的语义结果
  importResults: protectedProcedure
    .input(
      z.object({
        connectionId: z.number(),
        results: z.array(
          z.object({
            tableName: z.string(),
            chineseAlias: z.string(),
            tableDescription: z.string(),
            columns: z.array(
              z.object({
                columnName: z.string(),
                chineseAlias: z.string(),
                columnDescription: z.string(),
                dataType: z.string(),
                nullable: z.boolean(),
              })
            ),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = {
        imported: 0,
        updated: 0,
        failed: 0,
      };

      for (const semantic of input.results) {
        try {
          const existingTable = await db
            .select()
            .from(semanticTableDefinitions)
            .where(
              and(
                eq(semanticTableDefinitions.connectionId, input.connectionId),
                eq(semanticTableDefinitions.tableName, semantic.tableName)
              )
            )
            .limit(1);

          let tableId: number;

          if (existingTable.length > 0) {
            await db
              .update(semanticTableDefinitions)
              .set({
                tableAlias: semantic.chineseAlias,
                tableComment: semantic.tableDescription,
              })
              .where(eq(semanticTableDefinitions.id, existingTable[0].id));

            tableId = existingTable[0].id;
            results.updated++;
          } else {
            const insertResult = await db.insert(semanticTableDefinitions).values({
              connectionId: input.connectionId,
              tableName: semantic.tableName,
              tableAlias: semantic.chineseAlias,
              tableComment: semantic.tableDescription,
            });

            tableId = (insertResult as any).insertId;
            results.imported++;
          }

          for (const column of semantic.columns) {
            const existingColumn = await db
              .select()
              .from(semanticColumnDefinitions)
              .where(
                and(
                  eq(semanticColumnDefinitions.tableId, tableId),
                  eq(semanticColumnDefinitions.columnName, column.columnName)
                )
              )
              .limit(1);

            if (existingColumn.length > 0) {
              await db
                .update(semanticColumnDefinitions)
                .set({
                  columnAlias: column.chineseAlias,
                  columnComment: column.columnDescription,
                  dataType: column.dataType,
                })
                .where(eq(semanticColumnDefinitions.id, existingColumn[0].id));
            } else {
              await db.insert(semanticColumnDefinitions).values({
                tableId,
                columnName: column.columnName,
                columnAlias: column.chineseAlias,
                columnComment: column.columnDescription,
                dataType: column.dataType,
              });
            }
          }
        } catch (error) {
          console.error(`导入表 ${semantic.tableName} 失败:`, error);
          results.failed++;
        }
      }

      return results;
    }),

  // 更新表的精细注释
  updateTableComment: protectedProcedure
    .input(
      z.object({
        tableId: z.number(),
        comment: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(semanticTableDefinitions)
        .set({ comment: input.comment })
        .where(eq(semanticTableDefinitions.id, input.tableId));

      return { success: true };
    }),

  // 更新字段的精细注释
  updateColumnComment: protectedProcedure
    .input(
      z.object({
        columnId: z.number(),
        comment: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(semanticColumnDefinitions)
        .set({ comment: input.comment })
        .where(eq(semanticColumnDefinitions.id, input.columnId));

      return { success: true };
    }),

  // 获取表的详细信息
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
});
