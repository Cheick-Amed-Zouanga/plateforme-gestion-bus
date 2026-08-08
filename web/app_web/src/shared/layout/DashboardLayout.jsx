import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { logoutUser } from "../../features/accounts/services/authservice";
import "../styles/dashboard.css";

function DashboardLayout({
  brand = "TERRASSO",
  brandSub = "Console ops",
  navGroups = [],
  titleMap = {},
  userLabel = "Admin",
  userRole = "ADMIN_PLATEFORME",
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const pageTitle = useMemo(() => {
    const exact = titleMap[location.pathname];
    if (exact) return exact;
    const match = Object.keys(titleMap)
      .filter((k) => location.pathname.startsWith(k) && k !== "/")
      .sort((a, b) => b.length - a.length)[0];
    return titleMap[match] || brand;
  }, [location.pathname, titleMap, brand]);

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    } finally {
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
  }

  const initials = (userLabel || "AD")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="dash-shell">
      {open ? <div className="dash-overlay" onClick={() => setOpen(false)} /> : null}

      <aside className={`dash-sidebar ${open ? "open" : ""}`}>
        <div className="dash-brand">
          <div className="dash-brand-mark">T</div>
          <div>
            <div className="dash-brand-text">{brand}</div>
            <div className="dash-brand-sub">{brandSub}</div>
          </div>
        </div>

        <nav className="dash-nav">
          {navGroups.map((group) => (
            <div className="dash-nav-group" key={group.label}>
              <div className="dash-nav-label">{group.label}</div>
              {group.items.map((item) =>
                item.to ? (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => {
                      const active = item.match
                        ? item.match(location.pathname)
                        : isActive;
                      return `dash-nav-link${active ? " active" : ""}`;
                    }}
                  >
                    <span className="dash-nav-ico">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    className="dash-nav-link"
                    disabled
                    title="Bientôt disponible"
                  >
                    <span className="dash-nav-ico">{item.icon}</span>
                    {item.label}
                    <span className="dash-badge soon" style={{ marginLeft: "auto" }}>
                      Soon
                    </span>
                  </button>
                ),
              )}
            </div>
          ))}
        </nav>

        <div className="dash-sidebar-foot">Plateforme gestion bus · BF</div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button
              type="button"
              className="dash-menu-btn"
              onClick={() => setOpen((v) => !v)}
              aria-label="Ouvrir le menu"
            >
              ☰
            </button>
            <h1 className="dash-topbar-title">{pageTitle}</h1>
          </div>

          <div className="dash-topbar-right">
            <div className="dash-user-chip">
              <div className="dash-avatar">{initials}</div>
              <div className="dash-user-meta">
                <strong>{userLabel}</strong>
                <span>{userRole}</span>
              </div>
            </div>
            <button type="button" className="dash-logout" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </header>

        <div className="dash-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
