import { supabase } from "./supabase";

export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (session) headers["Authorization"] = `Bearer ${session.access_token}`;
  return fetch(path, { ...options, headers });
}
