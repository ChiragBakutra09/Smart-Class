import api from "./api";

export const listSubjects = (classroomId) =>
  api.get("/subjects", { params: { classroomId } }).then((r) => r.data.subjects);

export const createSubject = (name, classroomId) =>
  api.post("/subjects", { name, classroomId }).then((r) => r.data.subject);

export const deleteSubject = (subjectId) => api.delete(`/subjects/${subjectId}`).then((r) => r.data);

export const uploadSyllabus = (subjectId, file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/subjects/${subjectId}/syllabus`, form).then((r) => r.data.subject);
};

export const uploadMaterial = (subjectId, file, title) => {
  const form = new FormData();
  form.append("file", file);
  form.append("title", title);
  return api.post(`/subjects/${subjectId}/materials`, form).then((r) => r.data.subject);
};
