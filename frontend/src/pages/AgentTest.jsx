import { useState, useEffect, useRef } from "react";

const STATUS_LABEL = { idle:"idle", thinking:"thinking", tool_calling:"calling tool", done:"done", error:"error" };

export default function AgentTest() {
  const [task, setTask]       = useState("");
  const [events, setEvents]   = useState([]);
  const [status, setStatus]   = useState("idle");
  const [running, setRunning] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [events]);

  async function handleRun(e) {
    e.preventDefault();
    if (!task.trim() || running) return;
    setEvents([]); setStatus("thinking"); setRunning(true);
    try {
      const res = await fetch("/run", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ task }) });
      if (!res.ok || !res.body) throw new Error(`server ${res.status}`);
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            if (ev.type === "status") setStatus(ev.content);
            else setEvents(p => [...p, { ...ev, id: crypto.randomUUID() }]);
          } catch {}
        }
      }
    } catch (err) {
      setEvents(p => [...p, { type:"error", content: err.message, id: crypto.randomUUID() }]);
      setStatus("error");
    } finally { setRunning(false); }
  }

  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"40px 24px" }}>
      <h2 style={{ fontFamily:"var(--font-d)", fontSize:28, marginBottom:6 }}>NemoClaw Agent <em>test</em></h2>
      <p style={{ color:"var(--muted)", fontSize:13, marginBottom:24 }}>Type any task and watch the agent stream its reasoning live.</p>
      <form onSubmit={handleRun} style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <textarea className="task-input" rows={3} placeholder="e.g. What are the top 3 AI startups in 2025?"
          value={task} onChange={e => setTask(e.target.value)}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleRun(e); }}
          disabled={running} style={{ width:"100%", resize:"vertical" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, color:"var(--muted)" }}>
            Status: <strong style={{ color: status === "error" ? "var(--red)" : status === "done" ? "var(--green)" : "var(--blue)" }}>
              {STATUS_LABEL[status] || status}
            </strong>
          </span>
          <button type="submit" className="btn btn-grad" disabled={running || !task.trim()}>
            {running ? "running…" : "run agent →"}
          </button>
        </div>
      </form>

      {events.length > 0 && (
        <div style={{ marginTop:24, display:"flex", flexDirection:"column", gap:6 }}>
          {events.map(ev => (
            <div key={ev.id} style={{
              padding:"10px 14px", borderRadius:8, background:"var(--surf2)",
              borderLeft:`3px solid ${
                ev.type === "final"       ? "var(--green)" :
                ev.type === "error"       ? "var(--red)"   :
                ev.type === "tool_call" || ev.type === "tool_result" ? "var(--blue)" :
                "var(--border2)"
              }`, fontSize:13,
            }}>
              <span style={{ fontWeight:700, marginRight:8, textTransform:"uppercase", fontSize:10, letterSpacing:".08em", color:"var(--muted)" }}>{ev.type}</span>
              <span style={{ color:"var(--ink)", whiteSpace:"pre-wrap" }}>{ev.content ?? JSON.stringify(ev.args ?? ev)}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
