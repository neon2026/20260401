# Ubuntu 22.04 LTS 完整部署指南

本指南详细说明如何在全新的 Ubuntu 22.04 LTS 服务器上从零开始部署企业 AI 数据咨询系统。

## 目录

1. [系统初始化](#系统初始化)
2. [配置代理访问](#配置代理访问)
3. [安装基础工具](#安装基础工具)
4. [安装 Node.js](#安装-nodejs)
5. [安装 pnpm](#安装-pnpm)
6. [配置 Git](#配置-git)
7. [克隆项目](#克隆项目)
8. [配置环境变量](#配置环境变量)
9. [安装项目依赖](#安装项目依赖)
10. [构建项目](#构建项目)
11. [配置 MySQL](#配置-mysql)
12. [初始化数据库](#初始化数据库)
13. [启动应用](#启动应用)
14. [配置 Nginx 反向代理](#配置-nginx-反向代理)
15. [配置 PM2 管理进程](#配置-pm2-管理进程)
16. [验证部署](#验证部署)

---

## 系统初始化

### 步骤 1：更新系统包

首先，更新系统包列表和已安装的包：

```bash
# 更新包列表
sudo apt update

# 升级已安装的包
sudo apt upgrade -y

# 清理不需要的包
sudo apt autoremove -y
```

**预期输出**：系统会下载最新的包列表，并升级所有可升级的包。

### 步骤 2：安装基础工具

安装后续部署所需的基础工具：

```bash
# 安装基础工具
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    net-tools \
    build-essential \
    python3 \
    python3-pip
```

**预期输出**：所有工具安装完成。

### 步骤 3：验证系统版本

```bash
# 查看 Ubuntu 版本
lsb_release -a

# 查看内核版本
uname -r

# 查看系统架构
uname -m
```

**预期输出**：
```
Distributor ID: Ubuntu
Release: 22.04
Codename: jammy
```

---

## 配置代理访问

由于您的网络需要通过 Clash 代理访问外部资源，我们需要配置系统代理。

### 步骤 1：配置 Bash 环境变量

编辑 `~/.bashrc` 文件，添加代理配置：

```bash
# 打开编辑器
nano ~/.bashrc

# 在文件末尾添加以下内容：
# ===== Proxy Configuration =====
export http_proxy=http://192.168.1.100:7980
export https_proxy=http://192.168.1.100:7980
export ftp_proxy=http://192.168.1.100:7980
export no_proxy=localhost,127.0.0.1,192.168.*
# =============================

# 按 Ctrl+O 保存，Ctrl+X 退出
```

**注意**：将 `192.168.1.100` 替换为您本机的实际 IP 地址。

### 步骤 2：应用代理配置

```bash
# 重新加载 .bashrc
source ~/.bashrc

# 验证代理设置
echo $http_proxy
echo $https_proxy
```

**预期输出**：
```
http://192.168.1.100:7980
http://192.168.1.100:7980
```

### 步骤 3：配置 apt 代理（可选）

如果 apt 也需要代理，编辑 apt 配置文件：

```bash
# 创建 apt 代理配置
sudo tee /etc/apt/apt.conf.d/proxy.conf > /dev/null <<'EOF'
Acquire::http::Proxy "http://192.168.1.100:7980";
Acquire::https::Proxy "http://192.168.1.100:7980";
EOF

# 验证配置
sudo cat /etc/apt/apt.conf.d/proxy.conf
```

### 步骤 4：测试代理连接

```bash
# 测试 HTTP 连接
curl -I http://www.google.com

# 测试 HTTPS 连接
curl -I https://www.google.com

# 测试 GitHub 连接
curl -I https://github.com
```

**预期输出**：HTTP 状态码 200 或 301（重定向）。

---

## 安装基础工具

### 步骤 1：安装 curl 和 wget

```bash
# 验证 curl 和 wget 是否已安装
curl --version
wget --version
```

**预期输出**：显示版本号。

### 步骤 2：安装 Git

```bash
# 验证 Git 是否已安装
git --version

# 如果未安装，执行
sudo apt install -y git
```

**预期输出**：
```
git version 2.34.1
```

### 步骤 3：配置 Git 用户信息

```bash
# 配置全局用户名
git config --global user.name "Your Name"

# 配置全局邮箱
git config --global user.email "your.email@example.com"

# 验证配置
git config --global user.name
git config --global user.email
```

**预期输出**：显示您配置的用户名和邮箱。

---

## 安装 Node.js

### 步骤 1：添加 NodeSource 仓库

NodeSource 提供了最新的 Node.js 版本。我们将使用 Node.js 18 LTS：

```bash
# 下载 NodeSource 安装脚本
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 如果上面的命令失败，使用代理重试
curl -x http://192.168.1.100:7980 -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

**预期输出**：
```
## Confirming "jammy" is supported...
## Adding NodeSource signing key to your keyring...
## Creating apt sources list file for NodeSource repo...
## Running apt-get update for you...
```

### 步骤 2：安装 Node.js

```bash
# 安装 Node.js 和 npm
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

**预期输出**：
```
v18.20.4
9.8.1
```

### 步骤 3：升级 npm（可选）

```bash
# 升级 npm 到最新版本
sudo npm install -g npm@latest

# 验证升级
npm --version
```

---

## 安装 pnpm

### 步骤 1：使用 npm 安装 pnpm

```bash
# 全局安装 pnpm 8
sudo npm install -g pnpm@8

# 验证安装
pnpm --version
```

**预期输出**：
```
8.15.x
```

### 步骤 2：配置 pnpm 存储目录（可选）

```bash
# 查看 pnpm 配置
pnpm config get store-dir

# 如果需要修改存储目录
pnpm config set store-dir ~/.pnpm-store
```

### 步骤 3：配置 pnpm 代理（如果需要）

```bash
# 配置 pnpm 使用代理
pnpm config set https-proxy http://192.168.1.100:7980
pnpm config set http-proxy http://192.168.1.100:7980

# 验证配置
pnpm config list | grep proxy
```

---

## 配置 Git

### 步骤 1：配置 Git 代理

由于 GitHub 可能需要代理访问，配置 Git 使用代理：

```bash
# 配置 Git HTTP 代理
git config --global http.proxy http://192.168.1.100:7980
git config --global https.proxy http://192.168.1.100:7980

# 配置 Git HTTPS 代理（如果需要）
git config --global https.proxy http://192.168.1.100:7980

# 验证配置
git config --global --list | grep proxy
```

**预期输出**：
```
http.proxy=http://192.168.1.100:7980
https.proxy=http://192.168.1.100:7980
```

### 步骤 2：配置 SSH 密钥（可选，用于 GitHub）

如果您想使用 SSH 而不是 HTTPS 克隆 GitHub 仓库：

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your.email@example.com"

# 按 Enter 接受默认位置
# 输入密码（可选）

# 查看公钥
cat ~/.ssh/id_ed25519.pub

# 复制公钥内容，添加到 GitHub Settings > SSH and GPG keys
```

### 步骤 3：测试 Git 连接

```bash
# 测试 HTTPS 连接
git clone https://github.com/neon2026/enterprise-ai-solution-showcase.git /tmp/test-clone
rm -rf /tmp/test-clone

# 或者测试 SSH 连接（如果已配置）
ssh -T git@github.com
```

**预期输出**：
```
Hi neon2026! You've successfully authenticated, but GitHub does not provide shell access.
```

---

## 克隆项目

### 步骤 1：创建项目目录

```bash
# 创建项目目录
sudo mkdir -p /home/enterprise-ai-solution

# 设置目录权限（使用当前用户）
sudo chown -R $USER:$USER /home/enterprise-ai-solution

# 进入目录
cd /home/enterprise-ai-solution
```

### 步骤 2：克隆 GitHub 仓库

```bash
# 克隆项目
git clone https://github.com/neon2026/enterprise-ai-solution-showcase.git .

# 验证克隆成功
ls -la

# 查看项目文件
ls -la | head -20
```

**预期输出**：
```
total 728
drwxr-xr-x  9 user user   4096 Mar 27 15:12 .
drwxr-xr-x  4 user user     79 Mar 27 14:27 ..
-rw-r--r--  1 user user    388 Mar 27 11:45 components.json
-rw-r--r--  1 user user   3910 Mar 27 11:45 CONTENT_STRUCTURE.md
drwxr-xr-x  4 user user     49 Mar 27 11:45 client
drwxr-xr-x  4 user user    213 Mar 27 11:45 drizzle
-rw-r--r--  1 user user   3873 Mar 27 14:27 package.json
...
```

### 步骤 3：验证项目文件

```bash
# 检查关键文件是否存在
test -f package.json && echo "✓ package.json 存在"
test -f pnpm-lock.yaml && echo "✓ pnpm-lock.yaml 存在"
test -d client && echo "✓ client 目录存在"
test -d server && echo "✓ server 目录存在"
test -d drizzle && echo "✓ drizzle 目录存在"
```

**预期输出**：所有文件都存在。

---

## 配置环境变量

### 步骤 1：复制环境配置模板

```bash
# 进入项目目录
cd /home/enterprise-ai-solution

# 复制环境配置文件
cp .env.docker.example .env.docker

# 查看文件内容
cat .env.docker
```

**预期输出**：显示所有环境变量。

### 步骤 2：编辑环境配置

使用编辑器打开 `.env.docker` 文件并配置关键参数：

```bash
# 使用 nano 编辑
nano .env.docker

# 或使用 vim
vim .env.docker
```

**需要修改的关键参数**：

```bash
# 1. 数据库配置
DATABASE_URL=mysql://appuser:your-secure-password@localhost:3306/enterprise_ai
MYSQL_ROOT_PASSWORD=your-mysql-root-password
MYSQL_USER=appuser
MYSQL_PASSWORD=your-secure-password

# 2. Oracle 数据库配置
ORACLE_HOST=192.168.59.166        # 您的 Oracle 服务器 IP
ORACLE_PORT=1521
ORACLE_SID=orcl
ORACLE_USER=neon
ORACLE_PASSWORD=oracle

# 3. API 密钥
DEEPSEEK_API_KEY=sk-105b5973d1744993a6fceab8e8efcb48
JWT_SECRET=your-production-jwt-secret-min-32-chars-long

# 4. OAuth 配置（如果使用 Manus）
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# 5. Manus APIs
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key

# 6. 分析配置
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# 7. 应用配置
VITE_APP_TITLE=Enterprise AI Solution
VITE_APP_LOGO=https://example.com/logo.png

# 8. 环境
NODE_ENV=production
```

### 步骤 3：验证配置

```bash
# 验证关键环境变量是否已设置
grep -E "ORACLE_HOST|DEEPSEEK_API_KEY|DATABASE_URL" .env.docker

# 检查是否有空值
grep "=\s*$" .env.docker || echo "✓ 没有空值"
```

---

## 安装项目依赖

### 步骤 1：清理之前的安装（如果有）

```bash
# 进入项目目录
cd /home/enterprise-ai-solution

# 删除旧的 node_modules 和 lock 文件
rm -rf node_modules pnpm-lock.yaml

# 验证删除
ls -la | grep -E "node_modules|pnpm-lock"
```

### 步骤 2：安装依赖

```bash
# 使用 pnpm 安装依赖
pnpm install

# 这会花费 2-5 分钟，取决于网络速度
```

**预期输出**：
```
Progress: resolved 887, reused 0, downloaded 456, added 456, done
```

### 步骤 3：验证安装

```bash
# 验证 node_modules 是否存在
test -d node_modules && echo "✓ node_modules 已安装"

# 检查关键包是否存在
pnpm list | head -20

# 验证 vite 是否已安装
pnpm list vite
```

**预期输出**：
```
vite 4.5.14
```

---

## 构建项目

### 步骤 1：构建前验证

```bash
# 进入项目目录
cd /home/enterprise-ai-solution

# 验证 Vite 配置
test -f vite.config.ts && echo "✓ vite.config.ts 存在"

# 验证 TypeScript 配置
test -f tsconfig.json && echo "✓ tsconfig.json 存在"
```

### 步骤 2：执行构建

```bash
# 构建项目（这会花费 3-10 分钟）
pnpm build

# 查看构建进度
# 预期输出：
# vite v4.5.14 building for production...
# ✓ 123 modules transformed.
# dist/index.html                   0.45 kB │ gzip:   0.30 kB
# dist/assets/index-xxx.js        123.45 kB │ gzip:  45.67 kB
# ✓ built in 45.23s
```

### 步骤 3：验证构建结果

```bash
# 检查 dist 目录是否存在
test -d dist && echo "✓ dist 目录已生成"

# 查看构建输出
ls -la dist/

# 验证主要文件
test -f dist/index.js && echo "✓ dist/index.js 存在"
test -f dist/index.html && echo "✓ dist/index.html 存在"
```

**预期输出**：
```
total 2048
-rw-r--r-- 1 user user 1024000 Mar 27 15:30 index.js
-rw-r--r-- 1 user user   45000 Mar 27 15:30 index.html
```

---

## 配置 MySQL

### 步骤 1：安装 MySQL 服务器

```bash
# 安装 MySQL 8.0
sudo apt install -y mysql-server

# 验证安装
mysql --version
```

**预期输出**：
```
mysql  Ver 8.0.36-0ubuntu0.22.04.1 for Linux on x86_64
```

### 步骤 2：启动 MySQL 服务

```bash
# 启动 MySQL 服务
sudo systemctl start mysql

# 设置开机自启
sudo systemctl enable mysql

# 验证服务状态
sudo systemctl status mysql
```

**预期输出**：
```
● mysql.service - MySQL Community Server
     Loaded: loaded (/lib/systemd/system/mysql.service; enabled; vendor preset: enabled)
     Active: active (running)
```

### 步骤 3：初始化 MySQL 安全设置

```bash
# 运行 MySQL 安全初始化
sudo mysql_secure_installation

# 按照提示操作：
# 1. 输入 root 密码（首次为空，直接按 Enter）
# 2. 是否设置 root 密码？ → 选择 Y
# 3. 输入新的 root 密码
# 4. 确认密码
# 5. 其他选项选择 Y（删除匿名用户、禁用远程 root 登录等）
```

### 步骤 4：创建应用数据库和用户

```bash
# 以 root 身份登录 MySQL
sudo mysql -u root -p

# 输入您设置的 root 密码

# 在 MySQL 命令行中执行以下命令：

# 创建数据库
CREATE DATABASE enterprise_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建应用用户
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'your-secure-password';

# 授予权限
GRANT ALL PRIVILEGES ON enterprise_ai.* TO 'appuser'@'localhost';

# 刷新权限
FLUSH PRIVILEGES;

# 验证创建
SHOW DATABASES;
SELECT User FROM mysql.user;

# 退出 MySQL
EXIT;
```

**预期输出**：
```
mysql> CREATE DATABASE enterprise_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
Query OK, 1 row affected (0.01 sec)

mysql> CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'your-secure-password';
Query OK, 0 rows affected (0.01 sec)

mysql> GRANT ALL PRIVILEGES ON enterprise_ai.* TO 'appuser'@'localhost';
Query OK, 0 rows affected (0.01 sec)
```

### 步骤 5：验证数据库连接

```bash
# 使用应用用户登录
mysql -u appuser -p enterprise_ai

# 输入密码

# 验证连接
SELECT VERSION();

# 退出
EXIT;
```

**预期输出**：
```
mysql> SELECT VERSION();
+-----------+
| VERSION() |
+-----------+
| 8.0.36    |
+-----------+
1 row in set (0.00 sec)
```

---

## 初始化数据库

### 步骤 1：运行数据库迁移

```bash
# 进入项目目录
cd /home/enterprise-ai-solution

# 运行数据库迁移
pnpm db:push

# 这会根据 drizzle 配置生成迁移文件并应用到数据库
```

**预期输出**：
```
Applying migrations...
✓ Applied migration: 0001_initial_schema
✓ Applied migration: 0002_add_tables
...
Database migration completed successfully!
```

### 步骤 2：验证数据库表

```bash
# 登录 MySQL 验证表是否创建
mysql -u appuser -p enterprise_ai

# 查看所有表
SHOW TABLES;

# 查看表结构
DESCRIBE users;
DESCRIBE database_connections;
DESCRIBE semantic_definitions;

# 退出
EXIT;
```

**预期输出**：
```
mysql> SHOW TABLES;
+---------------------------+
| Tables_in_enterprise_ai   |
+---------------------------+
| users                     |
| database_connections      |
| semantic_definitions      |
| query_history             |
| ...                       |
+---------------------------+
```

---

## 启动应用

### 步骤 1：直接运行应用（测试）

```bash
# 进入项目目录
cd /home/enterprise-ai-solution

# 直接运行应用
node dist/index.js

# 预期输出：
# Server running on http://localhost:3000
# Database connected successfully
```

### 步骤 2：验证应用是否正常运行

在另一个终端窗口中：

```bash
# 测试应用是否响应
curl http://localhost:3000

# 或者使用 wget
wget -q -O - http://localhost:3000 | head -20

# 测试 API 端点
curl http://localhost:3000/api/health
```

**预期输出**：
```
<!DOCTYPE html>
<html>
  <head>
    <title>Enterprise AI Solution</title>
    ...
  </head>
</html>
```

### 步骤 3：停止应用

在运行应用的终端中按 `Ctrl+C` 停止应用。

---

## 配置 Nginx 反向代理

### 步骤 1：安装 Nginx

```bash
# 安装 Nginx
sudo apt install -y nginx

# 验证安装
nginx -v
```

**预期输出**：
```
nginx version: nginx/1.18.0 (Ubuntu)
```

### 步骤 2：创建 Nginx 配置文件

```bash
# 创建 Nginx 配置文件
sudo tee /etc/nginx/sites-available/enterprise-ai > /dev/null <<'EOF'
upstream enterprise_ai {
    server localhost:3000;
}

server {
    listen 80;
    server_name _;

    # 日志文件
    access_log /var/log/nginx/enterprise-ai-access.log;
    error_log /var/log/nginx/enterprise-ai-error.log;

    # 反向代理配置
    location / {
        proxy_pass http://enterprise_ai;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://enterprise_ai;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查端点
    location /health {
        access_log off;
        proxy_pass http://enterprise_ai;
    }
}
EOF

# 验证配置文件
cat /etc/nginx/sites-available/enterprise-ai
```

### 步骤 3：启用 Nginx 配置

```bash
# 创建符号链接到 sites-enabled
sudo ln -sf /etc/nginx/sites-available/enterprise-ai /etc/nginx/sites-enabled/enterprise-ai

# 禁用默认配置（可选）
sudo rm -f /etc/nginx/sites-enabled/default

# 验证 Nginx 配置语法
sudo nginx -t

# 预期输出：
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 步骤 4：启动 Nginx 服务

```bash
# 启动 Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx

# 验证服务状态
sudo systemctl status nginx
```

**预期输出**：
```
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running)
```

### 步骤 5：测试 Nginx 反向代理

```bash
# 测试本地连接
curl http://localhost

# 或者使用服务器 IP 地址
curl http://<your-server-ip>

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/enterprise-ai-access.log
```

---

## 配置 PM2 管理进程

### 步骤 1：安装 PM2

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 --version
```

**预期输出**：
```
5.3.x
```

### 步骤 2：创建 PM2 配置文件

```bash
# 进入项目目录
cd /home/enterprise-ai-solution

# 创建 PM2 配置文件
cat > ecosystem.config.js <<'EOF'
module.exports = {
  apps: [
    {
      name: 'enterprise-ai-solution',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // 日志配置
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 自动重启配置
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_memory_restart: '1G',
      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 3000,
      // 崩溃重启
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# 验证配置文件
cat ecosystem.config.js
```

### 步骤 3：创建日志目录

```bash
# 创建日志目录
mkdir -p logs

# 验证目录
ls -la logs/
```

### 步骤 4：使用 PM2 启动应用

```bash
# 使用 PM2 启动应用
pm2 start ecosystem.config.js

# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs enterprise-ai-solution

# 查看实时监控
pm2 monit
```

**预期输出**：
```
┌─────┬──────────────────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name                     │ version │ mode    │ status  │ restart  │
├─────┼──────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ enterprise-ai-solution   │ 1.0.0   │ cluster │ online  │ 0        │
└─────┴──────────────────────────┴─────────┴─────────┴─────────┴──────────┘
```

### 步骤 5：配置 PM2 开机自启

```bash
# 生成 PM2 开机自启脚本
sudo pm2 startup systemd -u $USER --hp /home/$USER

# 保存当前 PM2 进程列表
pm2 save

# 验证开机自启配置
sudo systemctl status pm2-$USER

# 重启系统测试（可选）
# sudo reboot
```

### 步骤 6：PM2 常用命令

```bash
# 查看所有进程
pm2 list

# 查看特定进程的日志
pm2 logs enterprise-ai-solution

# 查看进程详细信息
pm2 show enterprise-ai-solution

# 重启应用
pm2 restart enterprise-ai-solution

# 停止应用
pm2 stop enterprise-ai-solution

# 删除应用
pm2 delete enterprise-ai-solution

# 查看 PM2 监控信息
pm2 monit

# 保存进程列表
pm2 save

# 清空 PM2 日志
pm2 flush
```

---

## 验证部署

### 步骤 1：验证所有服务状态

```bash
# 检查 Node.js
node --version

# 检查 pnpm
pnpm --version

# 检查 MySQL
sudo systemctl status mysql

# 检查 Nginx
sudo systemctl status nginx

# 检查 PM2
pm2 status
```

### 步骤 2：验证应用可访问性

```bash
# 测试本地访问
curl http://localhost

# 测试通过 Nginx 访问
curl http://localhost:80

# 测试通过服务器 IP 访问
curl http://<your-server-ip>

# 测试 API 端点
curl http://localhost/api/health
```

### 步骤 3：验证数据库连接

```bash
# 测试 MySQL 连接
mysql -u appuser -p enterprise_ai -e "SELECT 1;"

# 查看应用日志中的数据库连接信息
pm2 logs enterprise-ai-solution | grep -i database
```

### 步骤 4：验证 Oracle 连接

通过应用 UI 测试 Oracle 连接：

```bash
# 打开浏览器访问应用
# http://<your-server-ip>

# 导航到 "数据库连接" 页面
# 输入 Oracle 连接信息
# 点击 "测试连接" 按钮
# 验证连接是否成功
```

### 步骤 5：查看应用日志

```bash
# 查看 PM2 应用日志
pm2 logs enterprise-ai-solution

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/enterprise-ai-access.log

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/enterprise-ai-error.log

# 查看 MySQL 错误日志
sudo tail -f /var/log/mysql/error.log
```

---

## 故障排查

### 问题 1：应用无法启动

```bash
# 查看详细错误日志
pm2 logs enterprise-ai-solution

# 检查环境变量是否正确设置
cat /home/enterprise-ai-solution/.env.docker

# 检查数据库连接
mysql -u appuser -p enterprise_ai -e "SELECT 1;"

# 手动运行应用查看错误
cd /home/enterprise-ai-solution
node dist/index.js
```

### 问题 2：无法访问应用

```bash
# 检查 Nginx 是否运行
sudo systemctl status nginx

# 检查 PM2 应用是否运行
pm2 status

# 检查端口是否被占用
sudo netstat -tlnp | grep 3000
sudo netstat -tlnp | grep 80

# 检查防火墙规则
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 问题 3：数据库连接失败

```bash
# 检查 MySQL 是否运行
sudo systemctl status mysql

# 检查数据库是否存在
mysql -u appuser -p enterprise_ai -e "SHOW TABLES;"

# 检查用户权限
mysql -u root -p -e "SELECT User, Host FROM mysql.user;"

# 重新初始化数据库
cd /home/enterprise-ai-solution
pnpm db:push
```

### 问题 4：Oracle 连接失败

```bash
# 检查 Oracle 服务器是否可访问
ping 192.168.59.166

# 检查 Oracle 端口是否开放
nc -zv 192.168.59.166 1521

# 查看应用日志中的 Oracle 错误
pm2 logs enterprise-ai-solution | grep -i oracle
```

### 问题 5：代理连接问题

```bash
# 测试代理连接
curl -x http://192.168.1.100:7980 http://www.google.com

# 检查代理设置
echo $http_proxy
echo $https_proxy

# 检查 Git 代理设置
git config --global --list | grep proxy

# 检查 pnpm 代理设置
pnpm config list | grep proxy
```

---

## 性能优化建议

### 1. 增加 Node.js 进程数

编辑 `ecosystem.config.js`，修改 `instances` 值：

```javascript
instances: 'max',  // 使用所有 CPU 核心
```

### 2. 配置 Nginx 缓存

在 Nginx 配置中添加缓存：

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 1h;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### 3. 启用 Gzip 压缩

在 Nginx 配置中启用 Gzip：

```nginx
gzip on;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
gzip_min_length 1000;
```

### 4. 配置 MySQL 性能参数

编辑 `/etc/mysql/mysql.conf.d/mysqld.cnf`：

```ini
max_connections = 200
query_cache_size = 64M
innodb_buffer_pool_size = 1G
```

---

## 安全建议

### 1. 配置防火墙

```bash
# 启用防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP
sudo ufw allow 80/tcp

# 允许 HTTPS
sudo ufw allow 443/tcp

# 拒绝其他所有连接
sudo ufw default deny incoming
```

### 2. 配置 SSL/TLS 证书

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 Let's Encrypt 证书
sudo certbot certonly --nginx -d your-domain.com

# 自动续期
sudo systemctl enable certbot.timer
```

### 3. 定期备份

```bash
# 备份 MySQL 数据库
mysqldump -u appuser -p enterprise_ai > /backup/enterprise_ai_$(date +%Y%m%d).sql

# 备份应用文件
tar -czf /backup/app_$(date +%Y%m%d).tar.gz /home/enterprise-ai-solution
```

---

## 总结

您已经成功完成了以下步骤：

✅ 系统初始化和代理配置
✅ 安装 Node.js 和 pnpm
✅ 配置 Git 和克隆项目
✅ 安装项目依赖和构建
✅ 配置 MySQL 数据库
✅ 初始化数据库迁移
✅ 配置 Nginx 反向代理
✅ 使用 PM2 管理应用进程
✅ 验证部署和测试应用

应用现在应该可以通过以下地址访问：

- 本地访问：http://localhost
- 服务器 IP：http://<your-server-ip>
- 如果配置了域名：http://your-domain.com

---

## 常用命令速查表

```bash
# 启动/停止/重启应用
pm2 start ecosystem.config.js
pm2 stop enterprise-ai-solution
pm2 restart enterprise-ai-solution

# 查看日志
pm2 logs enterprise-ai-solution
tail -f /var/log/nginx/enterprise-ai-access.log

# 重启 Nginx
sudo systemctl restart nginx

# 重启 MySQL
sudo systemctl restart mysql

# 查看系统资源使用
pm2 monit
htop

# 查看进程状态
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql
```

---

**最后更新**：2026-03-27

**维护者**：Enterprise AI Team
