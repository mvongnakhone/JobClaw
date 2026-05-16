import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import './App.css'

const STATUS_LABEL = {
  idle: 'idle',
  thinking: 'thinking',
  tool_calling: 'calling tool',
  done: 'done',
  error: 'error',
}

export default function App() {
  const [task, setTask] = useState('')
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('idle')
  const [running, setRunning] = useState(false)
  const streamEndRef = useRef(null)

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [events])

  async function handleRun(e) {
    e.preventDefault()
    if (!task.trim() || running) return

    setEvents([])
    setStatus('thinking')
    setRunning(true)

    try {
      const response = await fetch('/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      })
      if (!response.ok || !response.body) {
        throw new Error(`server returned ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // NDJSON: split on newlines, parse each line as a JSON event
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // last (possibly partial) line stays in buffer
        for (const line of lines) {
          if (!line.trim()) continue
          let event
          try { event = JSON.parse(line) }
          catch (err) { console.error('parse error', err, line); continue }

          if (event.type === 'status') {
            setStatus(event.content)
          } else {
            setEvents(prev => [...prev, { ...event, id: crypto.randomUUID() }])
          }
        }
      }
    } catch (err) {
      setEvents(prev => [
        ...prev,
        { type: 'error', content: err.message, id: crypto.randomUUID() },
      ])
      setStatus('error')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark">▮</span>
          <span className="brand-name"><em>agent</em>.runner</span>
        </div>
        <div className={`status status-${status}`}>
          <span className="status-dot" />
          <span className="status-label">{STATUS_LABEL[status] || status}</span>
        </div>
      </header>

      <main className="main">
        <section className="input-section">
          <h1 className="title">
            give the agent <em>a task.</em>
          </h1>
          <p className="subtitle">
            it will reason, call tools, and stream its work back here in real time.
          </p>
          <form onSubmit={handleRun} className="task-form">
            <textarea
              className="task-input"
              placeholder="e.g. research the top 5 EV battery startups and summarize their tech…"
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleRun(e)
              }}
              disabled={running}
              rows={3}
            />
            <div className="form-row">
              <span className="hint">⌘/Ctrl + Enter to run</span>
              <button
                type="submit"
                className="run-btn"
                disabled={running || !task.trim()}
              >
                {running ? 'running…' : 'execute →'}
              </button>
            </div>
          </form>
        </section>

        <section className="stream-section">
          <div className="stream-header">
            <span className="stream-label">// stream</span>
            <span className="stream-count">{events.length} event{events.length === 1 ? '' : 's'}</span>
          </div>

          {events.length === 0 && !running && (
            <div className="empty">
              <span className="empty-dim">agent output will stream here…</span>
            </div>
          )}

          <div className="event-list">
            <AnimatePresence initial={false}>
              {events.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`event event-${event.type}`}
                >
                  <EventRow event={event} />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={streamEndRef} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>
          integration point: <code>backend/agent.py</code> · swap the stub for NemoClaw + Nemotron when ready.
        </span>
      </footer>
    </div>
  )
}

function EventRow({ event }) {
  if (event.type === 'thought') {
    return (
      <>
        <span className="event-tag">thought</span>
        <span className="event-body">{event.content}</span>
      </>
    )
  }
  if (event.type === 'tool_call') {
    return (
      <>
        <span className="event-tag tag-tool">tool →</span>
        <span className="event-body">
          <span className="tool-name">{event.tool}</span>
          <span className="tool-args">{JSON.stringify(event.args)}</span>
        </span>
      </>
    )
  }
  if (event.type === 'tool_result') {
    return (
      <>
        <span className="event-tag tag-result">← result</span>
        <span className="event-body">
          <span className="tool-name">{event.tool}</span>
          <span className="result-body">{event.content}</span>
        </span>
      </>
    )
  }
  if (event.type === 'final') {
    return (
      <>
        <span className="event-tag tag-final">final</span>
        <span className="event-body event-final-body">{event.content}</span>
      </>
    )
  }
  if (event.type === 'error') {
    return (
      <>
        <span className="event-tag tag-error">error</span>
        <span className="event-body">{event.content}</span>
      </>
    )
  }
  return <span className="event-body">{JSON.stringify(event)}</span>
}
