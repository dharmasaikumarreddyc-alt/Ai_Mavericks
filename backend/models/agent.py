from pydantic import BaseModel
from typing import List, Optional, Any
from enum import Enum
from datetime import datetime

class AgentRunStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    WAITING = "waiting"
    WATCHING = "watching"
    FAILED = "failed"
    PAUSED = "paused"

class AgentTask(BaseModel):
    task: str  # Natural language task from user
    priority: str = "normal"  # "high", "normal", "low"

class AgentRun(BaseModel):
    id: str
    task: str
    status: AgentRunStatus
    detail: str
    time: str
    user_id: str
    created_at: datetime
    steps: List[dict] = []  # Agent execution steps

    class Config:
        from_attributes = True

class AgentRunResponse(BaseModel):
    id: str
    task: str
    status: str
    detail: str
    time: str

class AgentMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str
    agent_name: Optional[str] = None
    timestamp: datetime

class FeedEvent(BaseModel):
    id: str
    type: str  # "search", "compare", "checkout", "approval", "delivery"
    title: str
    detail: str
    time: str
    status: str  # "success", "pending", "info"

class AgentStepLog(BaseModel):
    agent_name: str
    action: str
    result: Any
    timestamp: datetime
