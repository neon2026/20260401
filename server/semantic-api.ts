/**
 * 语义层管理 API
 * 处理语义导入、编辑、查询等操作
 */

import { getDb } from "./db";
import { semanticTableDefinitions, semanticColumnDefinitions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { InferredSemantic, InferredColumnSemantic } from "./semantic-inference";

/**
 * 导入 AI 推断的语义结果
 */
export async function importSemanticResults(
  connectionId: number,
  inferredSemantics: InferredSemantic[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = {
    imported: 0,
    updated: 0,
    failed: 0,
  };

  for (const semantic of inferredSemantics) {
    try {
      // 检查表是否已存在
      const existingTable = await db
        .select()
        .from(semanticTableDefinitions)
        .where(
          and(
            eq(semanticTableDefinitions.connectionId, connectionId),
            eq(semanticTableDefinitions.tableName, semantic.tableName)
          )
        )
        .limit(1);

      let tableId: number;

      if (existingTable.length > 0) {
        // 更新现有表
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
        // 插入新表
        const insertResult = await db.insert(semanticTableDefinitions).values({
          connectionId,
          tableName: semantic.tableName,
          tableAlias: semantic.chineseAlias,
          tableComment: semantic.tableDescription,
        });

        tableId = (insertResult as any).insertId;
        results.imported++;
      }

      // 导入字段
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
          // 更新现有字段
          await db
            .update(semanticColumnDefinitions)
            .set({
              columnAlias: column.chineseAlias,
              columnComment: column.columnDescription,
              dataType: column.dataType,
            })
            .where(eq(semanticColumnDefinitions.id, existingColumn[0].id));
        } else {
          // 插入新字段
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
}

/**
 * 获取连接的所有语义定义
 */
export async function getSemanticDefinitions(connectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tables = await db
    .select()
    .from(semanticTableDefinitions)
    .where(eq(semanticTableDefinitions.connectionId, connectionId));

  const result = [];

  for (const table of tables) {
    const columns = await db
      .select()
      .from(semanticColumnDefinitions)
      .where(eq(semanticColumnDefinitions.tableId, table.id));

    result.push({
      ...table,
      columns,
    });
  }

  return result;
}

/**
 * 更新表的注释
 */
export async function updateTableComment(tableId: number, comment: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(semanticTableDefinitions)
    .set({ comment })
    .where(eq(semanticTableDefinitions.id, tableId));
}

/**
 * 更新字段的注释
 */
export async function updateColumnComment(columnId: number, comment: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(semanticColumnDefinitions)
    .set({ comment })
    .where(eq(semanticColumnDefinitions.id, columnId));
}

/**
 * 获取表的详细信息（包括所有字段）
 */
export async function getTableDetails(tableId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const table = await db
    .select()
    .from(semanticTableDefinitions)
    .where(eq(semanticTableDefinitions.id, tableId))
    .limit(1);

  if (!table.length) throw new Error("Table not found");

  const columns = await db
    .select()
    .from(semanticColumnDefinitions)
    .where(eq(semanticColumnDefinitions.tableId, tableId));

  return {
    ...table[0],
    columns,
  };
}
