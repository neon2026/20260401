/**
 * Oracle 数据库连接驱动
 * 支持连接到 Oracle 数据库并执行查询
 */

import oracledb from "oracledb";

// 初始化 Oracle 客户端
try {
  oracledb.initOracleClient({ libDir: "/opt/oracle/instantclient_21_12" });
} catch (err: any) {
  if (err.code === 1) {
    // 已初始化，忽略
  } else {
    console.warn("[Oracle] Failed to initialize client:", err.message);
  }
}

export interface OracleConnectionConfig {
  host: string;
  port: number;
  database: string; // SID
  username: string;
  password: string;
}

export interface TableMetadata {
  tableName: string;
  columns: ColumnMetadata[];
}

export interface ColumnMetadata {
  columnName: string;
  dataType: string;
  nullable: boolean;
  columnId: number;
  comments?: string;
}

/**
 * 创建 Oracle 连接
 */
export async function createOracleConnection(config: OracleConnectionConfig) {
  try {
    const connection = await oracledb.getConnection({
      user: config.username,
      password: config.password,
      connectionString: `${config.host}:${config.port}/${config.database}`,
    });
    return connection;
  } catch (error: any) {
    throw new Error(`Failed to connect to Oracle: ${error.message}`);
  }
}

/**
 * 获取所有表的元数据
 */
export async function getTableMetadata(
  connection: any,
  tableNames?: string[]
): Promise<TableMetadata[]> {
  try {
    let query = `
      SELECT 
        table_name,
        column_name,
        data_type,
        nullable,
        column_id,
        comments
      FROM user_tab_columns
      LEFT JOIN user_col_comments ON user_tab_columns.table_name = user_col_comments.table_name 
        AND user_tab_columns.column_name = user_col_comments.column_name
    `;

    if (tableNames && tableNames.length > 0) {
      const tableList = tableNames.map((t) => `'${t.toUpperCase()}'`).join(",");
      query += ` WHERE user_tab_columns.table_name IN (${tableList})`;
    }

    query += ` ORDER BY table_name, column_id`;

    const result = await connection.execute(query);

    // 将结果转换为 TableMetadata 格式
    const tableMap = new Map<string, ColumnMetadata[]>();

    result.rows?.forEach((row: any) => {
      const tableName = row[0];
      const columnName = row[1];
      const dataType = row[2];
      const nullable = row[3];
      const columnId = row[4];
      const comments = row[5];

      if (!tableMap.has(tableName)) {
        tableMap.set(tableName, []);
      }

      tableMap.get(tableName)!.push({
        columnName,
        dataType,
        nullable: nullable === "Y",
        columnId,
        comments,
      });
    });

    return Array.from(tableMap.entries()).map(([tableName, columns]) => ({
      tableName,
      columns: columns.sort((a, b) => a.columnId - b.columnId),
    }));
  } catch (error: any) {
    throw new Error(`Failed to get table metadata: ${error.message}`);
  }
}

/**
 * 获取表的示例数据
 */
export async function getTableSampleData(
  connection: any,
  tableName: string,
  limit: number = 5
): Promise<any[]> {
  try {
    const query = `SELECT * FROM ${tableName} WHERE ROWNUM <= :limit`;
    const result = await connection.execute(query, { limit });
    return result.rows || [];
  } catch (error: any) {
    throw new Error(`Failed to get sample data: ${error.message}`);
  }
}

/**
 * 执行 SQL 查询
 */
export async function executeSql(
  connection: any,
  sql: string,
  limit: number = 1000
): Promise<{ rows: any[]; columns: string[]; count: number; executionTimeMs: number }> {
  const startTime = Date.now();

  try {
    // 添加 ROWNUM 限制以防止返回过多数据
    const limitedSql = `
      SELECT * FROM (
        ${sql}
      ) WHERE ROWNUM <= :limit
    `;

    const result = await connection.execute(limitedSql, { limit });

    const executionTimeMs = Date.now() - startTime;

    return {
      rows: result.rows || [],
      columns: result.metaData?.map((m: any) => m.name) || [],
      count: result.rows?.length || 0,
      executionTimeMs,
    };
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    throw new Error(`SQL execution failed: ${error.message} (${executionTimeMs}ms)`);
  }
}

/**
 * 关闭连接
 */
export async function closeConnection(connection: any) {
  try {
    await connection.close();
  } catch (error: any) {
    console.error("[Oracle] Failed to close connection:", error.message);
  }
}

/**
 * 测试连接
 */
export async function testConnection(config: OracleConnectionConfig): Promise<boolean> {
  let connection;
  try {
    connection = await createOracleConnection(config);
    const result = await connection.execute("SELECT 1 FROM DUAL");
    return result.rows?.length === 1;
  } catch (error) {
    return false;
  } finally {
    if (connection) {
      await closeConnection(connection);
    }
  }
}
