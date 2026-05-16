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
    {
        "type": "function",
        "function": {
            "name": "search_jobs",
            "description": (
                "Search for current job postings on job boards. "
                "Use targeted queries like 'Senior Product Manager Remote 2025 site:greenhouse.io OR site:lever.co'. "
                "Returns real listings with title, company, location, and description."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Job search query, e.g. 'Senior PM Developer Tools Remote hiring 2025'",
                    }
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


async def _search_jobs(query: str) -> str:
    tavily_key = os.getenv("TAVILY_API_KEY")
    if tavily_key:
        job_query = f"{query} job opening hiring apply"
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post(
                "https://api.tavily.com/search",
                json={"api_key": tavily_key, "query": job_query, "max_results": 6},
            )
            r.raise_for_status()
            results = r.json().get("results", [])
            lines = [f"- {res['title']} | {res['url']}\n  {res['content'][:400]}" for res in results]
            return "\n\n".join(lines) or "No job listings found."
    return f"[stub] Job search for '{query}' returned no results. Set TAVILY_API_KEY for real results."


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
    if name == "search_jobs":
        policy_event = {
            "type": "policy_check",
            "tool": name,
            "host": "api.tavily.com",
            "status": "allowed",
            "policy": "tavily_search → POST /search (jobs)",
        }
        result = await _search_jobs(args.get("query", ""))
        return result, policy_event
    return f"[error] Unknown tool: {name}", None
