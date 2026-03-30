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
        dtc.table_name,
        dtc.column_name,
        dtc.data_type,
        dtc.nullable,
        dtc.column_id,
        dcc.comments
      FROM dba_tab_columns dtc
      LEFT JOIN dba_col_comments dcc ON dtc.table_name = dcc.table_name 
        AND dtc.column_name = dcc.column_name
        AND dtc.owner = dcc.owner
    `;

    if (tableNames && tableNames.length > 0) {
      const tableList = tableNames.map((t) => `'${t.toUpperCase()}'`).join(",");
      query += ` WHERE dtc.table_name IN (${tableList})`;
    }

    query += ` ORDER BY dtc.table_name, dtc.column_id`;

    console.log('[Oracle] Executing metadata query...');
    // 设置 fetchSize 来控制一次获取的行数，避免内存溢出
    const result = await connection.execute(query, {}, { 
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      fetchSize: 5000  // 每次获取 5000 行
    });
    console.log(`[Oracle] Query returned ${result.rows?.length || 0} rows`);

    // 将结果转换为 TableMetadata 格式
    const tableMap = new Map<string, ColumnMetadata[]>();

    result.rows?.forEach((row: any) => {
      const tableName = Array.isArray(row) ? row[0] : (row as any).TABLE_NAME;
      const columnName = Array.isArray(row) ? row[1] : (row as any).COLUMN_NAME;
      const dataType = Array.isArray(row) ? row[2] : (row as any).DATA_TYPE;
      const nullable = Array.isArray(row) ? row[3] : (row as any).NULLABLE;
      const columnId = Array.isArray(row) ? row[4] : (row as any).COLUMN_ID;
      const comments = Array.isArray(row) ? row[5] : (row as any).COMMENTS;

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

    const result_tables = Array.from(tableMap.entries()).map(([tableName, columns]) => ({
      tableName,
      columns: columns.sort((a, b) => a.columnId - b.columnId),
    }));
    console.log(`[Oracle] Extracted ${result_tables.length} unique tables`);
    return result_tables;
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
  limit: number = 10000
): Promise<{ rows: any[]; columns: string[]; count: number; executionTimeMs: number }> {
  const startTime = Date.now();

  try {
    // 添加 ROWNUM 限制以防止返回过多数据
    const limitedSql = `
      SELECT * FROM (
        ${sql}
      ) WHERE ROWNUM <= :limit
    `;

    // 设置 outFormat 为对象格式，这样行数据会是对象而不是数组
    const result = await connection.execute(limitedSql, { limit }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const executionTimeMs = Date.now() - startTime;

    // 获取列名
    const columns = result.metaData?.map((m: any) => m.name) || [];
    
    // 如果 rows 是数组格式（旧版本 oracledb），转换为对象格式
    let rows = result.rows || [];
    if (rows.length > 0 && Array.isArray(rows[0])) {
      rows = rows.map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col: string, idx: number) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    }

    return {
      rows,
      columns,
      count: rows.length,
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
