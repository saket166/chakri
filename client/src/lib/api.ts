// Central API client — talks to Express backend which reads/writes Supabase
// Auth: JWT token stored in localStorage, sent as Authorization: Bearer header

const BASE = "/api";

function token(): string {
  return localStorage.getItem("chakri_token") || "";
}

function headers() {
  const t = token();
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function post<T>(path: string, body?: any): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function patch<T>(path: string, body?: any): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { method: "PATCH", headers: headers(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── API surface ─────────────────────────────────────────────────────────────
export const api = {
  auth: {
    signup: (data: any) => post<any>("/auth/signup", data),
    verifyOtp: (userId: string, otp: string) => post<any>("/auth/verify-otp", { userId, otp }),
    resendOtp: (userId: string) => post<any>("/auth/resend-otp", { userId }),
    signin: (email: string, password: string) => post<any>("/auth/signin", { email, password }),
    forgotPassword: (email: string) => post<any>("/auth/forgot-password", { email }),
    resetPassword: (token: string, email: string, newPassword: string) =>
      post<any>("/auth/reset-password", { token, email, newPassword }),
    me: () => get<any>("/users/me"),
    update: (data: any) => patch<any>("/users/me", data),
  },
  users: {
    search: (q: string) => get<any[]>(`/users/search?q=${encodeURIComponent(q)}`),
    sendConnectRequest: (toId: string) => post<any>("/users/connect-request", { toId }),
    acceptConnectRequest: (requestId: string) => post<any>("/users/connect-accept", { requestId }),
    rejectConnectRequest: (requestId: string) => post<any>("/users/connect-reject", { requestId }),
    connectRequests: () => get<any[]>("/users/connect-requests"),
    connectSent: () => get<string[]>("/users/connect-sent"),
    connections: () => get<any[]>("/users/connections"),
    recommendations: (userId: string) => get<any[]>(`/recommendations/${userId}`),
    companyStats: () => get<{ company: string; count: number }[]>("/users/company-stats"),
  },
  requests: {
    list: () => get<any[]>("/requests"),
    create: (data: any) => post<any>("/requests", data),
    accept: (id: string) => post<any>(`/requests/${id}/accept`),
    refereeConfirm: (id: string, note: string) => post<any>(`/requests/${id}/referee-confirm`, { note }),
    requesterConfirm: (id: string) => post<any>(`/requests/${id}/requester-confirm`),
    boost: (id: string, coins: number) => post<any>(`/requests/${id}/boost`, { coins }),
  },
  feed: {
    list: () => get<any[]>("/feed"),
  },
  recommendations: {
    post: (data: any) => post<any>("/recommendations", data),
  },
  messages: {
    list: () => get<any[]>("/messages"),
    thread: (withId: string) => get<any[]>(`/messages/${withId}`),
    send: (toId: string, text: string) => post<any>("/messages", { toId, text }),
  },
  chat: {
    list: (requestId: string) => get<any[]>(`/chat/${requestId}`),
    send: (requestId: string, text: string) => post<any>(`/chat/${requestId}`, { text }),
  },
};

// ── Session helpers ─────────────────────────────────────────────────────────
export function setSession(userId: string, user: any, jwtToken: string) {
  localStorage.setItem("chakri_user_id", userId);
  localStorage.setItem("chakri_user_cache", JSON.stringify(user));
  localStorage.setItem("chakri_token", jwtToken);
}
export function clearSession() {
  localStorage.removeItem("chakri_user_id");
  localStorage.removeItem("chakri_user_cache");
  localStorage.removeItem("chakri_token");
}
export function getCachedUser(): any | null {
  const s = localStorage.getItem("chakri_user_cache");
  return s ? JSON.parse(s) : null;
}
export function isLoggedIn(): boolean {
  return !!localStorage.getItem("chakri_token");
}
