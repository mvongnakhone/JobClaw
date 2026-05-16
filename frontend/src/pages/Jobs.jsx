import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../lib/api";
import { supabase } from "../lib/supabase";
import { normalizeAdzunaJob } from "../hooks/useJobListings";

const PER_PAGE_OPTIONS = [10, 20, 50];

function scoreColor(score) {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return (
      <span style={{ fontSize: 11, color: "var(--muted)", padding: "2px 8px", border: "1px solid var(--border2)", borderRadius: 10 }}>
        Analyzing…
      </span>
    );
  }
  const c = scoreColor(score);
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: c, background: `${c}18`, padding: "2px 9px", borderRadius: 10, border: `1px solid ${c}44` }}>
      {score}% match
    </span>
  );
}

const TYPE_ICON = { experience: "💼", project: "🚀", volunteering: "🤝" };

function ResumeFitPanel({ ranking }) {
  if (!ranking || ranking.length === 0) return null;
  const sorted = [...ranking].sort((a, b) => b.relevance_score - a.relevance_score);
  return (
    <div style={{ marginTop: 12, borderTop: "1px solid var(--border2)", paddingTop: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 10 }}>
        RESUME FIT — ranked by relevance
      </div>
      {sorted.map((item, i) => {
        const c = scoreColor(item.relevance_score);
        return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{TYPE_ICON[item.type] ?? "📄"}</span>
            <div style={{ flex: 1, fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{item.title}</span>
                {item.company_or_context && (
                  <span style={{ color: "var(--muted)" }}>· {item.company_or_context}</span>
                )}
                <span style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}18`, padding: "1px 6px", borderRadius: 8, border: `1px solid ${c}33` }}>
                  {item.relevance_score}%
                </span>
              </div>
              {item.reason && (
                <div style={{ color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{item.reason}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function JobCard({ job }) {
  const j = normalizeAdzunaJob(job);
  const [fitOpen, setFitOpen] = useState(false);
  const hasRanking = Array.isArray(job.experience_ranking) && job.experience_ranking.length > 0;

  return (
    <div className="apply-card" style={{ alignItems: "flex-start", gap: 16, flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 16, width: "100%", alignItems: "flex-start" }}>
        <div className="apply-logo" style={{ marginTop: 4 }}>💼</div>
        <div className="apply-info" style={{ flex: 1 }}>
          <div className="apply-role" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            {j.role}
            {j.isNew && (
              <span className="chip chip-g" style={{ fontSize: 10 }}>New</span>
            )}
            <ScoreBadge score={job.compatibility_score} />
          </div>
          <div className="apply-sub">{j.company} · {j.location} · {j.salary}</div>
          {j.description && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>
              {j.description.slice(0, 160)}…
            </div>
          )}
          <div className="mc-tags" style={{ marginTop: 8 }}>
            {j.tags.map(t => <span key={t} className="chip chip-p">{t}</span>)}
          </div>
        </div>
        <div className="apply-right" style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, textAlign: "right" }}>{j.posted}</div>
          {j.url
            ? <a href={j.url} target="_blank" rel="noopener noreferrer" className="apply-action">View →</a>
            : <button className="apply-action" disabled>View →</button>
          }
        </div>
      </div>

      {/* Resume Fit toggle */}
      {hasRanking && (
        <div style={{ width: "100%", paddingLeft: 48 }}>
          <button
            onClick={() => setFitOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)", padding: 0, display: "flex", alignItems: "center", gap: 4 }}
          >
            {fitOpen ? "▲" : "▾"} Resume Fit
          </button>
          {fitOpen && <ResumeFitPanel ranking={job.experience_ranking} />}
        </div>
      )}
    </div>
  );
}

export default function Jobs({ onNav }) {
  const [jobs, setJobs]           = useState([]);
  const [page, setPage]           = useState(1);
  const [perPage, setPerPage]     = useState(20);
  const [isLastPage, setIsLastPage] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]       = useState("");
  const channelRef                = useRef(null);

  const fetchPage = useCallback(async (p, limit) => {
    setLoading(true);
    try {
      const offset = (p - 1) * limit;
      const res = await apiFetch(`/jobs?limit=${limit}&offset=${offset}`);
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data);
      setIsLastPage(data.length < limit);
    } catch {
      // silently fall through
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(page, perPage);
  }, [page, perPage, fetchPage]);

  // Subscribe to UPDATE events so analysis scores appear without a page refresh
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return;
      const channel = supabase
        .channel("job_score_updates")
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "job_listings",
          filter: `user_email=eq.${user.email}`,
        }, (payload) => {
          if (cancelled) return;
          setJobs(prev => prev.map(j => j.id === payload.new.id ? { ...j, ...payload.new } : j));
        })
        .subscribe();
      channelRef.current = channel;
    });
    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiFetch("/jobs/refresh", { method: "POST" });
      await fetchPage(1, perPage);
      setPage(1);
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = search.trim()
    ? jobs.filter(j =>
        [j.title, j.company, j.location, j.category].some(
          f => f?.toLowerCase().includes(search.toLowerCase())
        )
      )
    : jobs;

  const startItem = (page - 1) * perPage + 1;
  const endItem   = (page - 1) * perPage + jobs.length;

  return (
    <div>
      <div className="home-body" style={{ paddingTop: 32 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="nav-link" style={{ fontSize: 13, color: "var(--muted)" }} onClick={() => onNav("home")}>
              ← Back
            </button>
            <h2 style={{ margin: 0 }}>📡 All job listings</h2>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search title, company, location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: "var(--card)", border: "1.5px solid var(--border2)", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "var(--ink)", outline: "none", width: 220 }}
            />
            <button
              className="btn-out"
              style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? "Fetching…" : "↻ Fetch new"}
            </button>
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {!loading && jobs.length > 0 && !search && (
              <>Showing {startItem}–{endItem}</>
            )}
            {!loading && search && (
              <>{filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;</>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Per page</span>
            {PER_PAGE_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => handlePerPageChange(n)}
                className={perPage === n ? "hero-btn-solid" : "btn-out"}
                style={{ fontSize: 12, padding: "4px 12px", minWidth: 36 }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Job list */}
        {loading ? (
          <div style={{ color: "var(--muted)", fontSize: 13, padding: "32px 0", textAlign: "center" }}>
            <span className="mc-new-dot" style={{ marginRight: 6, display: "inline-block" }} />
            Loading listings…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 13, padding: "32px 0", textAlign: "center" }}>
            {search ? `No listings on this page match "${search}".` : "No listings yet — click \"Fetch new\" to pull from Adzuna."}
          </div>
        ) : (
          <div className="apply-list">
            {filtered.map((job, i) => <JobCard key={job.id ?? i} job={job} />)}
          </div>
        )}

        {/* Pagination controls */}
        {!loading && !search && jobs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 28 }}>
            <button
              className="btn-out"
              style={{ fontSize: 13, padding: "6px 18px" }}
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: "var(--muted)", minWidth: 60, textAlign: "center" }}>
              Page {page}
            </span>
            <button
              className="btn-out"
              style={{ fontSize: 13, padding: "6px 18px" }}
              onClick={() => setPage(p => p + 1)}
              disabled={isLastPage}
            >
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
