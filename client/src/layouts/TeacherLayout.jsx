import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../services/authService";
import { HomeIcon, BookIcon, BellIcon, TrophyIcon, ClipboardIcon, UsersIcon } from "../components/Icons";

export default function TeacherLayout() {
  const { profile } = useAuth();
  const initials = profile?.name ? profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("") : "T";

  const nav = [
    { to: "/teacher", icon: <HomeIcon />, label: "Dashboard", end: true },
    { to: "/teacher/classes", icon: <UsersIcon />, label: "My Classes" },
    { to: "/teacher/subjects", icon: <BookIcon />, label: "Subjects" },
    { to: "/teacher/assignments", icon: <ClipboardIcon />, label: "Assignments" },
    { to: "/teacher/announcements", icon: <BellIcon />, label: "Announcements" },
    { to: "/teacher/leaderboard", icon: <TrophyIcon />, label: "Leaderboard" },
  ];

  return (
    <div className="app-shell">
      <div className="sidebar teacher">
        <div className="brand teacher">
          <div className="mark">SC</div>
          <div className="name">Smart-Class<span className="sub">Teacher</span></div>
        </div>
        <nav>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => "navlink" + (isActive ? " active" : "")}>
              {n.icon}{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-profile">
            <div className="mini-avatar teacher">{initials}</div>
            <div><div className="n">{profile?.name || "Teacher"}</div><div className="r">{profile?.email}</div></div>
          </div>
          <button className="logout-link" onClick={logOut}>Log out</button>
        </div>
      </div>
      <div className="main-wrap">
        <Outlet />
      </div>
    </div>
  );
}
