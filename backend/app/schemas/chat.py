from typing import Literal

from pydantic import BaseModel, Field


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatAskRequest(BaseModel):
    file_id: str
    question: str = Field(min_length=1, max_length=2000)
    history: list[ChatHistoryMessage] = Field(default_factory=list)
