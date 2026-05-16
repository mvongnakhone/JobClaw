import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import { normalizeAdzunaJob } from "../hooks/useJobListings";

const PER_PAGE_OPTIONS = [10, 20, 50];

function JobCard({ job }) {
  const j = normalizeAdzunaJob(job);
  return (
    <div className="apply-card" style={{ alignItems: "flex-start", gap: 16 }}>
      <div className="apply-logo" style={{ marginTop: 4 }}>💼</div>
      <div className="apply-info" style={{ flex: 1 }}>
        <div className="apply-role">
          {j.role}
          {j.isNew && (
            <span className="chip chip-g" style={{ marginLeft: 8, fontSize: 10 }}>New</span>
          )}
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
