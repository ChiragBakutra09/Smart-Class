import api from "./api";

export const listAnnouncements = (subjectId) =>
  api.get("/announcements", { params: { subjectId } }).then((r) => r.data.announcements);

export const createAnnouncement = (subjectId, message) =>
  api.post("/announcements", { subjectId, message }).then((r) => r.data.announcement);

export const editAnnouncement = (id, message) =>
  api.put(`/announcements/${id}`, { message }).then((r) => r.data.announcement);

export const deleteAnnouncement = (id) => api.delete(`/announcements/${id}`).then((r) => r.data);

export const markAsRead = (id) => api.post(`/announcements/${id}/read`).then((r) => r.data);
