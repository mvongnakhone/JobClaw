"""Nemotron ReAct loop — yields event dicts as an async generator.

Event shapes (frontend contract — do not change):
    {"type": "status",      "content": "thinking" | "tool_calling" | "done" | "error"}
    {"type": "thought",     "content": "..."}
    {"type": "tool_call",   "tool": "name", "args": {...}}
    {"type": "tool_result", "tool": "name", "content": "..."}
    {"type": "final",       "content": "..."}
    {"type": "error",       "content": "..."}

Required env vars (.env):
    NVIDIA_API_KEY   — from build.nvidia.com
    NEMOTRON_MODEL   — e.g. nvidia/nemotron-super-120b-a12b
    NVIDIA_BASE_URL  — https://integrate.api.nvidia.com/v1

Optional:
    TAVILY_API_KEY   — enables real web search via Tavily
    MAX_ITERATIONS   — max ReAct loop turns (default 6)
"""
import json
import os
from typing import AsyncGenerator

import httpx
from dotenv import load_dotenv
from openai import AsyncOpenAI

from .tools import TOOLS, dispatch_tool

load_dotenv()

_client = AsyncOpenAI(
    api_key=os.getenv("NVIDIA_API_KEY"),
    base_url=os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
    http_client=httpx.AsyncClient(),
)

MODEL          = os.getenv("NEMOTRON_MODEL", "nvidia/nvidia-nemotron-nano-9b-v2")
MAX_ITERATIONS = int(os.getenv("MAX_ITERATIONS", "6"))

SYSTEM_PROMPT = (
    "You are a helpful AI agent. Think step by step. "
    "Use tools whenever you need external information. "
    "When you have enough information, give a clear, complete final answer — "
    "do not call any more tools."
)


async def run_agent(task: str) -> AsyncGenerator[dict, None]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": task},
    ]

    yield {"type": "status", "content": "thinking"}

    for _ in range(MAX_ITERATIONS):
        thought_buf = ""
        tool_calls_buf: dict[int, dict] = {}
        finish_reason = None

        stream = await _client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=TOOLS,
            stream=True,
        )

        async for chunk in stream:
            if not chunk.choices:
                continue
            choice = chunk.choices[0]
            finish_reason = choice.finish_reason or finish_reason
            delta = choice.delta

            if delta.content:
                thought_buf += delta.content
                yield {"type": "thought", "content": delta.content}

            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in tool_calls_buf:
                        tool_calls_buf[idx] = {"id": "", "name": "", "args": ""}
                    if tc.id:
                        tool_calls_buf[idx]["id"] = tc.id
                    if tc.function and tc.function.name:
                        tool_calls_buf[idx]["name"] = tc.function.name
                    if tc.function and tc.function.arguments:
                        tool_calls_buf[idx]["args"] += tc.function.arguments

        assistant_msg: dict = {"role": "assistant", "content": thought_buf or None}
        if tool_calls_buf:
            assistant_msg["tool_calls"] = [
                {
                    "id": v["id"],
                    "type": "function",
                    "function": {"name": v["name"], "arguments": v["args"]},
                }
                for v in tool_calls_buf.values()
            ]
        messages.append(assistant_msg)

        if tool_calls_buf:
            yield {"type": "status", "content": "tool_calling"}
            for tc in tool_calls_buf.values():
                args = json.loads(tc["args"] or "{}")
                yield {"type": "tool_call", "tool": tc["name"], "args": args}

                result, policy_event = await dispatch_tool(tc["name"], args)
                if policy_event:
                    yield policy_event
                yield {"type": "tool_result", "tool": tc["name"], "content": result}

                messages.append(
                    {"role": "tool", "tool_call_id": tc["id"], "content": result}
                )
            yield {"type": "status", "content": "thinking"}

        else:
            yield {"type": "final", "content": thought_buf}
            yield {"type": "status", "content": "done"}
            return

    yield {"type": "final", "content": "Reached the maximum number of reasoning steps."}
    yield {"type": "status", "content": "done"}
