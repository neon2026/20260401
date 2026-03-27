# Docker 部署指南 - CentOS 7 生产服务器

本指南详细说明如何在 CentOS 7 生产服务器上使用 Docker 容器部署企业 AI 数据咨询系统。

## 目录

1. [前置条件](#前置条件)
2. [安装 Docker](#安装-docker)
3. [准备部署文件](#准备部署文件)
4. [配置环境变量](#配置环境变量)
5. [构建 Docker 镜像](#构建-docker-镜像)
6. [运行容器](#运行容器)
7. [验证部署](#验证部署)
8. [管理容器](#管理容器)
9. [故障排查](#故障排查)

---

## 前置条件

- CentOS 7 系统
- Root 或 sudo 权限
- 互联网连接
- Oracle 11g 数据库访问（192.168.59.166:1521）
- 至少 2GB RAM 和 10GB 磁盘空间

---

## 安装 Docker

### 1. 卸载旧版本 Docker（如果有）

```bash
sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
```

### 2. 安装 Docker 官方仓库

```bash
# 安装必要的工具
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 官方 YUM 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

### 3. 安装 Docker CE

```bash
# 安装最新版本 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 或者安装特定版本（推荐用于生产环境）
sudo yum install -y docker-ce-20.10.21 docker-ce-cli-20.10.21 containerd.io
```

### 4. 启动 Docker 服务

```bash
# 启动 Docker daemon
sudo systemctl start docker

# 设置开机自启
sudo systemctl enable docker

# 验证安装
sudo docker --version
sudo docker run hello-world
```

### 5. 配置 Docker 权限（可选）

为了避免每次都使用 `sudo`，可以将当前用户添加到 docker 组：

```bash
# 创建 docker 组（如果不存在）
sudo groupadd docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 刷新组成员关系
newgrp docker

# 验证
docker run hello-world
```

### 6. 安装 Docker Compose

```bash
# 使用 Docker 官方提供的 docker-compose-plugin
# 已在上面的 docker-buildx-plugin 中包含

# 验证
docker compose version

# 如果需要独立的 docker-compose 命令
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

---

## 准备部署文件

### 1. 克隆或上传项目

```bash
# 方式 1：使用 Git 克隆
cd /home
git clone https://github.com/neon2026/enterprise-ai-solution-showcase.git
cd enterprise-ai-solution-showcase

# 方式 2：上传 ZIP 文件
# 将项目 ZIP 文件上传到服务器，然后解压
unzip enterprise-ai-solution-showcase.zip
cd enterprise-ai-solution-showcase
```

### 2. 验证必要文件

```bash
# 检查 Dockerfile 是否存在
ls -la Dockerfile docker-compose.yml .dockerignore

# 输出应该显示这些文件
# -rw-r--r--. 1 root root  1234 Mar 27 14:00 Dockerfile
# -rw-r--r--. 1 root root  5678 Mar 27 14:00 docker-compose.yml
# -rw-r--r--. 1 root root   910 Mar 27 14:00 .dockerignore
```

---

## 配置环境变量

### 1. 创建环境配置文件

```bash
# 复制示例文件
cp .env.docker.example .env.docker

# 编辑配置文件
vim .env.docker
```

### 2. 配置关键参数

在 `.env.docker` 中修改以下参数：

```bash
# Oracle 数据库连接（生产环境）
ORACLE_HOST=192.168.59.166
ORACLE_PORT=1521
ORACLE_SID=orcl
ORACLE_USER=neon
ORACLE_PASSWORD=oracle

# MySQL 数据库（系统元数据存储）
MYSQL_ROOT_PASSWORD=your-secure-password
MYSQL_USER=appuser
MYSQL_PASSWORD=your-secure-password

# API 密钥
DEEPSEEK_API_KEY=sk-105b5973d1744993a6fceab8e8efcb48
JWT_SECRET=your-production-jwt-secret-min-32-chars

# OAuth 配置（如果使用 Manus）
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# 应用标题和 Logo
VITE_APP_TITLE=Enterprise AI Solution
VITE_APP_LOGO=https://example.com/logo.png
```

### 3. 验证配置

```bash
# 检查环境文件
cat .env.docker

# 确保所有必要的变量都已设置
grep -E "ORACLE_|DEEPSEEK_|JWT_SECRET" .env.docker
```

---

## 构建 Docker 镜像

### 1. 构建镜像

```bash
# 进入项目目录
cd /home/enterprise-ai-solution-showcase

# 构建镜像（首次构建可能需要 5-10 分钟）
docker build -t enterprise-ai-solution:latest .

# 或者使用 docker-compose 构建
docker compose build

# 验证镜像
docker images | grep enterprise-ai-solution
```

### 2. 查看构建日志

```bash
# 如果构建失败，查看详细日志
docker build -t enterprise-ai-solution:latest . --progress=plain

# 或者查看已构建的镜像信息
docker inspect enterprise-ai-solution:latest
```

### 3. 标记镜像（可选）

```bash
# 为镜像添加版本标签
docker tag enterprise-ai-solution:latest enterprise-ai-solution:v1.0.0

# 列出所有标签
docker images enterprise-ai-solution
```

---

## 运行容器

### 1. 使用 docker-compose 启动

```bash
# 进入项目目录
cd /home/enterprise-ai-solution-showcase

# 启动所有服务（应用 + MySQL）
docker compose up -d

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f app

# 查看 MySQL 日志
docker compose logs -f mysql
```

### 2. 使用 docker run 启动（手动）

```bash
# 首先启动 MySQL 容器
docker run -d \
  --name enterprise-ai-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=enterprise_ai \
  -e MYSQL_USER=appuser \
  -e MYSQL_PASSWORD=apppassword \
  -p 3306:3306 \
  -v mysql_data:/var/lib/mysql \
  mysql:8.0

# 等待 MySQL 启动（约 30 秒）
sleep 30

# 启动应用容器
docker run -d \
  --name enterprise-ai-solution \
  --env-file .env.docker \
  -p 3000:3000 \
  --link enterprise-ai-mysql:mysql \
  enterprise-ai-solution:latest

# 查看容器状态
docker ps
```

### 3. 验证容器运行

```bash
# 查看容器日志
docker logs enterprise-ai-solution

# 查看容器详细信息
docker inspect enterprise-ai-solution

# 进入容器调试
docker exec -it enterprise-ai-solution sh

# 在容器内测试应用
docker exec enterprise-ai-solution curl http://localhost:3000
```

---

## 验证部署

### 1. 检查应用健康状态

```bash
# 测试应用是否正常运行
curl http://localhost:3000

# 测试 API 端点
curl http://localhost:3000/api/health

# 查看应用日志
docker compose logs app | tail -50
```

### 2. 测试数据库连接

```bash
# 进入应用容器
docker exec -it enterprise-ai-solution sh

# 在容器内测试 MySQL 连接
mysql -h mysql -u appuser -p -e "SELECT VERSION();"

# 在容器内测试 Oracle 连接
# （需要在应用中调用相关 API）
```

### 3. 测试 Oracle 数据库连接

```bash
# 通过应用 API 测试 Oracle 连接
curl -X POST http://localhost:3000/api/trpc/database.testConnection \
  -H "Content-Type: application/json" \
  -d '{
    "host": "192.168.59.166",
    "port": 1521,
    "sid": "orcl",
    "user": "neon",
    "password": "oracle"
  }'

# 预期返回：连接成功消息
```

### 4. 测试元数据提取

```bash
# 连接数据库后，测试元数据提取
curl -X POST http://localhost:3000/api/trpc/database.extractMetadata \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "your-connection-id"
  }'
```

---

## 管理容器

### 1. 查看容器状态

```bash
# 查看所有运行中的容器
docker compose ps

# 查看所有容器（包括停止的）
docker compose ps -a

# 查看容器详细信息
docker compose logs app

# 实时查看日志
docker compose logs -f app
```

### 2. 停止和启动容器

```bash
# 停止所有容器
docker compose stop

# 启动所有容器
docker compose start

# 重启所有容器
docker compose restart

# 停止并删除容器
docker compose down

# 停止并删除容器及卷
docker compose down -v
```

### 3. 进入容器调试

```bash
# 进入应用容器
docker compose exec app sh

# 进入 MySQL 容器
docker compose exec mysql bash

# 在容器内执行命令
docker compose exec app node --version
```

### 4. 查看容器资源使用

```bash
# 实时查看容器资源使用情况
docker stats

# 查看特定容器的资源使用
docker stats enterprise-ai-solution
```

### 5. 备份和恢复数据

```bash
# 备份 MySQL 数据
docker compose exec mysql mysqldump -u root -p enterprise_ai > backup.sql

# 恢复 MySQL 数据
docker compose exec -T mysql mysql -u root -p < backup.sql

# 备份数据卷
docker run --rm -v mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data

# 恢复数据卷
docker run --rm -v mysql_data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql_backup.tar.gz -C /
```

---

## 使用 Systemd 管理 Docker 容器

为了让 Docker 容器在系统启动时自动运行，可以创建 Systemd 服务文件。

### 1. 创建 Systemd 服务文件

```bash
# 创建服务文件
sudo tee /etc/systemd/system/enterprise-ai-docker.service > /dev/null <<EOF
[Unit]
Description=Enterprise AI Solution Docker Container
After=docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/home/enterprise-ai-solution-showcase
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=unless-stopped
RestartSec=10s

# 资源限制
MemoryLimit=2G
CPUQuota=200%

[Install]
WantedBy=multi-user.target
EOF
```

### 2. 启用和启动服务

```bash
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启用服务（开机自启）
sudo systemctl enable enterprise-ai-docker.service

# 启动服务
sudo systemctl start enterprise-ai-docker.service

# 查看服务状态
sudo systemctl status enterprise-ai-docker.service

# 查看服务日志
sudo journalctl -u enterprise-ai-docker.service -f
```

### 3. 管理服务

```bash
# 停止服务
sudo systemctl stop enterprise-ai-docker.service

# 重启服务
sudo systemctl restart enterprise-ai-docker.service

# 查看服务详细状态
sudo systemctl show enterprise-ai-docker.service
```

---

## 使用 Nginx 作为反向代理

为了在生产环境中安全地暴露应用，建议使用 Nginx 作为反向代理。

### 1. 安装 Nginx

```bash
# 安装 Nginx
sudo yum install -y nginx

# 启动 Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx
```

### 2. 配置 Nginx 反向代理

```bash
# 编辑 Nginx 配置
sudo vim /etc/nginx/conf.d/enterprise-ai.conf

# 添加以下内容
upstream enterprise_ai {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # 重定向 HTTP 到 HTTPS（可选）
    # return 301 https://$server_name$request_uri;

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
    }
}
```

### 3. 验证和启动 Nginx

```bash
# 检查 Nginx 配置语法
sudo nginx -t

# 重新加载 Nginx 配置
sudo systemctl reload nginx

# 查看 Nginx 状态
sudo systemctl status nginx
```

---

## 故障排查

### 问题 1：容器无法启动

```bash
# 查看容器日志
docker compose logs app

# 查看容器详细信息
docker inspect enterprise-ai-solution

# 尝试手动运行容器以查看错误
docker run -it --rm enterprise-ai-solution:latest
```

### 问题 2：无法连接 Oracle 数据库

```bash
# 检查网络连接
docker exec enterprise-ai-solution ping 192.168.59.166

# 检查 Oracle 端口是否开放
docker exec enterprise-ai-solution nc -zv 192.168.59.166 1521

# 查看应用日志中的 Oracle 连接错误
docker compose logs app | grep -i oracle
```

### 问题 3：MySQL 连接失败

```bash
# 检查 MySQL 容器是否运行
docker compose ps mysql

# 查看 MySQL 日志
docker compose logs mysql

# 进入 MySQL 容器测试
docker compose exec mysql mysql -u root -p -e "SELECT 1;"
```

### 问题 4：磁盘空间不足

```bash
# 检查磁盘使用情况
df -h

# 清理 Docker 未使用的资源
docker system prune -a

# 查看 Docker 数据卷使用情况
docker volume ls

# 删除未使用的数据卷
docker volume prune
```

### 问题 5：内存不足

```bash
# 查看容器内存使用
docker stats

# 调整 docker-compose.yml 中的内存限制
# 在 deploy.resources.limits 中修改 memory 值

# 重启容器以应用新的内存限制
docker compose restart
```

### 问题 6：应用无法访问

```bash
# 检查端口是否开放
sudo netstat -tlnp | grep 3000

# 检查防火墙规则
sudo firewall-cmd --list-all

# 添加防火墙规则（如果需要）
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 测试本地连接
curl http://localhost:3000

# 测试远程连接
curl http://your-server-ip:3000
```

---

## 性能优化建议

### 1. 调整容器资源限制

在 `docker-compose.yml` 中修改：

```yaml
deploy:
  resources:
    limits:
      cpus: '2'        # 最多使用 2 个 CPU
      memory: 2G       # 最多使用 2GB 内存
    reservations:
      cpus: '1'        # 预留 1 个 CPU
      memory: 1G       # 预留 1GB 内存
```

### 2. 启用 Docker 日志轮转

```bash
# 编辑 Docker daemon 配置
sudo vim /etc/docker/daemon.json

# 添加日志配置
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# 重启 Docker
sudo systemctl restart docker
```

### 3. 使用 Docker 网络优化

```bash
# 使用 host 网络模式（性能更好，但安全性降低）
docker run --network host enterprise-ai-solution:latest

# 或在 docker-compose.yml 中配置
services:
  app:
    network_mode: host
```

---

## 安全建议

### 1. 使用环境变量管理敏感信息

- 不要在 Dockerfile 中硬编码密钥
- 使用 `.env.docker` 文件管理敏感信息
- 定期轮换 API 密钥和数据库密码

### 2. 限制容器权限

```bash
# 以非 root 用户运行容器（已在 Dockerfile 中配置）
docker run --user nodejs enterprise-ai-solution:latest

# 使用只读文件系统
docker run --read-only enterprise-ai-solution:latest
```

### 3. 使用 HTTPS

- 配置 SSL 证书
- 使用 Nginx 作为反向代理处理 HTTPS
- 启用 HSTS 头

### 4. 定期更新镜像

```bash
# 定期拉取最新的基础镜像
docker pull node:18.20.4-alpine

# 重新构建应用镜像
docker build -t enterprise-ai-solution:latest .

# 重启容器以使用新镜像
docker compose up -d --force-recreate
```

---

## 总结

使用 Docker 部署企业 AI 数据咨询系统具有以下优势：

- ✅ **解决系统库兼容性问题**：在容器中使用现代 Node.js，避免 CentOS 7 的限制
- ✅ **简化部署流程**：一条命令启动整个应用栈
- ✅ **便于扩展**：轻松添加更多容器或服务
- ✅ **提高可靠性**：容器自动重启，确保服务可用
- ✅ **便于备份和恢复**：数据卷管理简单

如有任何问题，请参考上面的故障排查部分。

---

## 附录：常用命令速查表

```bash
# 构建镜像
docker build -t enterprise-ai-solution:latest .

# 启动容器
docker compose up -d

# 查看日志
docker compose logs -f app

# 停止容器
docker compose stop

# 删除容器
docker compose down

# 进入容器
docker compose exec app sh

# 查看容器状态
docker compose ps

# 查看资源使用
docker stats

# 清理未使用资源
docker system prune -a

# 备份数据
docker compose exec mysql mysqldump -u root -p enterprise_ai > backup.sql

# 恢复数据
docker compose exec -T mysql mysql -u root -p < backup.sql
```

---

**最后更新**：2026-03-27

**维护者**：Enterprise AI Team
