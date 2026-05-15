# Connector SDK

提供数据源连接器标准接口，用于接入钉钉、SharePoint、Confluence 等数据源。

## 安装

```bash
pip install connector-sdk
```

## 快速开始

```python
from connector_sdk import ConnectorInterface, Resource, ConnectorMetadata
from datetime import datetime

class MyConnector(ConnectorInterface):
    def authenticate(self, credentials):
        return True

    def list_resources(self, path="/"):
        return [
            Resource(
                id="doc-001",
                type="document",
                title="示例文档",
                created_at=datetime.now()
            )
        ]

    def fetch_content(self, resource_id):
        return Resource(
            id=resource_id,
            type="document",
            title="文档内容",
            content="这是文档的完整内容...",
            created_at=datetime.now()
        )

    def get_changes_since(self, since):
        return []

    def get_metadata(self):
        return ConnectorMetadata(
            name="my-connector",
            version="1.0.0",
            supported_features=["list", "fetch", "sync"],
            resource_types=["document"]
        )
```

## 使用 Runner

```python
from connector_sdk import ConnectorRunner

def on_resource(resource):
    print(f"Received: {resource.title}")

runner = ConnectorRunner(
    connector=MyConnector({"credentials": {}}),
    on_resource=on_resource,
    sync_interval_seconds=21600  # 6 小时
)

runner.start()  # 启动后台同步
```