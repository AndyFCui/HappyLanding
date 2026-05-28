from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

app = FastAPI(title="HappyLanding API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Models ============

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str

class SearchRequest(BaseModel):
    query: str
    type: Optional[str] = "all"
    page: Optional[int] = 1
    size: Optional[int] = 20

class SearchResult(BaseModel):
    id: str
    title: str
    type: str
    snippet: Optional[str] = None
    score: Optional[float] = None

class SearchResponse(BaseModel):
    total: int
    page: int
    size: int
    results: List[SearchResult]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    content: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    content: str
    session_id: str

class EntityRequest(BaseModel):
    id: str
    type: str
    properties: Optional[dict] = {}

class EntityResponse(BaseModel):
    id: str
    type: str
    properties: dict

# ============ Routes ============

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="happylanding-api",
        timestamp=datetime.utcnow().isoformat()
    )

@app.get("/health/ready", response_model=HealthResponse)
async def readiness_check():
    return HealthResponse(
        status="ready",
        service="happylanding-api",
        timestamp=datetime.utcnow().isoformat()
    )

# ============ Search ============

@app.post("/v1/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    # Demo mode - return mock results
    return SearchResponse(
        total=2,
        page=request.page,
        size=request.size,
        results=[
            SearchResult(
                id="1",
                title=f"关于 '{request.query}' 的搜索结果",
                type="document",
                snippet="这是示例搜索结果，实际数据来自 OpenSearch"
            ),
            SearchResult(
                id="2",
                title=f"{request.query} 相关文档",
                type="kb_article",
                snippet="知识库相关文章"
            )
        ]
    )

# ============ Chat ============

@app.post("/v1/chat/sessions/{session_id}/messages", response_model=ChatResponse)
async def send_message(session_id: str, request: ChatRequest):
    # Demo mode - return mock AI response
    return ChatResponse(
        content=f"这是对 '{request.content}' 的演示回复。\n\n实际功能需要连接 AWS Bedrock Claude 服务。",
        session_id=session_id
    )

# ============ Graph ============

@app.post("/v1/graph/entities", response_model=EntityResponse)
async def create_entity(request: EntityRequest):
    return EntityResponse(
        id=request.id,
        type=request.type,
        properties=request.properties or {}
    )

@app.get("/v1/graph/entities/{entity_id}", response_model=EntityResponse)
async def get_entity(entity_id: str):
    return EntityResponse(
        id=entity_id,
        type="Person",
        properties={"name": "演示实体", "role": "工程师"}
    )

@app.get("/v1/graph/entities/{entity_id}/neighbors")
async def get_neighbors(entity_id: str, depth: int = 1):
    return {
        "neighbors": [
            {"id": "n1", "type": "Project", "properties": {"name": "KMS项目"}},
            {"id": "n2", "type": "Document", "properties": {"name": "架构文档"}}
        ]
    }

# ============ Documents ============

@app.get("/v1/documents")
async def list_documents(prefix: str = "", limit: int = 100):
    return {
        "documents": [
            {"id": "1", "title": "架构设计文档.pdf", "type": "pdf", "size": "2.5MB"},
            {"id": "2", "title": "产品需求文档.docx", "type": "word", "size": "1.2MB"}
        ],
        "isTruncated": False,
        "nextToken": None
    }

# ============ Auth (Simplified) ============

@app.post("/v1/auth/signin")
async def signin(username: str, password: str):
    # Demo mode - return mock tokens
    return {
        "accessToken": "demo-access-token",
        "idToken": "demo-id-token",
        "expiresIn": 3600
    }

from datetime import datetime

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)