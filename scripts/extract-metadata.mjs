#!/usr/bin/env node

/**
 * Oracle 元数据提取脚本
 * 从 Oracle 数据库提取所有表和字段信息，生成 JSON 文件供 AI 分析
 * 
 * 使用方法：
 * node scripts/extract-metadata.mjs --host 192.168.59.166 --port 1521 --database orcl --username neon --password oracle --output metadata.json
 */

import oracledb from 'oracledb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    result[key] = value;
  }
  
  return result;
}

// 从 Oracle 提取元数据
async function extractMetadata(config) {
  let connection;
  
  try {
    console.log('正在连接 Oracle 数据库...');
    connection = await oracledb.getConnection({
      user: config.username,
      password: config.password,
      connectString: `${config.host}:${config.port}/${config.database}`,
    });
    
    console.log('连接成功！正在提取元数据...');
    
    // 获取所有表
    const tablesResult = await connection.execute(
      `SELECT table_name FROM user_tables ORDER BY table_name`
    );
    
    const tables = [];
    
    for (const [tableName] of tablesResult.rows) {
      console.log(`  处理表: ${tableName}`);
      
      // 获取表的注释
      const tableCommentResult = await connection.execute(
        `SELECT comments FROM user_tab_comments WHERE table_name = :tableName`,
        { tableName }
      );
      
      const tableComment = tableCommentResult.rows[0]?.[0] || '';
      
      // 获取字段信息
      const columnsResult = await connection.execute(
        `SELECT 
          column_name, 
          data_type, 
          data_length, 
          nullable,
          column_id
        FROM user_tab_columns 
        WHERE table_name = :tableName 
        ORDER BY column_id`,
        { tableName }
      );
      
      const columns = [];
      for (const [columnName, dataType, dataLength, nullable, columnId] of columnsResult.rows) {
        // 获取字段的注释
        const columnCommentResult = await connection.execute(
          `SELECT comments FROM user_col_comments 
           WHERE table_name = :tableName AND column_name = :columnName`,
          { tableName, columnName }
        );
        
        const columnComment = columnCommentResult.rows[0]?.[0] || '';
        
        columns.push({
          name: columnName,
          dataType: dataType,
          dataLength: dataLength,
          nullable: nullable === 'Y',
          comment: columnComment,
          columnId: columnId,
        });
      }
      
      tables.push({
        name: tableName,
        comment: tableComment,
        columns: columns,
      });
    }
    
    console.log(`\n成功提取 ${tables.length} 个表的元数据`);
    return tables;
    
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// 主函数
async function main() {
  const args = parseArgs();
  
  const config = {
    host: args.host || '192.168.59.166',
    port: parseInt(args.port || '1521'),
    database: args.database || 'orcl',
    username: args.username || 'neon',
    password: args.password || 'oracle',
  };
  
  const outputFile = args.output || path.join(__dirname, '../metadata.json');
  
  try {
    // 初始化 oracledb
    oracledb.initOracleClient();
    
    // 提取元数据
    const metadata = await extractMetadata(config);
    
    // 保存到文件
    const output = {
      extractedAt: new Date().toISOString(),
      database: config.database,
      tableCount: metadata.length,
      tables: metadata,
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n元数据已保存到: ${outputFile}`);
    
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

main();
