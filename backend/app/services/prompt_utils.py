from app.schemas.chat import ChatHistoryMessage


def format_history_for_prompt(history: list[ChatHistoryMessage]) -> str:
    if not history:
        return ""
    lines = [f"{m.role.upper()}: {m.content}" for m in history[-6:]]
    return "Recent conversation (for context on follow-up questions):\n" + "\n".join(lines) + "\n\n"
