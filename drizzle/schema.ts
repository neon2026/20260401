import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, longtext } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 数据库连接配置表
 * 存储用户配置的数据库连接信息
 */
export const databaseConnections = mysqlTable("database_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  databaseType: varchar("databaseType", { length: 50 }).notNull(),
  host: varchar("host", { length: 255 }).notNull(),
  port: int("port").notNull(),
  database: varchar("database", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  password: longtext("password").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DatabaseConnection = typeof databaseConnections.$inferSelect;
export type InsertDatabaseConnection = typeof databaseConnections.$inferInsert;

/**
 * 语义层表定义
 * 存储表的中文别名、注释等业务信息
 */
export const semanticTableDefinitions = mysqlTable("semantic_table_definitions", {
  id: int("id").autoincrement().primaryKey(),
  connectionId: int("connectionId").notNull(),
  tableName: varchar("tableName", { length: 255 }).notNull(),
  tableAlias: varchar("tableAlias", { length: 255 }).notNull(),
  tableComment: text("tableComment"),
  comment: text("comment"),
  keywords: text("keywords"),
  sampleData: longtext("sampleData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SemanticTableDefinition = typeof semanticTableDefinitions.$inferSelect;
export type InsertSemanticTableDefinition = typeof semanticTableDefinitions.$inferInsert;

/**
 * 语义层字段定义
 * 存储字段的中文别名、注释等业务信息
 */
export const semanticColumnDefinitions = mysqlTable("semantic_column_definitions", {
  id: int("id").autoincrement().primaryKey(),
  tableId: int("tableId").notNull(),
  columnName: varchar("columnName", { length: 255 }).notNull(),
  columnAlias: varchar("columnAlias", { length: 255 }).notNull(),
  columnComment: text("columnComment"),
  comment: text("comment"),
  dataType: varchar("dataType", { length: 100 }),
  keywords: text("keywords"),
  exampleValues: text("exampleValues"),
  isPrimaryKey: boolean("isPrimaryKey").default(false),
  isForeignKey: boolean("isForeignKey").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SemanticColumnDefinition = typeof semanticColumnDefinitions.$inferSelect;
export type InsertSemanticColumnDefinition = typeof semanticColumnDefinitions.$inferInsert;

/**
 * 查询历史表
 * 记录用户的所有查询
 */
export const queryHistory = mysqlTable("query_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  connectionId: int("connectionId").notNull(),
  userQuestion: text("userQuestion").notNull(),
  generatedSQL: longtext("generatedSQL"),
  executionStatus: mysqlEnum("executionStatus", ["success", "error", "pending"]).default("pending"),
  executionError: text("executionError"),
  resultCount: int("resultCount"),
  executionTimeMs: int("executionTimeMs"),
  resultData: longtext("resultData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QueryHistory = typeof queryHistory.$inferSelect;
export type InsertQueryHistory = typeof queryHistory.$inferInsert;

/**
 * AI 推断日志表
 * 记录 AI 推断表/字段业务含义的过程
 */
export const aiInferenceLog = mysqlTable("ai_inference_log", {
  id: int("id").autoincrement().primaryKey(),
  connectionId: int("connectionId").notNull(),
  inferenceType: mysqlEnum("inferenceType", ["table", "column"]).notNull(),
  targetName: varchar("targetName", { length: 255 }).notNull(),
  aiResponse: longtext("aiResponse").notNull(),
  userApproved: boolean("userApproved").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiInferenceLog = typeof aiInferenceLog.$inferSelect;
export type InsertAiInferenceLog = typeof aiInferenceLog.$inferInsert;
