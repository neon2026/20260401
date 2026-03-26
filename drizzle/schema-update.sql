-- 添加语义层表的 comment 列
-- 这个脚本用于扩展现有的语义层表，添加更详细的注释字段

-- 如果表不存在，创建新表
CREATE TABLE IF NOT EXISTS semantic_table_definitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  connectionId INT NOT NULL,
  tableName VARCHAR(255) NOT NULL,
  chineseAlias VARCHAR(255),
  tableDescription TEXT,
  comment TEXT COMMENT '精细化的业务注释',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_table (connectionId, tableName),
  FOREIGN KEY (connectionId) REFERENCES database_connections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS semantic_column_definitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tableDefinitionId INT NOT NULL,
  columnName VARCHAR(255) NOT NULL,
  chineseAlias VARCHAR(255),
  columnDescription TEXT,
  comment TEXT COMMENT '精细化的业务注释',
  dataType VARCHAR(100),
  nullable BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_column (tableDefinitionId, columnName),
  FOREIGN KEY (tableDefinitionId) REFERENCES semantic_table_definitions(id) ON DELETE CASCADE
);

-- 如果列已存在，则忽略错误
ALTER TABLE semantic_table_definitions ADD COLUMN comment TEXT COMMENT '精细化的业务注释';
ALTER TABLE semantic_column_definitions ADD COLUMN comment TEXT COMMENT '精细化的业务注释';
