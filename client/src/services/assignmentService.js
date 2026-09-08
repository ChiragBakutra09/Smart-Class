import api from "./api";

export const listAssignments = (subjectId) =>
  api.get("/assignments", { params: { subjectId } }).then((r) => r.data.assignments);

export const createAssignment = (payload, file) => {
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => form.append(k, v));
  if (file) form.append("file", file);
  return api.post("/assignments", form).then((r) => r.data.assignment);
};

export const submitAssignment = (assignmentId, file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/assignments/${assignmentId}/submit`, form).then((r) => r.data);
};

export const listSubmissions = (assignmentId) =>
  api.get(`/assignments/${assignmentId}/submissions`).then((r) => r.data.submissions);

export const gradeSubmission = (submissionId, marks, feedback) =>
  api.post(`/assignments/submissions/${submissionId}/grade`, { marks, feedback }).then((r) => r.data);
