# 本地认证系统指南

## 概述

本应用已从 Manus OAuth 迁移到本地用户名/密码认证系统。这使得应用可以在无法访问外部 OAuth 服务的网络环境中运行。

## 快速开始

### 默认测试账号

应用启动时会自动创建以下测试账号：

- **用户名**: `admin`
- **密码**: `admin123`
- **角色**: `admin`

### 登录流程

1. 访问应用首页
2. 在登录页面输入用户名和密码
3. 点击"登录"按钮
4. 登录成功后，应用会自动跳转到主页面

## 系统架构

### 后端实现

#### 文件位置
- `server/_core/local-auth.ts` - 本地认证核心模块
- `server/_core/index.ts` - 服务器启动文件（已集成本地认证）

#### 主要功能

**1. 密码哈希**
```typescript
function hashPassword(password: string): string
```
使用 SHA256 算法对密码进行哈希处理。

**2. 用户验证**
```typescript
function verifyCredentials(username: string, password: string): boolean
```
验证用户名和密码是否匹配。

**3. 用户初始化**
```typescript
async function initializeLocalUsers()
```
在应用启动时初始化默认测试用户。

#### API 端点

**POST /api/auth/login**

登录端点，接收用户名和密码。

请求体：
```json
{
  "username": "admin",
  "password": "admin123"
}
```

响应（成功）：
```json
{
  "success": true,
  "user": {
    "id": 1,
    "openId": "local-user-1",
    "name": "Admin User",
    "email": "admin@localhost",
    "role": "admin"
  }
}
```

响应（失败）：
```json
{
  "error": "Invalid username or password"
}
```

**POST /api/auth/register**

注册新用户端点。

请求体：
```json
{
  "username": "newuser",
  "password": "password123",
  "name": "New User",
  "email": "user@example.com"
}
```

### 前端实现

#### 文件位置
- `client/src/pages/Login.tsx` - 登录页面组件
- `client/src/App.tsx` - 应用路由（已集成登录页面）
- `client/src/main.tsx` - 前端启动文件（已更新重定向逻辑）

#### 登录页面特性

- 用户名和密码输入框
- 登录按钮（带加载状态）
- 测试账号提示
- 错误提示和成功提示

#### 认证流程

1. 用户在登录页面输入凭证
2. 前端发送 POST 请求到 `/api/auth/login`
3. 后端验证凭证并返回用户信息
4. 前端接收响应，设置会话 cookie
5. 页面重新加载以刷新认证状态
6. 应用路由检查认证状态，显示主页面或登录页面

## 会话管理

### 会话 Cookie

登录成功后，服务器会设置一个会话 cookie：

- **名称**: `session`
- **有效期**: 1 年
- **安全标志**: HttpOnly（防止 JavaScript 访问）
- **格式**: JWT token，包含用户 openId 和应用 ID

### 会话验证

每个 API 请求都会通过以下流程验证会话：

1. 从请求 cookie 中提取会话 token
2. 使用 JWT 验证 token 签名
3. 从 token 中提取用户信息
4. 从数据库查询完整用户信息
5. 将用户信息注入到 tRPC 上下文

## 数据库集成

### 用户表结构

用户信息存储在 MySQL 数据库的 `users` 表中：

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  loginMethod VARCHAR(50),
  role ENUM('user', 'admin') DEFAULT 'user',
  lastSignedIn TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 本地用户存储

本地用户的用户名和密码哈希存储在内存中（`localUsers` 对象）。在生产环境中，建议将其扩展为数据库存储。

## 扩展和自定义

### 添加新用户

#### 方式 1：通过注册 API

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "name": "New User",
    "email": "user@example.com"
  }'
```

#### 方式 2：修改代码

编辑 `server/_core/local-auth.ts` 中的 `initializeLocalUsers()` 函数，添加更多用户：

```typescript
localUsers["newuser"] = {
  passwordHash: hashPassword("password123"),
  userId: "local-user-2",
};
```

### 修改密码策略

当前使用 SHA256 哈希。为了增强安全性，建议在生产环境中使用 bcrypt：

```bash
pnpm add bcrypt
```

然后修改 `local-auth.ts`：

```typescript
import bcrypt from "bcrypt";

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function verifyCredentials(username: string, password: string): boolean {
  const user = localUsers[username];
  if (!user) return false;
  return bcrypt.compareSync(password, user.passwordHash);
}
```

### 持久化用户存储

当前用户存储在内存中，应用重启后会重置。为了持久化存储，可以将用户信息保存到数据库：

1. 在 `drizzle/schema.ts` 中添加本地用户表
2. 在 `server/db.ts` 中添加查询方法
3. 修改 `local-auth.ts` 以从数据库读写用户信息

## 测试

### 单元测试

运行本地认证单元测试：

```bash
pnpm test server/local-auth.test.ts
```

### 集成测试

运行 API 集成测试（需要开发服务器运行）：

```bash
# 终端 1：启动开发服务器
pnpm dev

# 终端 2：运行集成测试
pnpm test server/local-auth-api.test.ts
```

### 手动测试

1. 启动开发服务器：`pnpm dev`
2. 访问 http://localhost:3000
3. 使用测试账号登录：
   - 用户名: `admin`
   - 密码: `admin123`
4. 验证登录成功并可以访问应用功能

## 故障排查

### 问题：登录失败，显示"Invalid username or password"

**解决方案**：
- 检查用户名和密码是否正确
- 确保开发服务器已启动
- 检查浏览器控制台是否有错误信息

### 问题：登录成功但页面不跳转

**解决方案**：
- 检查浏览器控制台是否有 JavaScript 错误
- 清除浏览器 cookie 并重试
- 检查网络请求是否成功（F12 开发者工具 > Network 标签）

### 问题：会话 cookie 未设置

**解决方案**：
- 检查服务器日志是否有错误
- 确保 HTTPS（如果在生产环境）
- 检查浏览器 cookie 设置是否允许第三方 cookie

## 迁移到 OAuth（可选）

如果将来需要迁移回 OAuth，可以：

1. 保留本地认证作为备选方案
2. 在 `server/_core/index.ts` 中注册两个认证路由
3. 在前端登录页面提供选择选项

## 安全建议

1. **生产环境**：
   - 使用 bcrypt 或 argon2 进行密码哈希
   - 将用户信息存储在数据库而不是内存
   - 启用 HTTPS
   - 实施速率限制防止暴力破解
   - 添加 CSRF 保护

2. **密码策略**：
   - 要求最小密码长度（至少 8 个字符）
   - 要求密码复杂性（大小写、数字、特殊字符）
   - 定期更改密码
   - 实施密码历史记录

3. **会话管理**：
   - 设置合理的会话超时时间
   - 实施会话刷新机制
   - 添加"记住我"功能时要谨慎

## 相关文件

- `server/_core/local-auth.ts` - 本地认证核心模块
- `server/_core/index.ts` - 服务器启动和路由注册
- `client/src/pages/Login.tsx` - 登录页面组件
- `client/src/App.tsx` - 应用路由
- `client/src/main.tsx` - 前端启动和错误处理
- `server/local-auth.test.ts` - 单元测试
- `server/local-auth-api.test.ts` - 集成测试
