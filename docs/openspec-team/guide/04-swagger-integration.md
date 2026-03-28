# 04 - Swagger 集成

## 概述

本章介绍如何从各自维护 Swagger 文档，转变为统一的 API 管理方式。

**预计时间**: 2-4 小时（首次设置）  
**前提条件**: 后端服务已使用 Swagger/OpenAPI

---

## 现状问题

```
服务 A ──[维护 swagger.yaml]──┐
                             │ 问题：
服务 B ──[维护 swagger.yaml]──┤ 1. 各自为政，风格不一
                             │ 2. 变更不同步，版本混乱
服务 C ──[维护 swagger.yaml]──┤ 3. 无法全局查看所有 API
                             │ 4. 跨服务调用容易出错
服务 D ──[维护 swagger.yaml]──┘
```

## 解决方案：Swagger Registry

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Swagger Registry                         │
│                    (中央 API 仓库)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  services/                                                  │
│    ├── user-service/                                        │
│    │   ├── openapi.yaml          # 当前版本                 │
│    │   └── versions/                                        │
│    │       ├── v1.0.0.yaml                                  │
│    │       ├── v1.1.0.yaml                                  │
│    │       └── v2.0.0.yaml                                  │
│    ├── order-service/                                       │
│    │   ├── openapi.yaml                                     │
│    │   └── versions/                                        │
│    │       └── ...                                          │
│    └── ...                                                  │
│                                                             │
│  index.html                    # Swagger UI 聚合页面        │
│  registry.yaml                 # 服务注册索引               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 第一步：创建 Registry 仓库

### 1.1 创建新仓库

```
GitLab → 新建项目 → swagger-registry
```

### 1.2 目录结构

```bash
mkdir -p services/user-service/versions
mkdir -p services/order-service/versions
touch registry.yaml
```

### 1.3 注册表配置

```yaml
# registry.yaml
version: "1.0"
services:
  user-service:
    name: 用户服务
    current_version: 1.1.0
    versions:
      - 1.0.0
      - 1.1.0
    openapi: services/user-service/openapi.yaml

  order-service:
    name: 订单服务
    current_version: 2.0.0
    versions:
      - 1.0.0
      - 2.0.0
    openapi: services/order-service/openapi.yaml
```

---

## 第二步：OpenSpec 集成

### 2.1 在 OpenSpec 中声明 API 变更

```yaml
# openspec/changes/<name>/.openspec.yaml
schema: spec-driven

api:
  swagger:
    service: user-service # 影响的服务
    version: 1.2.0 # 新版本号
    change_type: feature # breaking | feature | fix

    # 变更详情
    changes:
      - type: add # add | modify | remove
        path: /api/users/profile
        method: GET
        description: 新增用户资料接口

      - type: modify
        path: /api/users/{id}
        method: PUT
        description: 增加头像字段

    # 依赖的其他服务 API
    dependencies:
      - service: auth-service
        version: ^2.0.0
```

### 2.2 创建 API 变更规格

````markdown
<!-- openspec/changes/<name>/specs/api-changes.md -->

## API 变更规格

### 服务信息

- **服务**: user-service
- **当前版本**: 1.1.0
- **目标版本**: 1.2.0
- **变更类型**: feature

### 新增接口

#### GET /api/users/profile

获取当前用户资料

**Request**:

```http
GET /api/users/profile
Authorization: Bearer {token}
```
````

**Response 200**:

```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "avatar": "string",
  "created_at": "datetime"
}
```

### 修改接口

#### PUT /api/users/{id}

更新用户信息

**变更**:

- Request Body 新增 `avatar` 字段

**Request**:

```json
{
  "username": "string",
  "email": "string",
  "avatar": "string" // 新增
}
```

### 兼容性说明

- ✅ 向后兼容
- 新增接口不影响现有功能
- 修改接口为可选字段添加

````

---

## 第三步：自动化同步

### 3.1 服务仓库 CI 配置

```yaml
# user-service/.gitlab-ci.yml

sync-swagger:
  stage: deploy
  image: alpine/git
  script:
    # 克隆 registry
    - git clone https://gitlab-ci-token:${CI_JOB_TOKEN}@gitlab.com/your-org/swagger-registry.git ../registry

    # 检查是否有 OpenSpec API 变更
    - |
      if [ -f "openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml" ]; then
        echo "发现 OpenSpec API 变更，同步到 Registry..."

        # 读取服务名和版本
        SERVICE=$(cat openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml | grep "service:" | awk '{print $2}')
        VERSION=$(cat openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml | grep "version:" | awk '{print $2}')

        # 复制 swagger.yaml
        cp swagger.yaml ../registry/services/$SERVICE/openapi.yaml
        cp swagger.yaml ../registry/services/$SERVICE/versions/$VERSION.yaml

        # 更新 registry.yaml
        cd ../registry
        git config user.email "ci@example.com"
        git config user.name "GitLab CI"
        git add .
        git commit -m "chore: update $SERVICE API to $VERSION

From MR: $CI_MERGE_REQUEST_TITLE
Branch: $CI_COMMIT_BRANCH"
        git push

        echo "✅ Swagger 同步完成"
      else
        echo "ℹ️ 无 OpenSpec API 变更，跳过同步"
      fi
  only:
    - merge_requests
  when: on_success
````

### 3.2 Registry CI 配置

```yaml
# swagger-registry/.gitlab-ci.yml

pages:
  stage: deploy
  image: node:18
  script:
    # 安装 Swagger UI
    - npm install -g swagger-ui-express
    - npm install -g @redocly/cli

    # 生成聚合文档
    - |
      cat > public/index.html << 'EOF'
      <!DOCTYPE html>
      <html>
      <head>
        <title>API Registry</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .service { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
          .version { color: #666; font-size: 0.9em; }
          a { color: #1f75cb; }
        </style>
      </head>
      <body>
        <h1>API Registry</h1>
        <p>统一的 API 文档中心</p>
        <div id="services"></div>
        
        <script>
          // 服务列表（由 CI 动态生成）
          const services = [
            { name: 'user-service', display: '用户服务', version: '1.1.0' },
            { name: 'order-service', display: '订单服务', version: '2.0.0' }
          ];
          
          const container = document.getElementById('services');
          services.forEach(s => {
            container.innerHTML += `
              <div class="service">
                <h3>${s.display} <span class="version">v${s.version}</span></h3>
                <a href="/services/${s.name}/openapi.yaml">Download OpenAPI</a> |
                <a href="/services/${s.name}/docs">View Docs</a>
              </div>
            `;
          });
        </script>
      </body>
      </html>
      EOF

    - mkdir -p public/services
    - cp -r services/* public/services/

  artifacts:
    paths:
      - public
  only:
    - main
```

---

## 第四步：变更通知

### 4.1 自动通知相关方

```yaml
# 在 sync-swagger job 后添加

notify-consumers:
  stage: notify
  image: alpine/curl
  script:
    - |
      # 获取变更详情
      SERVICE=$(cat openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml | grep "service:" | awk '{print $2}')
      VERSION=$(cat openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml | grep "version:" | awk '{print $2}')
      CHANGE_TYPE=$(cat openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml | grep "change_type:" | awk '{print $2}')

      # 构建通知消息
      MESSAGE="🚀 **API 变更通知**

**服务**: $SERVICE
**版本**: $VERSION
**变更类型**: $CHANGE_TYPE
**MR**: $CI_MERGE_REQUEST_TITLE
**作者**: @$GITLAB_USER_LOGIN

请在 24 小时内确认是否影响你的服务。

查看详情: $CI_MERGE_REQUEST_URL"

      # 发送到 Slack（可选）
      if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"$MESSAGE\"}" \
          $SLACK_WEBHOOK_URL
      fi

      # 在 MR 中评论 @ 相关开发者
      # （根据依赖关系自动 @）
  only:
    - merge_requests
  when: on_success
```

---

## 工作流程

```
开发者 A (user-service):
  1. 创建 OpenSpec 变更
     └── 声明 API 变更: 新增 /api/users/profile

  2. 开发实现
     └── 实现接口 + 更新 swagger.yaml

  3. 提交 MR
     └── CI 自动检测冲突

  4. 合并后
     └── CI 自动同步到 swagger-registry
     └── 通知依赖方 (order-service 等)

开发者 B (order-service):
  1. 收到通知: user-service API 已更新

  2. 查看 Registry
     └── 确认新版本兼容

  3. 如有需要
     └── 创建 OpenSpec 变更适配
```

---

## 验证清单

- [ ] swagger-registry 仓库已创建
- [ ] registry.yaml 配置正确
- [ ] 至少一个服务成功同步
- [ ] GitLab Pages 能正常显示 API 列表
- [ ] API 变更后自动通知相关方

---

## 下一步

继续 [05 - 实施路线图](05-roadmap.md) 了解如何逐步推广到全团队。
