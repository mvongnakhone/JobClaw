"""Tool definitions and dispatch for the NemoClaw agent."""
import os
import httpx

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for up-to-date information on a topic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Specific search query"},
                },
                "required": ["query"],
            },
        },
    },
]


async def _web_search(query: str) -> str:
    tavily_key = os.getenv("TAVILY_API_KEY")
    if tavily_key:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post(
                "https://api.tavily.com/search",
                json={"api_key": tavily_key, "query": query, "max_results": 5},
            )
            r.raise_for_status()
            results = r.json().get("results", [])
            lines = [f"- {res['title']}: {res['content'][:300]}" for res in results]
            return "\n".join(lines) or "No results found."
    return f"[stub] Web search for '{query}' returned no results. Set TAVILY_API_KEY for real search."


async def dispatch_tool(name: str, args: dict) -> tuple[str, dict | None]:
    """Returns (result, policy_check_event | None)."""
    if name == "web_search":
        policy_event = {
            "type": "policy_check",
            "tool": name,
            "host": "api.tavily.com",
            "status": "allowed",
            "policy": "tavily_search → POST /search",
        }
        result = await _web_search(args.get("query", ""))
        return result, policy_event
    return f"[error] Unknown tool: {name}", None
