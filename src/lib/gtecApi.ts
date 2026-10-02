// Thin fetch wrapper for the GTEC public API running on the Pi (bot + Mongo
// team/player data), reached through a Cloudflare tunnel. See VITE_GTEC_API_URL
// in .env -- that URL is NOT permanent, it changes if the Pi reboots or the
// tunnel process restarts, so it's centralized here rather than hardcoded
// anywhere else.

import { supabase } from "@/integrations/supabase/client";

const BASE_URL = import.meta.env.VITE_GTEC_API_URL as string | undefined;

export interface GtecTeamMember {
  discordUserId: string;
  role: "Captain" | "Co-Captain" | "Team Executive" | "Team Member" | null;
}

export interface GtecTeam {
  id: string;
  tag: string;
  name: string;
  fullName: string;
  official: boolean;
  color: string;
  hasLogo: boolean;
  captainId: string | null;
  coCaptains: string[];
  executiveId: string | null;
  members: GtecTeamMember[];
  locked: boolean;
  isReigning: boolean;
  stars: number;
  diamonds: number;
  isReturning: boolean;
  teamMessage: string | null;
  createdAt: number | null;
  officialSince: number | null;
}

export interface DiscordIdentity {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface GtecPlayer {
  discordUserId: string;
  identity: DiscordIdentity;
  bio: string | null;
  team: (GtecTeam & { myRole: GtecTeamMember["role"] }) | null;
  pastTeams: string[];
}

async function request<T>(path: string): Promise<T> {
  if (!BASE_URL) {
    throw new Error("VITE_GTEC_API_URL is not set — see .env");
  }
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`GTEC API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Grabs the current Supabase session's access token, if logged in. Sent as
// a Bearer token on write requests so the Pi API can verify who's actually
// making the request (see api/supabaseAuth.js on the bot side).
async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// Shared helper for the login-gated write endpoints below: attaches the
// Bearer token, throws a clear error if not logged in or if the server
// rejects the request, and returns the parsed JSON body.
async function authedRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  if (!BASE_URL) throw new Error("VITE_GTEC_API_URL is not set");
  const token = await getAccessToken();
  if (!token) throw new Error("You need to be logged in with Discord to do that.");
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function logoUrl(teamId: string): string {
  return `${BASE_URL}/teams/${teamId}/logo`;
}

export async function fetchTeams(opts: { official?: boolean | "all"; search?: string } = {}): Promise<GtecTeam[]> {
  const params = new URLSearchParams();
  if (opts.official === true) params.set("official", "true");
  else if (opts.official === false) params.set("official", "false");
  if (opts.search) params.set("search", opts.search);
  const qs = params.toString();
  const { teams } = await request<{ teams: GtecTeam[] }>(`/teams${qs ? `?${qs}` : ""}`);
  return teams;
}

export async function fetchTeam(id: string): Promise<GtecTeam> {
  const { team } = await request<{ team: GtecTeam }>(`/teams/${id}`);
  return team;
}

export async function fetchPlayer(discordUserId: string): Promise<GtecPlayer> {
  return request<GtecPlayer>(`/players/${discordUserId}`);
}

export interface PlayerDirectoryEntry {
  discordUserId: string;
  identity: DiscordIdentity;
  teamStatus: "official" | "unofficial" | "none";
  teamName: string | null;
}

export async function searchPlayers(opts: {
  search?: string;
  status?: "all" | "official" | "unofficial" | "none";
  limit?: number;
  offset?: number;
} = {}): Promise<{ players: PlayerDirectoryEntry[]; total: number }> {
  const params = new URLSearchParams();
  if (opts.search) params.set("search", opts.search);
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  const qs = params.toString();
  const data = await request<{ players: PlayerDirectoryEntry[]; total: number }>(`/players${qs ? `?${qs}` : ""}`);
  return data;
}

export async function resolveDiscordUsers(ids: string[]): Promise<Record<string, DiscordIdentity>> {
  if (ids.length === 0) return {};
  const unique = [...new Set(ids)];
  const { users } = await request<{ users: Record<string, DiscordIdentity> }>(
    `/discord-users?ids=${unique.join(",")}`
  );
  return users;
}

// Logged-in: sets your own bio. Enforced server-side that the caller can
// only ever edit their own discordUserId.
export async function updateMyBio(discordUserId: string, bio: string): Promise<{ bio: string | null }> {
  return authedRequest(`/players/${discordUserId}/bio`, "PATCH", { bio });
}

// Logged-in: sets a team's public message. Server checks the caller is
// that team's Captain, Co-Captain, or Team Executive.
export async function updateTeamMessage(teamId: string, teamMessage: string): Promise<GtecTeam> {
  const { team } = await authedRequest<{ team: GtecTeam }>(`/teams/${teamId}/message`, "PATCH", { teamMessage });
  return team;
}

// Logged-in: creates a new unofficial team. Mirrors /create-team's real
// validation (format, blacklist, duplicate names, already-on-a-team, etc.)
// server-side -- errors thrown here carry the server's actual reason.
export async function createTeam(input: { tag: string; name: string; color: string; logoUrl?: string }): Promise<GtecTeam> {
  const { team } = await authedRequest<{ team: GtecTeam }>("/teams", "POST", input);
  return team;
}

// Admin-only: updates a team's cosmetic status badges (reigning champion,
// returning team, past-champion star count). Nothing else about a team is
// editable through this call, by design.
export async function updateTeamBadges(
  teamId: string,
  badges: { isReigning?: boolean; isReturning?: boolean; stars?: number }
): Promise<GtecTeam> {
  if (!BASE_URL) throw new Error("VITE_GTEC_API_URL is not set");
  const adminKey = import.meta.env.VITE_GTEC_ADMIN_KEY as string | undefined;
  const res = await fetch(`${BASE_URL}/teams/${teamId}/badges`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(adminKey ? { "x-admin-key": adminKey } : {}),
    },
    body: JSON.stringify(badges),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to update badges: ${res.status}`);
  }
  const { team } = await res.json();
  return team;
}
