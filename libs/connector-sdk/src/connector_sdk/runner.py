from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
import logging
import threading
import time

from .base import ConnectorInterface, Resource, ChangeEvent, ConnectorMetadata


@dataclass
class SyncResult:
    success: bool
    synced_count: int
    failed_count: int
    errors: List[str] = field(default_factory=list)
    last_sync_timestamp: Optional[datetime] = None


class ConnectorRunner:
    """连接器运行器 - 管理连接器的生命周期和同步循环"""

    def __init__(
        self,
        connector: ConnectorInterface,
        on_resource: Callable[[Resource], None],
        on_error: Optional[Callable[[Exception], None]] = None,
        sync_interval_seconds: int = 21600  # 默认 6 小时
    ):
        self.connector = connector
        self.on_resource = on_resource
        self.on_error = on_error or (lambda e: logging.error(f"Sync error: {e}"))
        self.sync_interval = sync_interval_seconds
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._last_sync: Optional[datetime] = None

    def start(self):
        """启动同步循环"""
        if self._running:
            return

        self._running = True
        self._thread = threading.Thread(target=self._sync_loop, daemon=True)
        self._thread.start()
        logging.info(f"Connector runner started for {self.connector.get_metadata().name}")

    def stop(self):
        """停止同步循环"""
        self._running = False
        if self._thread:
            self._thread.join(timeout=30)
        logging.info(f"Connector runner stopped for {self.connector.get_metadata().name}")

    def _sync_loop(self):
        """同步循环"""
        while self._running:
            try:
                self.run_sync()
            except Exception as e:
                self.on_error(e)

            for _ in range(self.sync_interval):
                if not self._running:
                    break
                time.sleep(1)

    def run_sync(self) -> SyncResult:
        """执行一次同步"""
        result = SyncResult(
            success=False,
            synced_count=0,
            failed_count=0,
            last_sync_timestamp=datetime.utcnow()
        )

        try:
            since = self._last_sync
            if since:
                changes = self.connector.get_changes_since(since)
            else:
                resources = self.connector.list_resources()
                changes = [
                    ChangeEvent(
                        resource_id=r.id,
                        change_type='created',
                        timestamp=datetime.utcnow(),
                        metadata={'resource': r.to_dict()}
                    ) for r in resources
                ]

            for change in changes:
                try:
                    if change.change_type != 'deleted':
                        resource = self.connector.fetch_content(change.resource_id)
                        self.on_resource(resource)
                    result.synced_count += 1
                except Exception as e:
                    result.failed_count += 1
                    result.errors.append(f"Failed to sync {change.resource_id}: {str(e)}")

            result.success = result.failed_count == 0
            self._last_sync = result.last_sync_timestamp

        except Exception as e:
            result.errors.append(f"Sync failed: {str(e)}")
            logging.error(f"Sync failed: {e}")

        return result

    def sync_once(self) -> SyncResult:
        """执行一次同步（不启动后台循环）"""
        return self.run_sync()