from typing import Callable, Dict, Any, Optional
import json
import logging
import os
from datetime import datetime

from .base import ConnectorInterface, Resource, ChangeEvent, ConnectorMetadata
from .runner import ConnectorRunner, SyncResult

logger = logging.getLogger(__name__)

LAMBDA_EVENTbus = os.environ.get('EVENT_BUS_NAME', 'km-event-bus')


def create_lambda_handler(connector_class: type) -> Callable:
    """
    Factory function to create a Lambda handler for a connector.

    Usage:
        handler = create_lambda_handler(MyConnector)
    """
    def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
        setup_logging()

        connector = connector_class({})

        try:
            if event.get('source') == 'aws.events':
                return handle_scheduled_event(connector, event)

            body = json.loads(event.get('body', '{}'))
            action = body.get('action')

            if action == 'sync':
                return handle_sync_action(connector, body)
            elif action == 'list':
                return handle_list_action(connector, body)
            elif action == 'fetch':
                return handle_fetch_action(connector, body)
            else:
                return error_response(f"Unknown action: {action}", 400)

        except Exception as e:
            logger.exception("Handler error")
            return error_response(str(e), 500)

    return handler


def handle_scheduled_event(connector: ConnectorInterface, event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle EventBridge scheduled event trigger."""
    result = ConnectorRunner(connector, on_resource=publish_resource_event).sync_once()
    return success_response({
        'action': 'scheduled_sync',
        'connector': connector.get_metadata().name,
        'synced': result.synced_count,
        'failed': result.failed_count,
        'success': result.success
    })


def handle_sync_action(connector: ConnectorInterface, body: Dict[str, Any]) -> Dict[str, Any]:
    """Handle manual sync request."""
    mode = body.get('mode', 'incremental')
    since = body.get('since')

    if mode == 'full':
        resources = connector.list_resources()
        for resource in resources:
            publish_resource_event(resource)
        return success_response({
            'action': 'full_sync',
            'count': len(resources)
        })
    else:
        from datetime import datetime as dt
        since_dt = dt.fromisoformat(since) if since else None
        changes = connector.get_changes_since(since_dt)
        for change in changes:
            if change.change_type != 'deleted':
                resource = connector.fetch_content(change.resource_id)
                publish_resource_event(resource)
        return success_response({
            'action': 'incremental_sync',
            'count': len(changes)
        })


def handle_list_action(connector: ConnectorInterface, body: Dict[str, Any]) -> Dict[str, Any]:
    """Handle list resources request."""
    path = body.get('path', '/')
    resources = connector.list_resources(path)
    return success_response({
        'resources': [r.to_dict() for r in resources]
    })


def handle_fetch_action(connector: ConnectorInterface, body: Dict[str, Any]) -> Dict[str, Any]:
    """Handle fetch single resource request."""
    resource_id = body.get('resource_id')
    if not resource_id:
        return error_response("Missing resource_id", 400)

    resource = connector.fetch_content(resource_id)
    return success_response({
        'resource': resource.to_dict()
    })


def publish_resource_event(resource: Resource) -> None:
    """Publish resource event to EventBridge."""
    event = {
        'source': 'km.connector',
        'detail-type': 'ResourceSync',
        'detail': {
            'connector': 'unknown',
            'resource_id': resource.id,
            'resource_type': resource.type,
            'title': resource.title,
            'timestamp': datetime.utcnow().isoformat()
        }
    }
    logger.info(f"Would publish event: {event}")
    # In production, use boto3 EventBridge client


def setup_logging() -> None:
    log_level = os.environ.get('LOG_LEVEL', 'INFO')
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )


def success_response(data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': 200,
        'body': json.dumps(data),
        'headers': {'Content-Type': 'application/json'}
    }


def error_response(message: str, status_code: int) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'body': json.dumps({'error': message}),
        'headers': {'Content-Type': 'application/json'}
    }