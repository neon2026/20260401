import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  databaseConnections,
  semanticTableDefinitions,
  semanticColumnDefinitions,
  queryHistory,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  createOracleConnection,
  getTableMetadata,
  executeSql,
  closeConnection,
  testConnection,
  OracleConnectionConfig,
} from "./oracle-driver";
import { invokeLLM } from "./_core/llm";
import { dictionaryRouter } from "./routers-dictionary";
import { autoAnalysisRouter } from "./routers-auto-analysis";

export const appRouter = router({
  system: systemRouter,
  autoAnalysis: autoAnalysisRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 数据库连接管理
  database: router({
    // 创建数据库连接
    createConnection: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          databaseType: z.string(),
          host: z.string(),
          port: z.number(),
          database: z.string(),
          username: z.string(),
          password: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // 测试连接
        const config: OracleConnectionConfig = {
          host: input.host,
          port: input.port,
          database: input.database,
          username: input.username,
          password: input.password,
        };

        const isConnected = await testConnection(config);
        if (!isConnected) {
          throw new Error("Failed to connect to database");
        }

        // 保存连接配置
        const result = await db.insert(databaseConnections).values({
          userId: ctx.user.id,
          name: input.name,
          databaseType: input.databaseType,
          host: input.host,
          port: input.port,
          database: input.database,
          username: input.username,
          password: input.password,
          isActive: true,
        });

        // 获取插入的连接 ID
        const connections = await db
          .select()
          .from(databaseConnections)
          .where(eq(databaseConnections.username, input.username))
          .limit(1);

        return { success: true, connectionId: connections[0]?.id || 0 };
      }),

    // 获取用户的所有连接
    listConnections: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const connections = await db
        .select()
        .from(databaseConnections)
        .where(eq(databaseConnections.userId, ctx.user.id));

      return connections.map((c) => ({
        ...c,
        password: "***",
      }));
    }),

    // 获取单个连接
    getConnection: protectedProcedure
      .input(z.object({ connectionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const connection = await db
          .select()
          .from(databaseConnections)
          .where(
            and(
              eq(databaseConnections.id, input.connectionId),
              eq(databaseConnections.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!connection.length) throw new Error("Connection not found");

        return {
          ...connection[0],
          password: "***",
        };
      }),

    // 删除数据库连接
    deleteConnection: protectedProcedure
      .input(z.object({ connectionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // 检查连接是否存在且属于当前用户
        const connection = await db
          .select()
          .from(databaseConnections)
          .where(
            and(
              eq(databaseConnections.id, input.connectionId),
              eq(databaseConnections.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!connection.length) throw new Error("Connection not found or unauthorized");

        // 手动清理关联数据（因为 schema 中没有定义级联删除）
        
        // 1. 获取所有关联的表定义
        const tables = await db
          .select({ id: semanticTableDefinitions.id })
          .from(semanticTableDefinitions)
          .where(eq(semanticTableDefinitions.connectionId, input.connectionId));
        
        const tableIds = tables.map(t => t.id);
        
        // 2. 删除关联的字段定义
        if (tableIds.length > 0) {
          for (const tableId of tableIds) {
            await db
              .delete(semanticColumnDefinitions)
              .where(eq(semanticColumnDefinitions.tableId, tableId));
          }
        }
        
        // 3. 删除关联的表定义
        await db
          .delete(semanticTableDefinitions)
          .where(eq(semanticTableDefinitions.connectionId, input.connectionId));
          
        // 4. 删除查询历史
        await db
          .delete(queryHistory)
          .where(eq(queryHistory.connectionId, input.connectionId));
          
        // 5. 删除 AI 推断日志
        await db
          .delete(aiInferenceLog)
          .where(eq(aiInferenceLog.connectionId, input.connectionId));

        // 6. 最后删除连接本身
        await db
          .delete(databaseConnections)
          .where(eq(databaseConnections.id, input.connectionId));

        return { success: true };
      }),
  }),

  // 元数据提取和 AI 推断
  metadata: router({
    // 提取表元数据
    extractTableMetadata: protectedProcedure
      .input(z.object({ connectionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // 获取连接配置
        const connConfig = await db
          .select()
          .from(databaseConnections)
          .where(
            and(
              eq(databaseConnections.id, input.connectionId),
              eq(databaseConnections.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!connConfig.length) throw new Error("Connection not found");

        const config = connConfig[0];
        let oracleConn;

        try {
          // 连接到 Oracle
          oracleConn = await createOracleConnection({
            host: config.host,
            port: config.port,
            database: config.database,
            username: config.username,
            password: config.password,
          });

          // 获取表元数据
          const tableMetadata = await getTableMetadata(oracleConn);

          // 保存到数据库 - 批量插入表定义
          const insertedTables: { [key: string]: number } = {};
          
          for (const table of tableMetadata) {
            try {
              const tableResult = await db.insert(semanticTableDefinitions).values({
                connectionId: input.connectionId,
                tableName: table.tableName,
                tableAlias: table.tableName,
                tableComment: "",
                keywords: JSON.stringify([]),
                sampleData: JSON.stringify([]),
              });
              
              // 使用 lastInsertRowid 或直接从返回值获取 ID
              const tableId = (tableResult as any)?.[0]?.id || 0;
              insertedTables[table.tableName] = tableId;
              
              // 保存字段信息
              if (tableId > 0) {
                for (const column of table.columns) {
                  await db.insert(semanticColumnDefinitions).values({
                    tableId: tableId,
                    columnName: column.columnName,
                    columnAlias: column.columnName,
                    columnComment: column.comments || "",
                    dataType: column.dataType,
                    keywords: JSON.stringify([]),
                    exampleValues: JSON.stringify([]),
                    isPrimaryKey: false,
                    isForeignKey: false,
                  });
                }
              }
            } catch (err: any) {
              console.warn(`[Metadata] Failed to insert table ${table.tableName}:`, err.message);
              // 继续处理其他表
            }
          }

          return {
            success: true,
            tablesCount: tableMetadata.length,
            columnsCount: tableMetadata.reduce((sum, t) => sum + t.columns.length, 0),
          };
        } finally {
          if (oracleConn) {
            await closeConnection(oracleConn);
          }
        }
      }),

    // 获取表的语义定义
    getTableDefinitions: protectedProcedure
      .input(z.object({ connectionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const tables = await db
          .select()
          .from(semanticTableDefinitions)
          .where(eq(semanticTableDefinitions.connectionId, input.connectionId));

        return tables;
      }),

    // 获取字段的语义定义
    getColumnDefinitions: protectedProcedure
      .input(z.object({ tableId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const columns = await db
          .select()
          .from(semanticColumnDefinitions)
          .where(eq(semanticColumnDefinitions.tableId, input.tableId));

        return columns;
      }),

    // AI 推断表的业务含义
    inferTableMeaning: protectedProcedure
      .input(z.object({ tableId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // 获取表信息
        const tableInfo = await db
          .select()
          .from(semanticTableDefinitions)
          .where(eq(semanticTableDefinitions.id, input.tableId))
          .limit(1);

        if (!tableInfo.length) throw new Error("Table not found");

        const table = tableInfo[0];

        // 获取字段信息
        const columns = await db
          .select()
          .from(semanticColumnDefinitions)
          .where(eq(semanticColumnDefinitions.tableId, input.tableId));

        // 调用 AI 推断
        const prompt = `
你是一个数据库专家。根据以下表结构和字段名称，推断这个表的业务含义。

表名: ${table.tableName}
字段列表:
${columns.map((c) => `- ${c.columnName} (${c.dataType})`).join("\n")}

请为这个表生成：
1. 中文别名（简洁、易理解）
2. 业务注释（说明该表的作用和含义）
3. 关键字标签（如"用户"、"订单"等）

输出格式为 JSON:
{
  "tableAlias": "...",
  "tableComment": "...",
  "keywords": ["...", "..."]
}
        `;

        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "table_inference",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  tableAlias: { type: "string" },
                  tableComment: { type: "string" },
                  keywords: { type: "array", items: { type: "string" } },
                },
                required: ["tableAlias", "tableComment", "keywords"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = typeof response.choices[0].message.content === 'string' 
          ? response.choices[0].message.content 
          : JSON.stringify(response.choices[0].message.content);
        const inference = JSON.parse(content);

        // 更新表定义
        await db
          .update(semanticTableDefinitions)
          .set({
            tableAlias: inference.tableAlias,
            tableComment: inference.tableComment,
            keywords: JSON.stringify(inference.keywords),
          })
          .where(eq(semanticTableDefinitions.id, input.tableId));

        return { success: true, ...inference };
      }),
  }),

  // 数据字典管理
  dictionary: dictionaryRouter,

  // AI 查询
  query: router({
    // 执行自然语言查询
    executeQuery: protectedProcedure
      .input(
        z.object({
          connectionId: z.number(),
          userQuestion: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // 获取连接配置
        const connConfig = await db
          .select()
          .from(databaseConnections)
          .where(
            and(
              eq(databaseConnections.id, input.connectionId),
              eq(databaseConnections.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!connConfig.length) throw new Error("Connection not found");

        const config = connConfig[0];

        // 获取语义层信息
        const tables = await db
          .select()
          .from(semanticTableDefinitions)
          .where(eq(semanticTableDefinitions.connectionId, input.connectionId));

        // 按表分组获取字段，构建详细的 Schema 上下文
        const tableWithColumns = await Promise.all(tables.map(async (t) => {
          const columns = await db
            .select()
            .from(semanticColumnDefinitions)
            .where(eq(semanticColumnDefinitions.tableId, t.id));
          return { ...t, columns };
        }));

        // 构建更详细的 Schema 信息
        const schemaInfo = tableWithColumns
          .map((t) => {
            const colInfo = t.columns.map(c => `  - ${c.columnName} (${c.columnAlias || c.columnName}): ${c.columnComment || ''}`).join("\n");
            return `物理表名: ${t.tableName}\n业务名称: ${t.tableAlias}\n业务描述: ${t.tableComment || '无'}\n字段列表:\n${colInfo}`;
          })
          .join("\n\n");

        console.log(`[Query] User Question: ${input.userQuestion}`);
        console.log(`[Query] Available Tables in Semantic Layer: ${tables.map(t => t.tableName).join(', ')}`);

        // 调用 AI 生成 SQL
        const sqlPrompt = `
你是一个专业的 Oracle SQL 专家。请根据提供的数据库 Schema 信息，将用户的自然语言问题转换为精准的 Oracle SQL。

### 数据库 Schema 信息 (物理表名与业务含义对照):
${schemaInfo}

### 用户问题: 
${input.userQuestion}

### 核心规则 (必须遵守):
1. **物理表名优先**: 必须使用上面列出的“物理表名”（如 STAFF, PATIENT），严禁在 SQL 中直接使用中文业务名称。
2. **字段映射**: 参考字段列表中的“业务名称”来确定对应的“物理字段名”。
3. **Oracle 语法**: 使用标准的 Oracle SQL 语法（如使用 ROWNUM 限制行数，不要使用 LIMIT）。
4. **禁止分号**: SQL 语句末尾不要添加分号。
5. **仅返回 SQL**: 不要包含任何解释、Markdown 格式或代码块标记，只返回纯文本 SQL。

请生成 SQL:
        `;

        const sqlResponse = await invokeLLM({
          messages: [{ role: "user", content: sqlPrompt }],
        });

        const generatedSQL = typeof sqlResponse.choices[0].message.content === 'string' 
          ? sqlResponse.choices[0].message.content.trim().replace(/;+$/, '') 
          : '';

        // 记录查询历史
        const historyResult = await db.insert(queryHistory).values({
          userId: ctx.user.id,
          connectionId: input.connectionId,
          userQuestion: input.userQuestion,
          generatedSQL: generatedSQL,
          executionStatus: "pending",
        });

        // 获取插入的查询历史 ID
        const histories = await db
          .select()
          .from(queryHistory)
          .where(eq(queryHistory.userQuestion, input.userQuestion))
          .limit(1);
        const historyId = histories[0]?.id || 0;

        let oracleConn;
        try {
          // 执行 SQL
          oracleConn = await createOracleConnection({
            host: config.host,
            port: config.port,
            database: config.database,
            username: config.username,
            password: config.password,
          });

          const result = await executeSql(oracleConn, generatedSQL);

          // 更新查询历史
          await db
            .update(queryHistory)
            .set({
              executionStatus: "success",
              resultCount: result.count,
              executionTimeMs: result.executionTimeMs,
              resultData: JSON.stringify(result.rows.slice(0, 1000)),
            })
            .where(eq(queryHistory.id, historyId));

          return {
            success: true,
            queryId: historyId,
            generatedSQL,
            result: {
              columns: result.columns,
              rows: result.rows,
              count: result.count,
              executionTimeMs: result.executionTimeMs,
            },
          };
        } catch (error: any) {
          // 记录错误
          await db
            .update(queryHistory)
            .set({
              executionStatus: "error",
              executionError: error.message,
            })
            .where(eq(queryHistory.id, historyId));

          throw error;
        } finally {
          if (oracleConn) {
            await closeConnection(oracleConn);
          }
        }
      }),

    // 获取查询历史
    getHistory: protectedProcedure
      .input(z.object({ connectionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const history = await db
          .select()
          .from(queryHistory)
          .where(
            and(
              eq(queryHistory.userId, ctx.user.id),
              eq(queryHistory.connectionId, input.connectionId)
            )
          );

        return history;
      }),
  }),
});

export type AppRouter = typeof appRouter;
