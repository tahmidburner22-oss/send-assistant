// Centralised API client — all backend calls go through here
// Talks only to our own self-hosted Express server

const API_BASE = import.meta.env.VITE_API_URL || "";

// ── Token management ──────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem("send_token");
}

export function setToken(token: string) {
  localStorage.setItem("send_token", token);
}

export function clearToken() {
  localStorage.removeItem("send_token");
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/";
    throw new Error("Session expired");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: any; mfaRequired: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; displayName: string; schoolId?: string; role?: string }) =>
    apiFetch<{ message: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  googleAuth: (data: { googleId: string; email: string; displayName: string }) =>
    apiFetch<{ token: string; user: any }>("/auth/google", { method: "POST", body: JSON.stringify(data) }),

  logout: () => apiFetch<{ message: string }>("/auth/logout", { method: "POST" }),

  me: () => apiFetch<{ user: any; school: any }>("/auth/me"),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  resetPassword: (token: string, password: string) =>
    apiFetch<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),

  verifyEmail: (token: string) =>
    apiFetch<{ message: string }>(`/auth/verify-email?token=${token}`),

  mfaSetup: () => apiFetch<{ secret: string; qrDataUrl: string }>("/auth/mfa/setup", { method: "POST" }),

  mfaEnable: (code: string) =>
    apiFetch<{ message: string }>("/auth/mfa/enable", { method: "POST", body: JSON.stringify({ code }) }),

  mfaVerify: (token: string, code: string) =>
    apiFetch<{ token: string; user: any }>("/auth/mfa/verify", { method: "POST", body: JSON.stringify({ token, code }) }),

  mfaDisable: () => apiFetch<{ message: string }>("/auth/mfa/disable", { method: "POST" }),
};

// ── Schools ───────────────────────────────────────────────────────────────────
export const schools = {
  onboard: (data: any) => apiFetch<any>("/schools/onboard", { method: "POST", body: JSON.stringify(data) }),
  mySchool: () => apiFetch<any>("/schools/my"),
  updateSchool: (data: any) => apiFetch<any>("/schools/my", { method: "PUT", body: JSON.stringify(data) }),
  listAll: () => apiFetch<any[]>("/schools"),
  listUsers: (schoolId?: string) => apiFetch<any[]>(`/schools/users${schoolId ? `?schoolId=${schoolId}` : ""}`),
  inviteUser: (data: any) => apiFetch<any>("/schools/users/invite", { method: "POST", body: JSON.stringify(data) }),
  updateUserRole: (userId: string, role: string) =>
    apiFetch<any>(`/schools/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  deactivateUser: (userId: string) =>
    apiFetch<any>(`/schools/users/${userId}/deactivate`, { method: "POST" }),
  reactivateUser: (userId: string) =>
    apiFetch<any>(`/schools/users/${userId}/reactivate`, { method: "POST" }),
  auditLogs: (schoolId?: string, limit = 100) =>
    apiFetch<any[]>(`/schools/audit?limit=${limit}${schoolId ? `&schoolId=${schoolId}` : ""}`),
};

// ── Pupils ────────────────────────────────────────────────────────────────────
export const pupils = {
  list: () => apiFetch<any[]>("/pupils"),
  get: (id: string) => apiFetch<any>(`/pupils/${id}`),
  create: (data: any) => apiFetch<any>("/pupils", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/pupils/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  archive: (id: string) => apiFetch<any>(`/pupils/${id}`, { method: "DELETE" }),
  bulkImport: (rows: any[]) => apiFetch<any>("/pupils/bulk-import", { method: "POST", body: JSON.stringify({ pupils: rows }) }),
  recordAttendance: (id: string, data: any) =>
    apiFetch<any>(`/pupils/${id}/attendance`, { method: "POST", body: JSON.stringify(data) }),
  recordBehaviour: (id: string, data: any) =>
    apiFetch<any>(`/pupils/${id}/behaviour`, { method: "POST", body: JSON.stringify(data) }),
  createAssignment: (id: string, data: any) =>
    apiFetch<any>(`/pupils/${id}/assignments`, { method: "POST", body: JSON.stringify(data) }),
  updateAssignment: (pupilId: string, assignmentId: string, data: any) =>
    apiFetch<any>(`/pupils/${pupilId}/assignments/${assignmentId}`, { method: "PUT", body: JSON.stringify(data) }),
  listIncidents: () => apiFetch<any[]>("/pupils/safeguarding/incidents"),
  reportIncident: (data: any) =>
    apiFetch<any>("/pupils/safeguarding/incidents", { method: "POST", body: JSON.stringify(data) }),
  updateIncident: (id: string, data: any) =>
    apiFetch<any>(`/pupils/safeguarding/incidents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  listSupportPlans: (id: string) =>
    apiFetch<any[]>(`/pupils/${id}/support-plans`),
  saveSupportPlan: (id: string, data: any) =>
    apiFetch<any>(`/pupils/${id}/support-plans`, { method: "POST", body: JSON.stringify(data) }),
  updateSupportPlan: (pupilId: string, planId: string, data: any) =>
    apiFetch<any>(`/pupils/${pupilId}/support-plans/${planId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSupportPlan: (pupilId: string, planId: string) =>
    apiFetch<any>(`/pupils/${pupilId}/support-plans/${planId}`, { method: "DELETE" }),
};

// ── Data (worksheets, stories, etc.) ─────────────────────────────────────────
export const data = {
  worksheets: {
    list: () => apiFetch<any[]>("/data/worksheets"),
    create: (d: any) => apiFetch<any>("/data/worksheets", { method: "POST", body: JSON.stringify(d) }),
    update: (id: string, d: any) => apiFetch<any>(`/data/worksheets/${id}`, { method: "PUT", body: JSON.stringify(d) }),
    delete: (id: string) => apiFetch<any>(`/data/worksheets/${id}`, { method: "DELETE" }),
  },
  stories: {
    list: () => apiFetch<any[]>("/data/stories"),
    create: (d: any) => apiFetch<any>("/data/stories", { method: "POST", body: JSON.stringify(d) }),
  },
  differentiations: {
    list: () => apiFetch<any[]>("/data/differentiations"),
    create: (d: any) => apiFetch<any>("/data/differentiations", { method: "POST", body: JSON.stringify(d) }),
  },
  ideas: {
    list: () => apiFetch<any[]>("/data/ideas"),
    create: (d: any) => apiFetch<any>("/data/ideas", { method: "POST", body: JSON.stringify(d) }),
    vote: (id: string) => apiFetch<any>(`/data/ideas/${id}/vote`, { method: "POST" }),
  },
  analytics: () => apiFetch<any>("/data/analytics"),
  cookieConsent: (d: any) => apiFetch<any>("/data/cookie-consent", { method: "POST", body: JSON.stringify(d) }),
  completeOnboarding: () => apiFetch<any>("/data/onboarding-complete", { method: "POST" }),
  sendParentMessage: (pupilId: string, subject: string, message: string) =>
    apiFetch<{ ok: boolean; message: string }>("/data/parent-message", {
      method: "POST",
      body: JSON.stringify({ pupilId, subject, message }),
    }),
};

// ── AI (proxied through backend for content filtering) ────────────────────────────────────
export const ai = {
  generate: (d: { prompt: string; systemPrompt?: string; provider?: string; model?: string; apiKey?: string; maxTokens?: number }) =>
    apiFetch<{ content: string; aiGenerated: boolean; flagged?: boolean; warning?: string }>("/ai/generate", {
      method: "POST",
      body: JSON.stringify(d),
    }),
  ensemble: (d: { prompt: string; systemPrompt?: string; maxTokens?: number }) =>
    apiFetch<{ content: string; provider: string; ensemble: boolean; contributors?: string; aiGenerated: boolean }>("/ai/ensemble", {
      method: "POST",
      body: JSON.stringify(d),
    }),
  providers: () => apiFetch<{ providers: Array<{ provider: string; model: string; source: string }> }>("/ai/providers"),
  filterLog: () => apiFetch<any[]>("/ai/filter-log"),
  stats: () => apiFetch<any>("/ai/stats"),
  adminKeys: {
    list: () => apiFetch<any[]>("/ai/admin/keys"),
    set: (provider: string, apiKey: string, model?: string) =>
      apiFetch<any>("/ai/admin/keys", { method: "POST", body: JSON.stringify({ provider, apiKey, model }) }),
    remove: (provider: string) =>
      apiFetch<any>(`/ai/admin/keys/${provider}`, { method: "DELETE" }),
  },
};

// ── Admin data ────────────────────────────────────────────────────────────────────
export const adminData = {
  allWorksheets: () => apiFetch<any[]>("/data/admin/worksheets"),
};

// ── Billing (Stripe) ──────────────────────────────────────────────────────────
export const billing = {
  status: () =>
    apiFetch<{
      status: string;
      plan: string | null;
      licenceType: string;
      trialEndsAt: string | null;
      periodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      isAccessible: boolean;
      stripeConfigured: boolean;
    }>("/billing/status"),
  checkout: (plan: string, billingPeriod: "monthly" | "annual") =>
    apiFetch<{ url: string }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan, billing: billingPeriod }),
    }),
  portal: () =>
    apiFetch<{ url: string }>("/billing/portal", { method: "POST" }),
};
