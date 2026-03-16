import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth as authApi, data as dataApi, pupils as pupilsApi, getToken, setToken, clearToken } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: "mat_admin" | "school_admin" | "senco" | "teacher" | "ta";
  schoolId: string | null;
  mfaEnabled: boolean;
  emailVerified: boolean;
  onboardingDone: boolean;
}

export interface School {
  id: string; name: string; urn?: string; domain?: string;
  dslName?: string; dslEmail?: string; dslPhone?: string;
  licenceType: string; trialEndsAt?: string; onboardingComplete: boolean;
}

export interface TimetableLesson {
  day: string; // "Monday" | "Tuesday" etc.
  period: number; // 1-8
  subject: string;
  teacher?: string;
  room?: string;
  startTime?: string;
  endTime?: string;
}

export interface Child {
  id: string; name: string; yearGroup: string;
  /** Primary SEND need (legacy single-value, kept for backward compat) */
  sendNeed: string;
  /** Multiple SEND needs — stored as comma-separated in DB, parsed to array in frontend */
  sendNeeds: string[];
  code: string; upn?: string; dob?: string; createdAt: string;
  parentEmail?: string; parentName?: string;
  assignments: Assignment[]; submissions: Submission[];
  timetable?: TimetableLesson[];
}

export type AttendanceStatus = "attended" | "absent" | "late" | "other" | "not-recorded";

export interface AttendanceRecord {
  id: string; childId: string; date: string;
  amStatus: AttendanceStatus; amReason?: string;
  pmStatus: AttendanceStatus; pmReason?: string;
  notes?: string; recordedAt: string; recordedBy: string;
  misSource?: string;
}

export interface Assignment {
  id: string; title: string; type: "worksheet" | "story" | "differentiation" | string; content: string;
  assignedAt: string; status: "not-started" | "started" | "completed";
  feedback?: string; mark?: string; progress?: number; teacherComment?: string;
  // Full sections array for proper WorksheetRenderer display in Parent Portal
  sections?: Array<{ title: string; type: string; content: string; teacherOnly?: boolean; svg?: string; caption?: string }>;
  metadata?: { subject?: string; topic?: string; yearGroup?: string; difficulty?: string; examBoard?: string; sendNeed?: string; };
  subtitle?: string;
}

export interface Submission {
  id: string; title: string; content: string; fileDataUrl?: string;
  fileName?: string; fileType?: string; submittedAt: string;
  feedback?: string; mark?: string; teacherComment?: string; question?: string;
}

export interface Worksheet {
  id: string; title: string; subtitle?: string; subject: string; topic: string; yearGroup: string;
  sendNeed?: string; difficulty: string; examBoard?: string; content: string;
  teacherContent: string; createdAt: string; rating?: number; ratingLabel?: string; overlay?: string;
  // Full sections array preserved for re-editing saved worksheets
  sections?: Array<{ title: string; type: string; content: string; teacherOnly?: boolean; svg?: string; caption?: string }>;
  metadata?: { subject?: string; topic?: string; yearGroup?: string; difficulty?: string; examBoard?: string; totalMarks?: number; estimatedTime?: string; adaptations?: string[]; phase?: string; };
  isAI?: boolean;
}

export interface Story {
  id: string; title: string; genre: string; yearGroup: string; sendNeed?: string;
  characters: string[]; setting?: string; theme?: string; readingLevel: string;
  length: string; content: string; comprehensionQuestions?: string[]; createdAt: string;
}

export interface Differentiation {
  id: string; taskContent: string; differentiatedContent: string;
  sendNeed?: string; yearGroup?: string; subject?: string; createdAt: string;
}

export interface Idea {
  id: string; title: string; description: string; votes: number;
  createdAt: string; author: string;
}

export interface ParentNewsletter {
  id: string;
  title: string;
  content: string;
  date: string;
  type: string;
  createdAt: string;
}

interface AppState {
  loading: boolean;
  user: User | null;
  school: School | null;
  children: Child[];
  worksheetHistory: Worksheet[];
  storyHistory: Story[];
  differentiationHistory: Differentiation[];
  attendanceRecords: AttendanceRecord[];
  ideas: Idea[];
  parentNewsletters: ParentNewsletter[];
  colorOverlay: string;
  isLoggedIn: boolean;
  mfaRequired: boolean;
  pendingToken: string | null;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<{ mfaRequired?: boolean; error?: string }>;
  loginWithGoogle: (googleData: { googleId: string; email: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  registerTeacher: (email: string, password: string, displayName: string, schoolId?: string) => Promise<{ error?: string }>;
  verifyMfa: (code: string) => Promise<void>;
  addChild: (child: Omit<Child, "id" | "code" | "createdAt" | "assignments" | "submissions">) => Promise<Child>;
  removeChild: (id: string) => Promise<void>;
  updateChild: (id: string, updates: Partial<Child>) => Promise<void>;
  assignWork: (childId: string, assignment: Omit<Assignment, "id" | "assignedAt" | "status">) => Promise<void>;
  updateAssignment: (childId: string, assignmentId: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (childId: string, assignmentId: string) => Promise<void>;
  addSubmission: (childId: string, submission: Omit<Submission, "id" | "submittedAt">) => void;
  updateSubmission: (childId: string, submissionId: string, updates: Partial<Submission>) => void;
  saveWorksheet: (worksheet: Omit<Worksheet, "id" | "createdAt">) => Promise<Worksheet>;
  updateWorksheet: (id: string, updates: Partial<Worksheet>) => Promise<void>;
  deleteWorksheet: (id: string) => Promise<void>;
  saveStory: (story: Omit<Story, "id" | "createdAt">) => Promise<Story>;
  saveDifferentiation: (diff: Omit<Differentiation, "id" | "createdAt">) => Promise<Differentiation>;
  saveAttendance: (record: Omit<AttendanceRecord, "id" | "recordedAt">) => Promise<AttendanceRecord>;
  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => void;
  getAttendanceForChild: (childId: string, date?: string) => AttendanceRecord[];
  getAttendanceForDate: (date: string) => AttendanceRecord[];
  addIdea: (idea: Omit<Idea, "id" | "createdAt" | "votes">) => Promise<void>;
  voteIdea: (id: string) => Promise<void>;
  saveParentNewsletter: (newsletter: Omit<ParentNewsletter, "id" | "createdAt">) => void;
  deleteParentNewsletter: (id: string) => void;
  setColorOverlay: (overlay: string) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function generateId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function AppProvider({ children: childrenProp }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    loading: true, user: null, school: null, children: [],
    worksheetHistory: [], storyHistory: [], differentiationHistory: [],
    attendanceRecords: [], ideas: [],
    parentNewsletters: (() => { try { return JSON.parse(localStorage.getItem("adaptly_newsletters") || "[]"); } catch { return []; } })(),
    colorOverlay: "none",
    isLoggedIn: false, mfaRequired: false, pendingToken: null,
  });

  const loadUserData = useCallback(async () => {
    try {
      const [ws, stories, diffs, ideasData, pupilsData] = await Promise.allSettled([
        dataApi.worksheets.list(),
        dataApi.stories.list(),
        dataApi.differentiations.list(),
        dataApi.ideas.list(),
        pupilsApi.list(),
      ]);
      const mappedPupils = pupilsData.status === "fulfilled" && Array.isArray(pupilsData.value) ? pupilsData.value.map(mapPupil) : null;
      const attendanceRecords = pupilsData.status === "fulfilled" && Array.isArray(pupilsData.value)
        ? pupilsData.value.flatMap((p: any) => Array.isArray(p.attendance) ? p.attendance.map(mapAttendanceRecord) : [])
        : null;
      setState(s => ({
        ...s,
        worksheetHistory: ws.status === "fulfilled" ? (Array.isArray(ws.value) ? ws.value : s.worksheetHistory) : s.worksheetHistory,
        storyHistory: stories.status === "fulfilled" ? (Array.isArray(stories.value) ? stories.value.map(mapStory) : s.storyHistory) : s.storyHistory,
        differentiationHistory: diffs.status === "fulfilled" ? (Array.isArray(diffs.value) ? diffs.value.map(mapDiff) : s.differentiationHistory) : s.differentiationHistory,
        ideas: ideasData.status === "fulfilled" ? (Array.isArray(ideasData.value) ? ideasData.value.map(mapIdea) : s.ideas) : s.ideas,
        children: mappedPupils ?? s.children,
        attendanceRecords: attendanceRecords ?? s.attendanceRecords,
      }));
    } catch (err) { console.error("Failed to load user data:", err); }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { setState(s => ({ ...s, loading: false })); return; }
    authApi.me()
      .then(({ user, school }) => {
        setState(s => ({ ...s, user, school, isLoggedIn: true, loading: false }));
        loadUserData();
      })
      .catch(() => { clearToken(); setState(s => ({ ...s, loading: false })); });
  }, []);

  const refreshData = useCallback(async () => { await loadUserData(); }, [loadUserData]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await authApi.login(email, password);
      if (result.mfaRequired) {
        setState(s => ({ ...s, mfaRequired: true, pendingToken: result.token }));
        return { mfaRequired: true };
      }
      setToken(result.token);
      const { user, school } = await authApi.me();
      setState(s => ({ ...s, user, school, isLoggedIn: true, mfaRequired: false, pendingToken: null }));
      await loadUserData();
      return {};
    } catch (err: any) { return { error: err.message }; }
  }, [loadUserData]);

  const loginWithGoogle = useCallback(async (googleData: { googleId: string; email: string; displayName: string }) => {
    const result = await authApi.googleAuth(googleData);
    setToken(result.token);
    const { user, school } = await authApi.me();
    setState(s => ({ ...s, user, school, isLoggedIn: true }));
    await loadUserData();
  }, [loadUserData]);

  const verifyMfa = useCallback(async (code: string) => {
    const pendingToken = state.pendingToken;
    if (!pendingToken) throw new Error("No pending MFA session");
    const result = await authApi.mfaVerify(pendingToken, code);
    setToken(result.token);
    const { user, school } = await authApi.me();
    setState(s => ({ ...s, user, school, isLoggedIn: true, mfaRequired: false, pendingToken: null }));
    await loadUserData();
  }, [state.pendingToken, loadUserData]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    clearToken();
    setState(s => ({ ...s, user: null, school: null, isLoggedIn: false, children: [], worksheetHistory: [], storyHistory: [], differentiationHistory: [], attendanceRecords: [], ideas: [] }));
  }, []);

  const registerTeacher = useCallback(async (email: string, password: string, displayName: string, schoolId?: string) => {
    try { await authApi.register({ email, password, displayName, schoolId }); return {}; }
    catch (err: any) { return { error: err.message }; }
  }, []);

  const addChild = useCallback(async (child: Omit<Child, "id" | "code" | "createdAt" | "assignments" | "submissions">) => {
    // Store multiple SEND needs as comma-separated string in the single DB column
    const sendNeedValue = child.sendNeeds && child.sendNeeds.length > 0
      ? child.sendNeeds.join(",")
      : child.sendNeed;
    const result = await pupilsApi.create({ name: child.name, yearGroup: child.yearGroup, sendNeed: sendNeedValue });
    const newChild: Child = { ...child, id: result.id, code: result.code, createdAt: new Date().toISOString(), assignments: [], submissions: [] };
    setState(s => ({ ...s, children: [...s.children, newChild] }));
    return newChild;
  }, []);

  const removeChild = useCallback(async (id: string) => {
    await pupilsApi.archive(id);
    setState(s => ({ ...s, children: s.children.filter(c => c.id !== id) }));
  }, []);

  const updateChild = useCallback(async (id: string, updates: Partial<Child>) => {
    // Merge sendNeeds array back to comma-separated string for DB storage
    const sendNeedValue = updates.sendNeeds && updates.sendNeeds.length > 0
      ? updates.sendNeeds.join(",")
      : updates.sendNeed;
    await pupilsApi.update(id, { name: updates.name, yearGroup: updates.yearGroup, sendNeed: sendNeedValue, timetable: updates.timetable, parentEmail: updates.parentEmail, parentName: updates.parentName });
    setState(s => ({ ...s, children: s.children.map(c => c.id === id ? { ...c, ...updates } : c) }));
  }, []);

  const assignWork = useCallback(async (childId: string, assignment: Omit<Assignment, "id" | "assignedAt" | "status">) => {
    const result = await pupilsApi.createAssignment(childId, {
      title: assignment.title,
      type: assignment.type,
      content: assignment.content,
      sections: assignment.sections,
      metadata: assignment.metadata,
      subtitle: assignment.subtitle,
    });
    const a: Assignment = { ...assignment, id: result.id, assignedAt: new Date().toISOString(), status: "not-started" };
    setState(s => ({ ...s, children: s.children.map(c => c.id === childId ? { ...c, assignments: [...c.assignments, a] } : c) }));
  }, []);

  const updateAssignment = useCallback(async (childId: string, assignmentId: string, updates: Partial<Assignment>) => {
    await pupilsApi.updateAssignment(childId, assignmentId, updates).catch(() => {});
    setState(s => ({ ...s, children: s.children.map(c => c.id === childId ? { ...c, assignments: c.assignments.map(a => a.id === assignmentId ? { ...a, ...updates } : a) } : c) }));
  }, []);

  const deleteAssignment = useCallback(async (childId: string, assignmentId: string) => {
    await pupilsApi.deleteAssignment(childId, assignmentId).catch(() => {});
    setState(s => ({ ...s, children: s.children.map(c => c.id === childId ? { ...c, assignments: c.assignments.filter(a => a.id !== assignmentId) } : c) }));
  }, []);

  const addSubmission = useCallback((childId: string, submission: Omit<Submission, "id" | "submittedAt">) => {
    const sub: Submission = { ...submission, id: generateId(), submittedAt: new Date().toISOString() };
    setState(s => ({ ...s, children: s.children.map(c => c.id === childId ? { ...c, submissions: [...c.submissions, sub] } : c) }));
  }, []);

  const updateSubmission = useCallback((childId: string, submissionId: string, updates: Partial<Submission>) => {
    setState(s => ({ ...s, children: s.children.map(c => c.id === childId ? { ...c, submissions: c.submissions.map(sub => sub.id === submissionId ? { ...sub, ...updates } : sub) } : c) }));
  }, []);

  const saveWorksheet = useCallback(async (worksheet: Omit<Worksheet, "id" | "createdAt">) => {
    const result = await dataApi.worksheets.create(worksheet);
    const w: Worksheet = { ...worksheet, id: result.id, createdAt: new Date().toISOString() };
    setState(s => ({ ...s, worksheetHistory: [w, ...s.worksheetHistory] }));
    return w;
  }, []);

  const updateWorksheet = useCallback(async (id: string, updates: Partial<Worksheet>) => {
    await dataApi.worksheets.update(id, updates);
    setState(s => ({ ...s, worksheetHistory: s.worksheetHistory.map(w => w.id === id ? { ...w, ...updates } : w) }));
  }, []);

  const deleteWorksheet = useCallback(async (id: string) => {
    await dataApi.worksheets.delete(id);
    setState(s => ({ ...s, worksheetHistory: s.worksheetHistory.filter(w => w.id !== id) }));
  }, []);

  const saveStory = useCallback(async (story: Omit<Story, "id" | "createdAt">) => {
    const result = await dataApi.stories.create(story);
    const st: Story = { ...story, id: result.id, createdAt: new Date().toISOString() };
    setState(s => ({ ...s, storyHistory: [st, ...s.storyHistory] }));
    return st;
  }, []);

  const saveDifferentiation = useCallback(async (diff: Omit<Differentiation, "id" | "createdAt">) => {
    const result = await dataApi.differentiations.create(diff);
    const d: Differentiation = { ...diff, id: result.id, createdAt: new Date().toISOString() };
    setState(s => ({ ...s, differentiationHistory: [d, ...s.differentiationHistory] }));
    return d;
  }, []);

  const saveAttendance = useCallback(async (record: Omit<AttendanceRecord, "id" | "recordedAt">) => {
    await pupilsApi.recordAttendance(record.childId, { date: record.date, amStatus: record.amStatus, amReason: record.amReason, pmStatus: record.pmStatus, pmReason: record.pmReason, notes: record.notes });
    const r: AttendanceRecord = { ...record, id: generateId(), recordedAt: new Date().toISOString() };
    setState(s => { const filtered = s.attendanceRecords.filter(x => !(x.childId === record.childId && x.date === record.date)); return { ...s, attendanceRecords: [r, ...filtered] }; });
    return r;
  }, []);

  const updateAttendance = useCallback((id: string, updates: Partial<AttendanceRecord>) => {
    setState(s => ({ ...s, attendanceRecords: s.attendanceRecords.map(r => r.id === id ? { ...r, ...updates } : r) }));
  }, []);

  const getAttendanceForChild = useCallback((childId: string) => state.attendanceRecords.filter(r => r.childId === childId), [state.attendanceRecords]);
  const getAttendanceForDate = useCallback((date: string) => state.attendanceRecords.filter(r => r.date === date), [state.attendanceRecords]);

  const addIdea = useCallback(async (idea: Omit<Idea, "id" | "createdAt" | "votes">) => {
    const result = await dataApi.ideas.create({ title: idea.title, description: idea.description });
    const i: Idea = { ...idea, id: result.id, votes: 0, createdAt: new Date().toISOString() };
    setState(s => ({ ...s, ideas: [...s.ideas, i] }));
  }, []);

  const voteIdea = useCallback(async (id: string) => {
    await dataApi.ideas.vote(id);
    setState(s => ({ ...s, ideas: s.ideas.map(i => i.id === id ? { ...i, votes: i.votes + 1 } : i) }));
  }, []);

  const setColorOverlay = useCallback((overlay: string) => { setState(s => ({ ...s, colorOverlay: overlay })); }, []);

  const saveParentNewsletter = useCallback((newsletter: Omit<ParentNewsletter, "id" | "createdAt">) => {
    const n: ParentNewsletter = { ...newsletter, id: generateId(), createdAt: new Date().toISOString() };
    setState(s => ({ ...s, parentNewsletters: [n, ...s.parentNewsletters] }));
    // Persist to localStorage for cross-session access
    try {
      const existing = JSON.parse(localStorage.getItem("adaptly_newsletters") || "[]");
      localStorage.setItem("adaptly_newsletters", JSON.stringify([n, ...existing].slice(0, 50)));
    } catch {}
  }, []);

  const deleteParentNewsletter = useCallback((id: string) => {
    setState(s => ({ ...s, parentNewsletters: s.parentNewsletters.filter(n => n.id !== id) }));
    try {
      const existing = JSON.parse(localStorage.getItem("adaptly_newsletters") || "[]");
      localStorage.setItem("adaptly_newsletters", JSON.stringify(existing.filter((n: any) => n.id !== id)));
    } catch {}
  }, []);

  return (
    <AppContext.Provider value={{ ...state, login, loginWithGoogle, logout, registerTeacher, verifyMfa, addChild, removeChild, updateChild, assignWork, updateAssignment, deleteAssignment, addSubmission, updateSubmission, saveWorksheet, updateWorksheet, deleteWorksheet, saveStory, saveDifferentiation, saveAttendance, updateAttendance, getAttendanceForChild, getAttendanceForDate, addIdea, voteIdea, saveParentNewsletter, deleteParentNewsletter, setColorOverlay, refreshData }}>
      {childrenProp}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

function mapStory(s: any): Story {
  return { ...s, characters: Array.isArray(s.characters) ? s.characters : JSON.parse(s.characters || "[]"), comprehensionQuestions: Array.isArray(s.comprehension_questions) ? s.comprehension_questions : JSON.parse(s.comprehension_questions || "[]") };
}
function mapDiff(d: any): Differentiation {
  return { id: d.id, taskContent: d.task_content, differentiatedContent: d.differentiated_content, sendNeed: d.send_need, yearGroup: d.year_group, subject: d.subject, createdAt: d.created_at };
}
function mapIdea(i: any): Idea {
  return { id: i.id, title: i.title, description: i.description, votes: i.votes, createdAt: i.created_at, author: i.author_name || "Unknown" };
}
function mapAssignment(a: any): Assignment {
  let sections: Assignment['sections'] | undefined;
  if (a.sections) {
    try { sections = typeof a.sections === 'string' ? JSON.parse(a.sections) : a.sections; } catch { sections = undefined; }
  }
  let metadata: Assignment['metadata'] | undefined;
  if (a.metadata) {
    try { metadata = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata; } catch { metadata = undefined; }
  }
  return { id: a.id, title: a.title, subtitle: a.subtitle || undefined, type: a.type, content: a.content || "", assignedAt: a.assigned_at, status: a.status || "not-started", feedback: a.feedback, mark: a.mark, progress: a.progress, teacherComment: a.teacher_comment, sections, metadata };
}
function mapAttendanceRecord(r: any): AttendanceRecord {
  return { id: r.id, childId: r.pupil_id, date: r.date, amStatus: r.am_status, amReason: r.am_reason, pmStatus: r.pm_status, pmReason: r.pm_reason, notes: r.notes, recordedAt: r.recorded_at, recordedBy: r.recorded_by || "", misSource: r.mis_source || undefined };
}
function mapPupil(p: any): Child {
  const assignments = Array.isArray(p.assignments) ? p.assignments.map(mapAssignment) : [];
  const submissions = Array.isArray(p.submissions) ? p.submissions : [];
  // Parse comma-separated sendNeed into sendNeeds array
  const rawSendNeed = p.send_need || "";
  const sendNeedsArr = rawSendNeed ? rawSendNeed.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
  const primarySendNeed = sendNeedsArr[0] || "";
  return { id: p.id, name: p.name, yearGroup: p.year_group || "", sendNeed: primarySendNeed, sendNeeds: sendNeedsArr, code: p.code || "", upn: p.upn, dob: p.dob, createdAt: p.created_at, parentEmail: p.parent_email || undefined, parentName: p.parent_name || undefined, assignments, submissions };
}
