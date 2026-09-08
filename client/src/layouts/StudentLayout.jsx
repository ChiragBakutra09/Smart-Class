import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../services/authService";
import { HomeIcon, BookIcon, BellIcon, TrophyIcon, UserIcon } from "../components/Icons";

export default function StudentLayout() {
  const { profile } = useAuth();
  const initials = profile?.name ? profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("") : "S";

  const nav = [
    { to: "/student", icon: <HomeIcon />, label: "Dashboard", end: true },
    { to: "/student/subjects", icon: <BookIcon />, label: "Subjects" },
    { to: "/student/announcements", icon: <BellIcon />, label: "Announcements" },
    { to: "/student/leaderboard", icon: <TrophyIcon />, label: "Leaderboard" },
    { to: "/student/profile", icon: <UserIcon />, label: "Profile" },
  ];

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="brand">
          <div className="mark">SC</div>
          <div className="name">Smart-Class<span className="sub">Student</span></div>
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
            <div className="mini-avatar">{initials}</div>
            <div><div className="n">{profile?.name || "Student"}</div><div className="r">{profile?.email}</div></div>
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
