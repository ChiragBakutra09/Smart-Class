import api from "./api";

export const getMyXP = () => api.get("/xp/me").then((r) => r.data);

export const recordDailyLogin = () => api.post("/xp/login-streak").then((r) => r.data);

export const getLeaderboard = (classroomId) =>
  api.get("/xp/leaderboard", { params: { classroomId } }).then((r) => r.data.leaderboard);
