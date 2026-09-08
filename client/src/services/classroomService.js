import api from "./api";

export const listMyClassrooms = () => api.get("/classrooms").then((r) => r.data.classrooms);

export const createClassroom = (name) => api.post("/classrooms", { name }).then((r) => r.data.classroom);

export const deleteClassroom = (classroomId) => api.delete(`/classrooms/${classroomId}`).then((r) => r.data);

export const previewRoster = (classroomId, file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/classrooms/${classroomId}/roster/preview`, form).then((r) => r.data);
};

export const confirmRoster = (classroomId, students) =>
  api.post(`/classrooms/${classroomId}/roster/confirm`, { students }).then((r) => r.data);

export const getRoster = (classroomId) => api.get(`/classrooms/${classroomId}/roster`).then((r) => r.data);

export const resendInvite = (classroomId, inviteId) =>
  api.post(`/classrooms/${classroomId}/roster/${inviteId}/resend`).then((r) => r.data);

export const removeStudent = (classroomId, inviteId) =>
  api.delete(`/classrooms/${classroomId}/roster/${inviteId}`).then((r) => r.data);

export const getInviteByToken = (token) => api.get(`/classrooms/join/${token}`).then((r) => r.data);

// The fix for "join link only works via Register" — lets an already-logged-in
// student join with their existing account, no re-registration needed.
export const joinClassroomByToken = (token) => api.post(`/classrooms/join/${token}`).then((r) => r.data);
