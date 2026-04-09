import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { eq, and } from "drizzle-orm";
import { databaseConnections, semanticTableDefinitions, semanticColumnDefinitions } from "../drizzle/schema";
import { createOracleConnection, getTableMetadata, closeConnection } from "./oracle-driver";

/**
 * 自动化表结构分析路由
 * 一键提取表结构、AI 推断、存储到数据库
 */
export const autoAnalysisRouter = router({
  /**
   * 一键提取表结构并进行 AI 推断
   */
  analyzeTablesAutomatically: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 获取连接信息
      const connection = await db
        .select()
        .from(databaseConnections)
        .where(eq(databaseConnections.id, input.connectionId))
        .limit(1);

      if (!connection.length) {
        throw new Error("Connection not found");
      }

      const conn = connection[0];
      // 从连接信息构建配置
      const config = {
        host: conn.host,
        port: conn.port,
        database: conn.database,
        username: conn.username,
        password: conn.password,
        databaseType: conn.databaseType,
      };

      // 第一步：提取表结构
      const tables = await extractTableStructure(config);

      // 第二步：AI 推断业务含义
      const inferredTables = await inferSemantics(tables);

      // 第三步：存储到数据库
      const results = [];
      for (const table of inferredTables) {
        // 存储表级别的语义信息
        const tableRecord = {
          connectionId: input.connectionId,
          tableName: table.tableName,
          tableAlias: table.chineseAlias,
          tableComment: table.tableDescription,
          comment: table.tableDescription,
        };

        const existingTable = await db
          .select()
          .from(semanticTableDefinitions)
          .where(
            eq(semanticTableDefinitions.tableName, table.tableName)
          )
          .limit(1);

        if (existingTable.length) {
          await db
            .update(semanticTableDefinitions)
            .set(tableRecord)
            .where(eq(semanticTableDefinitions.tableName, table.tableName));
        } else {
          await db.insert(semanticTableDefinitions).values(tableRecord as any);
        }

        // 存储字段级别的语义信息
        const tableId = existingTable.length ? existingTable[0].id : (await db.select({ id: semanticTableDefinitions.id }).from(semanticTableDefinitions).where(eq(semanticTableDefinitions.tableName, table.tableName)).limit(1))[0].id;

        for (const column of table.columns) {
          const columnRecord = {
            tableId: tableId,
            columnName: column.columnName,
            columnAlias: column.chineseAlias,
            columnComment: column.columnDescription,
            dataType: "VARCHAR2", // 默认值，实际应从提取阶段传递
            keywords: JSON.stringify([]),
            exampleValues: JSON.stringify([]),
          };

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

          if (existingColumn.length) {
            await db
              .update(semanticColumnDefinitions)
              .set(columnRecord)
              .where(
                and(
                  eq(semanticColumnDefinitions.tableId, tableId),
                  eq(semanticColumnDefinitions.columnName, column.columnName)
                )
              );
          } else {
            await db.insert(semanticColumnDefinitions).values(columnRecord as any);
          }
        }

        results.push({
          tableName: table.tableName,
          chineseAlias: table.chineseAlias,
          columns: table.columns.length,
        });
      }

      return {
        success: true,
        tablesAnalyzed: results.length,
        results,
      };
    }),
});

/**
 * 从 Oracle 数据库提取表结构
 */
async function extractTableStructure(config: any) {
  console.log(`[AutoAnalysis] Starting extraction for ${config.host}:${config.port}/${config.database}`);
  
  let connection;
  try {
    connection = await createOracleConnection({
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
    });

    const metadata = await getTableMetadata(connection);
    console.log(`[AutoAnalysis] Successfully extracted ${metadata.length} tables from Oracle`);
    
    return metadata.map(table => ({
      tableName: table.tableName,
      columns: table.columns.map(col => ({
        columnName: col.columnName,
        dataType: col.dataType,
        comments: col.comments
      }))
    }));
  } catch (error: any) {
    console.error(`[AutoAnalysis] Extraction failed: ${error.message}`);
    throw new Error(`无法从 Oracle 提取元数据: ${error.message}`);
  } finally {
    if (connection) {
      await closeConnection(connection);
    }
  }
}

/**
 * 使用 Deepseek AI 推断表和字段的业务含义
 */
async function inferSemantics(tables: any[]) {
  const prompt = `
你是一个数据库专家。我给你一个数据库表结构，请为每个表和字段推断其业务含义。

表结构如下：
${JSON.stringify(tables, null, 2)}

请返回一个 JSON 对象，包含每个表的中文别名、业务描述，以及每个字段的中文别名和业务描述。

返回格式：
{
  "tables": [
    {
      "tableName": "表名",
      "chineseAlias": "中文别名",
      "tableDescription": "业务描述",
      "columns": [
        {
          "columnName": "字段名",
          "chineseAlias": "中文别名",
          "columnDescription": "业务描述"
        }
      ]
    }
  ]
}
`;

  try {
      const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的数据库架构师，擅长理解和解释数据库表结构的业务含义。",
        },
        {
          role: "user",
          content: prompt as string,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "semantic_inference",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tables: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    tableName: { type: "string" },
                    chineseAlias: { type: "string" },
                    tableDescription: { type: "string" },
                    columns: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          columnName: { type: "string" },
                          chineseAlias: { type: "string" },
                          columnDescription: { type: "string" },
                        },
                        required: [
                          "columnName",
                          "chineseAlias",
                          "columnDescription",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "tableName",
                    "chineseAlias",
                    "tableDescription",
                    "columns",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["tables"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from LLM");
    
    // 处理 content 可能是数组的情况
    let contentStr = typeof content === 'string' ? content : '';
    if (Array.isArray(content)) {
      contentStr = content.find(c => c.type === 'text')?.text || '';
    }

    const result = JSON.parse(contentStr);
    return result.tables || [];
  } catch (error) {
    console.error("AI inference error:", error);
    // 如果 AI 推断失败，返回基础的表结构
    return tables.map((t: any) => ({
      tableName: t.tableName,
      chineseAlias: t.tableName,
      tableDescription: `表: ${t.tableName}`,
      columns: (t.columns || []).map((c: any) => ({
        columnName: c.columnName,
        chineseAlias: c.columnName,
        columnDescription: `字段: ${c.columnName}`,
      })),
    }));
  }
}
