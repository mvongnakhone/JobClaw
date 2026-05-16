"""
Agent module — the integration point for NemoClaw + Nemotron.

`run_agent` is an async generator that yields event dicts as the agent
works. The frontend renders each event live as it streams in.

When ready to integrate NemoClaw, replace the body of `run_agent` below.
Keep the event shapes the same and the frontend keeps working without
any changes.

Event shapes:
    {"type": "status",      "content": "thinking" | "tool_calling" | "done" | "error"}
    {"type": "thought",     "content": "..."}
    {"type": "tool_call",   "tool": "name", "args": {...}}
    {"type": "tool_result", "tool": "name", "content": "..."}
    {"type": "final",       "content": "..."}
    {"type": "error",       "content": "..."}
"""
import asyncio
from typing import AsyncGenerator


async def run_agent(task: str) -> AsyncGenerator[dict, None]:
    """
    STUB. Simulates an agent thinking, calling a tool, and finishing.
    Replace with a real NemoClaw / Nemotron call when ready.
    """
    yield {"type": "status", "content": "thinking"}
    await asyncio.sleep(0.4)

    yield {"type": "thought", "content": f"Received task: {task}"}
    await asyncio.sleep(0.6)

    yield {"type": "thought", "content": "Planning approach. Breaking into subtasks."}
    await asyncio.sleep(0.8)

    yield {"type": "status", "content": "tool_calling"}
    yield {"type": "tool_call", "tool": "web_search", "args": {"query": task[:60]}}
    await asyncio.sleep(1.0)

    yield {"type": "tool_result", "tool": "web_search", "content": "[stub] 3 results found"}
    await asyncio.sleep(0.4)

    yield {"type": "status", "content": "thinking"}
    yield {"type": "thought", "content": "Synthesizing results."}
    await asyncio.sleep(0.7)

    yield {
        "type": "final",
        "content": (
            f"[stub answer] Completed task: {task}\n\n"
            "This is a placeholder. Wire NemoClaw + Nemotron into "
            "backend/agent.py to see real agent output."
        ),
    }
    yield {"type": "status", "content": "done"}


# ----------------------------------------------------------------------
# When integrating NemoClaw, your replacement might look like:
#
# async def run_agent(task: str) -> AsyncGenerator[dict, None]:
#     yield {"type": "status", "content": "thinking"}
#     async for event in nemoclaw_client.run(task):
#         # Translate NemoClaw events into the shapes above and yield them
#         yield translate(event)
#     yield {"type": "status", "content": "done"}
# ----------------------------------------------------------------------
