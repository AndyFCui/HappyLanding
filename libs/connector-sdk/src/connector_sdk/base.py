from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import hashlib
import json


@dataclass
class Resource:
    id: str
    type: str
    title: str
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'content': self.content,
            'metadata': self.metadata or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


@dataclass
class ChangeEvent:
    resource_id: str
    change_type: str  # 'created', 'updated', 'deleted'
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            'resource_id': self.resource_id,
            'change_type': self.change_type,
            'timestamp': self.timestamp.isoformat(),
            'metadata': self.metadata or {}
        }


@dataclass
class ConnectorMetadata:
    name: str
    version: str
    supported_features: List[str]
    resource_types: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'version': self.version,
            'supported_features': self.supported_features,
            'resource_types': self.resource_types
        }


class ConnectorInterface(ABC):
    """数据源连接器标准接口"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self._validate_config()

    def _validate_config(self):
        required_fields = ['credentials']
        for field in required_fields:
            if field not in self.config:
                raise ValueError(f"Missing required config field: {field}")

    @abstractmethod
    def authenticate(self, credentials: Dict[str, str]) -> bool:
        """验证数据源连接凭据"""
        pass

    @abstractmethod
    def list_resources(self, path: str = "/") -> List[Resource]:
        """列出数据源中的资源（文件、页面等）"""
        pass

    @abstractmethod
    def fetch_content(self, resource_id: str) -> Resource:
        """获取单个资源的完整内容"""
        pass

    @abstractmethod
    def get_changes_since(self, since_timestamp: datetime) -> List[ChangeEvent]:
        """增量同步：获取指定时间后的变更"""
        pass

    @abstractmethod
    def get_metadata(self) -> ConnectorMetadata:
        """返回连接器元数据（名称、版本、支持的功能）"""
        pass

    def _generate_resource_id(self, *parts: str) -> str:
        """生成统一的资源 ID"""
        raw = "|".join(str(p) for p in parts)
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    def _serialize_for_hash(self, data: Any) -> str:
        """序列化为 JSON 字符串用于哈希"""
        if isinstance(data, dict):
            return json.dumps(data, sort_keys=True, default=str)
        elif isinstance(data, (list, tuple)):
            return json.dumps(list(data), sort_keys=True, default=str)
        else:
            return str(data)