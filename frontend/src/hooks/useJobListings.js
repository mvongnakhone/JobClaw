import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";

function timeAgo(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatSalary(min, max) {
  if (!min && !max) return null;
  const fmt = (n) => `$${Math.round(n / 1000)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return min ? `${fmt(min)}+` : `up to ${fmt(max)}`;
}

export function normalizeAdzunaJob(job, idx) {
  return {
    id: job.id || idx,
    role: job.title,
    company: job.company,
    location: job.location,
    salary: formatSalary(job.salary_min, job.salary_max) ?? "Salary not listed",
    tags: [job.category, job.contract_type].filter(Boolean).slice(0, 3),
    posted: timeAgo(job.created_at),
    isNew: Date.now() - new Date(job.created_at).getTime() < 3_600_000,
    url: job.redirect_url,
    description: job.description,
  };
}

export function useJobListings() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const channelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      // Load stored listings, trigger one refresh if the DB is empty
      try {
        const res = await apiFetch("/jobs");
        if (!cancelled && res.ok) {
          let data = await res.json();
          if (data.length === 0) {
            const refreshRes = await apiFetch("/jobs/refresh", { method: "POST" }).catch(() => null);
            // Re-fetch after refresh so jobs appear immediately without needing Realtime
            if (refreshRes?.ok) {
              const res2 = await apiFetch("/jobs");
              if (!cancelled && res2.ok) data = await res2.json();
            }
          }
          if (!cancelled) setJobs(data);
        }
      } catch {
        // silently fall through — UI shows empty state
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Subscribe to realtime inserts for this user
      const channel = supabase
        .channel("job_listings_stream")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "job_listings",
            filter: `user_email=eq.${user.email}`,
          },
          (payload) => {
            if (cancelled) return;
            setJobs((prev) => [payload.new, ...prev]);
            setNewCount((c) => c + 1);
          }
        )
        .subscribe();

      channelRef.current = channel;
    }

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const refresh = () => {
    setLoading(true);
    apiFetch("/jobs/refresh", { method: "POST" })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const clearNewCount = () => setNewCount(0);

  return { jobs, loading, newCount, refresh, clearNewCount };
}
