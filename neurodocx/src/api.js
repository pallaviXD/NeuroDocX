const BASE = import.meta.env.VITE_API_URL || "https://neurodocx-368778620053.europe-west1.run.app"

function getToken() {
  return localStorage.getItem("neurodocx_token")
}

function authHeaders(extra = {}) {
  const token = getToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(err.detail || "Request failed")
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function register(email, username, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  })
  return handleResponse(res)
}

export async function login(email, password) {
  const form = new URLSearchParams({ username: email, password })
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  })
  return handleResponse(res)
}

export async function getMe() {
  const res = await fetch(`${BASE}/me`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${BASE}/auth/password/change`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  return handleResponse(res)
}

export async function checkPasswordStrength(password) {
  const res = await fetch(`${BASE}/auth/password/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  })
  return handleResponse(res)
}

export async function generatePassword(length = 16, includeSymbols = true) {
  const res = await fetch(`${BASE}/auth/password/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ length, include_symbols: includeSymbols, include_numbers: true, include_uppercase: true }),
  })
  return handleResponse(res)
}

// ── Documents ─────────────────────────────────────────────────────────────────
export async function uploadPDF(file) {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${BASE}/documents/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  })
  return handleResponse(res)
}

export async function listDocuments() {
  const res = await fetch(`${BASE}/documents/`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function deleteDocument(docId) {
  const res = await fetch(`${BASE}/documents/${docId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleResponse(res)
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export async function sendMessage(docIds, message, sessionId = null, explainMode = "standard") {
  const res = await fetch(`${BASE}/chat/`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ doc_ids: docIds, message, session_id: sessionId, explain_mode: explainMode }),
  })
  return handleResponse(res)
}

export async function listSessions() {
  const res = await fetch(`${BASE}/chat/sessions`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function getSessionMessages(sessionId) {
  const res = await fetch(`${BASE}/chat/sessions/${sessionId}/messages`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${BASE}/chat/sessions/${sessionId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export async function summarize(docIds, style = "detailed") {
  const res = await fetch(`${BASE}/chat/summarize`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ doc_ids: docIds, style }),
  })
  return handleResponse(res)
}

export async function generateQuiz(docIds, numQuestions = 5, difficulty = "medium", quizType = "mcq") {
  const res = await fetch(`${BASE}/chat/quiz`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ doc_ids: docIds, num_questions: numQuestions, difficulty, quiz_type: quizType }),
  })
  return handleResponse(res)
}

export async function evaluateAnswer(question, userAnswer, correctAnswer, explanation) {
  const res = await fetch(`${BASE}/chat/quiz/evaluate`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ question, user_answer: userAnswer, correct_answer: correctAnswer, explanation }),
  })
  return handleResponse(res)
}

export async function saveQuizScore(quizId, score) {
  const res = await fetch(`${BASE}/chat/quiz/${quizId}/score?score=${score}`, {
    method: "POST",
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export async function generateNotes(docIds) {
  const res = await fetch(`${BASE}/chat/notes`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ doc_ids: docIds }),
  })
  return handleResponse(res)
}

export async function compareDocuments(docIds) {
  const res = await fetch(`${BASE}/chat/compare`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ doc_ids: docIds }),
  })
  return handleResponse(res)
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getDashboardAnalytics() {
  const res = await fetch(`${BASE}/analytics/dashboard`, { headers: authHeaders() })
  return handleResponse(res)
}

// ── History ───────────────────────────────────────────────────────────────────
export async function listSummaries() {
  const res = await fetch(`${BASE}/chat/history/summaries`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function listNotes() {
  const res = await fetch(`${BASE}/chat/history/notes`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function listQuizHistory() {
  const res = await fetch(`${BASE}/chat/history/quizzes`, { headers: authHeaders() })
  return handleResponse(res)
}

// ── Exam & Study ──────────────────────────────────────────────────────────────
export async function generateExamReport(docIds, subject = "", examType = "general") {
  const res = await fetch(`${BASE}/exam/report`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ doc_ids: docIds, subject, exam_type: examType }),
  })
  return handleResponse(res)
}

export async function generateStudyPlan(docIds, examDate = "", weakTopics = []) {
  const res = await fetch(`${BASE}/exam/study-plan`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ doc_ids: docIds, exam_date: examDate, weak_topics: weakTopics }),
  })
  return handleResponse(res)
}

export async function getProgress() {
  const res = await fetch(`${BASE}/exam/progress`, { headers: authHeaders() })
  return handleResponse(res)
}
