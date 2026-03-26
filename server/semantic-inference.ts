/**
 * 语义层 AI 推断模块
 * 使用 Deepseek 推断数据库表和字段的业务含义
 */

import { invokeLLM } from "./_core/llm";

export interface TableMetadata {
  name: string;
  comment: string;
  columns: ColumnMetadata[];
}

export interface ColumnMetadata {
  name: string;
  dataType: string;
  dataLength?: number;
  nullable: boolean;
  comment: string;
}

export interface InferredSemantic {
  tableName: string;
  chineseAlias: string;
  tableDescription: string;
  columns: InferredColumnSemantic[];
}

export interface InferredColumnSemantic {
  columnName: string;
  chineseAlias: string;
  columnDescription: string;
  dataType: string;
  nullable: boolean;
}

/**
 * 使用 AI 推断表和字段的业务含义
 */
export async function inferSemantics(tables: TableMetadata[]): Promise<InferredSemantic[]> {
  // 构建提示词
  const tablesJson = JSON.stringify(tables, null, 2);
  
  const systemPrompt = `你是一个数据库专家。你的任务是分析数据库表和字段的结构，推断它们的业务含义。

对于每个表和字段，你需要：
1. 给出简洁的中文别名（2-4个字）
2. 给出详细的业务描述（一句话，说明这个表/字段的业务用途）

返回格式必须是有效的 JSON，包含以下结构：
{
  "tables": [
    {
      "tableName": "原始表名",
      "chineseAlias": "中文别名",
      "tableDescription": "表的业务描述",
      "columns": [
        {
          "columnName": "字段名",
          "chineseAlias": "字段中文别名",
          "columnDescription": "字段业务描述"
        }
      ]
    }
  ]
}`;

  const userPrompt = `请分析以下数据库表结构，推断每个表和字段的业务含义：

${tablesJson}

请返回推断结果，格式必须是有效的 JSON。`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
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
                        required: ["columnName", "chineseAlias", "columnDescription"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["tableName", "chineseAlias", "tableDescription", "columns"],
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

    // 解析响应
    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);

    // 转换为内部格式
    const result: InferredSemantic[] = parsed.tables.map((table: any) => ({
      tableName: table.tableName,
      chineseAlias: table.chineseAlias,
      tableDescription: table.tableDescription,
      columns: table.columns.map((col: any) => ({
        columnName: col.columnName,
        chineseAlias: col.chineseAlias,
        columnDescription: col.columnDescription,
        dataType: tables
          .find((t) => t.name === table.tableName)
          ?.columns.find((c) => c.name === col.columnName)?.dataType || "UNKNOWN",
        nullable: tables
          .find((t) => t.name === table.tableName)
          ?.columns.find((c) => c.name === col.columnName)?.nullable || false,
      })),
    }));

    return result;
  } catch (error) {
    console.error("AI 推断失败:", error);
    throw error;
  }
}

/**
 * 批量推断语义（分批处理大量表）
 */
export async function inferSemanticsInBatches(
  tables: TableMetadata[],
  batchSize: number = 5
): Promise<InferredSemantic[]> {
  const results: InferredSemantic[] = [];

  for (let i = 0; i < tables.length; i += batchSize) {
    const batch = tables.slice(i, i + batchSize);
    console.log(`处理第 ${Math.floor(i / batchSize) + 1} 批 (${batch.length} 个表)...`);

    const batchResults = await inferSemantics(batch);
    results.push(...batchResults);

    // 避免频繁调用 API
    if (i + batchSize < tables.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
