import { api } from "./api";
import type { LeaderboardEntry } from "./stats";

export type OrgRole = "owner" | "member";

export interface OrgSummary {
  id: number;
  name: string;
  slug: string;
  description: string;
  member_count: number;
  my_role: OrgRole | null;
  created_at: string;
}

export interface OrgMember {
  user_id: number;
  username: string;
  full_name: string;
  role: OrgRole;
  joined_at: string;
}

export interface OrgDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  owner_username: string;
  member_count: number;
  my_role: OrgRole | null;
  is_owner: boolean;
  members: OrgMember[];
  created_at: string;
}

/** A pending invite as seen from inside the organization. */
export interface OrgInvite {
  id: number;
  username: string;
  full_name: string;
  invited_by: string | null;
  status: string;
  created_at: string;
}

/** A learner's own invitation (inbox). */
export interface MyInvitation {
  id: number;
  organization_name: string;
  organization_slug: string;
  invited_by: string | null;
  status: string;
  created_at: string;
}

export interface UserSearchResult {
  id: number;
  username: string;
  full_name: string;
}

export interface OrgLeaderboard {
  results: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  organization: { name: string; slug: string };
}

export const orgApi = {
  list: () => api.get<OrgSummary[]>("/organizations").then((r) => r.data),
  create: (payload: { name: string; description?: string }) =>
    api.post<OrgDetail>("/organizations", payload).then((r) => r.data),
  detail: (slug: string) => api.get<OrgDetail>(`/organizations/${slug}`).then((r) => r.data),
  remove: (slug: string) => api.delete(`/organizations/${slug}`),
  leave: (slug: string) => api.post(`/organizations/${slug}/leave`),
  removeMember: (slug: string, userId: number) =>
    api.delete(`/organizations/${slug}/members/${userId}`),
  transferOwnership: (slug: string, userId: number) =>
    api.post<OrgDetail>(`/organizations/${slug}/transfer`, { user_id: userId }).then((r) => r.data),
  leaderboard: (slug: string) =>
    api.get<OrgLeaderboard>(`/organizations/${slug}/leaderboard`).then((r) => r.data),
  searchUsers: (slug: string, q: string) =>
    api
      .get<UserSearchResult[]>(`/organizations/${slug}/search-users`, { params: { q } })
      .then((r) => r.data),
  invitesForOrg: (slug: string) =>
    api.get<OrgInvite[]>(`/organizations/${slug}/invitations`).then((r) => r.data),
  invite: (slug: string, userId: number) =>
    api.post<OrgInvite>(`/organizations/${slug}/invitations`, { user_id: userId }).then((r) => r.data),
  myInvitations: () => api.get<MyInvitation[]>("/invitations").then((r) => r.data),
  myInvitationsCount: () =>
    api.get<{ count: number }>("/invitations/count").then((r) => r.data.count),
  respond: (id: number, action: "accept" | "reject") =>
    api.post<{ status: string }>(`/invitations/${id}/${action}`).then((r) => r.data),
};
