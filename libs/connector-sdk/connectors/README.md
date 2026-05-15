# KMS Lambda Connectors

Lambda 函数，用于从外部数据源同步数据到 KMS 系统。

## 支持的数据源

| 数据源 | 同步方式 | 说明 |
|--------|----------|------|
| 钉钉 | Webhook + API | 消息、文档、审批 |
| SharePoint | Microsoft Graph API | Delta Query |
| Confluence | REST API v2 | Webhook + 定时 |
| S3 | Event Notifications | 实时 |

## 目录结构

```
connectors/
├── dingtalk/          # 钉钉连接器
├── sharepoint/        # SharePoint 连接器
├── confluence/        # Confluence 连接器
└── s3/               # S3 连接器
```

## 部署

```bash
# 使用 SAM 部署
cd connectors/dingtalk
sam build
sam deploy --guided

# 或使用 Terraform
terraform init
terraform plan
terraform apply
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `EVENT_BUS_NAME` | EventBridge 总线名 |
| `KMS_ENDPOINT` | KMS API 端点 |
| `LOG_LEVEL` | 日志级别 |

## 事件格式

```json
{
  "source": "km.connector.dingtalk",
  "detail-type": "ResourceSync",
  "detail": {
    "resource_id": "dt-123",
    "resource_type": "message",
    "title": "消息标题",
    "content": "消息内容...",
    "metadata": {},
    "timestamp": "2026-05-16T10:00:00Z"
  }
}
```