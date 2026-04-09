
import { invokeLLM } from "./server/_core/llm";

async function testAiQuery() {
  // 模拟从数据库中获取的 Schema 信息（优化后的详细格式）
  const schemaInfo = `
物理表名: STAFF
业务名称: 医生表
业务描述: 存储医院所有医生和医护人员的基本信息
字段列表:
  - STAFF_ID (工号): 医生的唯一标识符
  - NAME (姓名): 医生的真实姓名
  - DEPT_ID (科室ID): 所属科室的编号
  - TITLE (职称): 如主任医师、副主任医师等
  - PHONE (联系电话): 医生的办公电话

物理表名: PATIENT
业务名称: 患者表
业务描述: 存储所有就诊患者的基本资料
字段列表:
  - PATIENT_ID (患者ID): 患者唯一标识
  - NAME (姓名): 患者姓名
  - GENDER (性别): 男/女
  - BIRTH_DATE (出生日期): 患者生日
`;

  const userQuestion = "查询医生表的内容";

  const sqlPrompt = `
你是一个专业的 Oracle SQL 专家。请根据提供的数据库 Schema 信息，将用户的自然语言问题转换为精准的 Oracle SQL。

### 数据库 Schema 信息 (物理表名与业务含义对照):
${schemaInfo}

### 用户问题: 
${userQuestion}

### 核心规则 (必须遵守):
1. **物理表名优先**: 必须使用上面列出的“物理表名”（如 STAFF, PATIENT），严禁在 SQL 中直接使用中文业务名称。
2. **字段映射**: 参考字段列表中的“业务名称”来确定对应的“物理字段名”。
3. **Oracle 语法**: 使用标准的 Oracle SQL 语法（如使用 ROWNUM 限制行数，不要使用 LIMIT）。
4. **禁止分号**: SQL 语句末尾不要添加分号。
5. **仅返回 SQL**: 不要包含任何解释、Markdown 格式或代码块标记，只返回纯文本 SQL。

请生成 SQL:
`;

  console.log("--- 正在调用 AI 生成 SQL ---");
  const response = await invokeLLM({
    messages: [{ role: "user", content: sqlPrompt }]
  });

  const generatedSQL = typeof response.choices[0].message.content === 'string' 
    ? response.choices[0].message.content.trim() 
    : '';

  console.log("\n[用户问题]:", userQuestion);
  console.log("[生成的 SQL]:", generatedSQL);
}

testAiQuery().catch(console.error);
