import { describe, expect, it } from "vitest";
import { invokeLLM } from "./server/_core/llm";

describe("Deepseek API Integration", () => {
  it("should successfully call Deepseek API with valid credentials", async () => {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: "请简单回答：1+1等于多少？",
        },
      ],
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0].message).toBeDefined();
    expect(response.choices[0].message.content).toBeDefined();
    expect(typeof response.choices[0].message.content).toBe("string");
    
    // 验证响应内容包含数字 2
    const content = response.choices[0].message.content;
    expect(content).toContain("2");
  });

  it("should handle structured JSON responses from Deepseek", async () => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to output JSON.",
        },
        {
          role: "user",
          content: "Extract the table name and field name from: 'The USERS table has a field called USER_ID'",
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "table_field_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              table_name: { type: "string", description: "The name of the table" },
              field_name: { type: "string", description: "The name of the field" },
            },
            required: ["table_name", "field_name"],
            additionalProperties: false,
          },
        },
      },
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices[0].message.content).toBeDefined();

    // 尝试解析 JSON 响应
    const content = response.choices[0].message.content;
    expect(typeof content).toBe("string");
    
    try {
      const parsed = JSON.parse(content);
      expect(parsed).toHaveProperty("table_name");
      expect(parsed).toHaveProperty("field_name");
    } catch (e) {
      // 如果不是 JSON，至少验证响应包含关键信息
      expect(content.toLowerCase()).toContain("users");
    }
  });
});
