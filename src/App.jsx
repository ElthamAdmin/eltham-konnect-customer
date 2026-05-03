import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "./api";

import CustomerLogin from "./pages/CustomerLogin";
import CustomerSignup from "./pages/CustomerSignup";
import PolicyAcceptance from "./pages/PolicyAcceptance";
import CustomerDashboard from "./pages/CustomerDashboard";
import MyPackages from "./pages/MyPackages";
import PreAlerts from "./pages/PreAlerts";
import MyInvoices from "./pages/MyInvoices";
import MyRewards from "./pages/MyRewards";
import CustomerSupport from "./pages/CustomerSupport";
import UploadInvoice from "./pages/UploadInvoice";
import ProfileSettings from "./pages/ProfileSettings";
import AmazonAssociateLinks from "./pages/AmazonAssociateLinks";
import RatesCalculator from "./pages/RatesCalculator";
import RewardsHub from "./pages/RewardsHub";

function CustomerPortalLayout() {
  const location = useLocation();
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BG = "#f4f7fb";
  const MUTED = "#64748b";
  const BORDER = "#dbe3ef";

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const token = localStorage.getItem("ek_customer_token");
        if (!token) return;

        const res = await api.get("/api/customer-auth/me");
        setCustomer(res.data.data);
        localStorage.setItem("ek_customer_data", JSON.stringify(res.data.data));
      } catch (error) {
        console.error("Load customer session error:", error);
        localStorage.removeItem("ek_customer_token");
        localStorage.removeItem("ek_customer_data");
        setCustomer(null);
      }
    };

    loadCustomer();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!customer) return <Navigate to="/login" replace />;

  const initials = useMemo(() => {
    const parts = (customer.name || "").split(" ").filter(Boolean);
    if (parts.length === 0) return "EK";
    return ((parts[0][0] || "E") + (parts[1]?.[0] || parts[0]?.[1] || "K")).toUpperCase();
  }, [customer.name]);

  const hasAcceptedPolicies = customer.termsAccepted && customer.privacyAccepted;

  if (!hasAcceptedPolicies && location.pathname !== "/policy-acceptance") {
    return <Navigate to="/policy-acceptance" replace />;
  }

  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Packages", path: "/my-packages" },
    { label: "Pre-Alerts", path: "/pre-alerts" },
    { label: "Invoices", path: "/my-invoices" },
    { label: "Calculator", path: "/rates-calculator" },
    { label: "Rewards Hub", path: "/rewards-hub" },
    { label: "My Rewards", path: "/my-rewards" },
    { label: "Amazon Links", path: "/amazon-associate-links" },
    { label: "Support", path: "/support" },
    { label: "Upload Invoice", path: "/upload-invoice" },
    { label: "Profile", path: "/profile-settings" },
  ];

  const bottomItems = [
    { label: "Home", path: "/" },
    { label: "Packages", path: "/my-packages" },
    { label: "Invoices", path: "/my-invoices" },
    { label: "Rewards", path: "/my-rewards" },
    { label: "More", path: "__more" },
  ];

  const logout = () => {
    localStorage.removeItem("ek_customer_token");
    localStorage.removeItem("ek_customer_data");
    setCustomer(null);
  };

  const navItemStyle = (active) => ({
    color: WHITE,
    textDecoration: "none",
    padding: "14px 20px",
    display: "block",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    fontWeight: "bold",
    backgroundColor: active ? "rgba(255,255,255,0.14)" : "transparent",
  });

  const renderRoutes = () => (
    <Routes>
      <Route path="/" element={<CustomerDashboard customer={customer} />} />
      <Route path="/my-packages" element={<MyPackages />} />
      <Route path="/pre-alerts" element={<PreAlerts />} />
      <Route path="/my-invoices" element={<MyInvoices />} />
      <Route path="/rates-calculator" element={<RatesCalculator />} />
      <Route path="/rewards-hub" element={<RewardsHub />} />
      <Route path="/my-rewards" element={<MyRewards />} />
      <Route path="/amazon-associate-links" element={<AmazonAssociateLinks />} />
      <Route path="/support" element={<CustomerSupport />} />
      <Route path="/upload-invoice" element={<UploadInvoice />} />
      <Route path="/profile-settings" element={<ProfileSettings />} />
      <Route
        path="/policy-acceptance"
        element={
          <PolicyAcceptance
            customer={customer}
            onAccept={(updatedCustomer) => setCustomer(updatedCustomer)}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: BG, fontFamily: "Arial, sans-serif", paddingBottom: "78px" }}>
        <div style={{ backgroundColor: ROYAL_BLUE, color: WHITE, padding: "16px", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <button onClick={() => setMobileMenuOpen(true)} style={{ background: "transparent", border: "none", color: WHITE, fontSize: "28px" }}>
              ☰
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>Eltham Konnect</div>
              <div style={{ fontSize: "12px", opacity: 0.9 }}>{customer.name}</div>
            </div>

            <div style={{ color: GOLD, fontWeight: "bold", fontSize: "14px" }}>
              ✦ {Number(customer.pointsBalance || 0).toLocaleString()}
            </div>

            <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: WHITE, color: ROYAL_BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
              {initials}
            </div>
          </div>
        </div>

        <div style={{ margin: "14px", backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "14px", color: MUTED, lineHeight: 1.5 }}>
          Upload your package invoice as soon as your item reaches our warehouse to prevent customs delays.
        </div>

        {mobileMenuOpen && (
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.55)", zIndex: 50 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "82%", maxWidth: "330px", height: "100%", backgroundColor: ROYAL_BLUE, overflowY: "auto" }}>
              <div style={{ padding: "20px", color: WHITE, fontSize: "22px", fontWeight: "bold" }}>Eltham Konnect</div>
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} style={navItemStyle(location.pathname === item.path)}>
                  {item.label}
                </Link>
              ))}
              <button onClick={logout} style={{ margin: "18px", width: "calc(100% - 36px)", backgroundColor: "#dc2626", color: WHITE, border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold" }}>
                Logout
              </button>
            </div>
          </div>
        )}

        <main style={{ padding: "14px", overflowX: "hidden" }}>{renderRoutes()}</main>

        <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, height: "70px", backgroundColor: WHITE, borderTop: `1px solid ${BORDER}`, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", zIndex: 30 }}>
          {bottomItems.map((item) =>
            item.path === "__more" ? (
              <button key={item.label} onClick={() => setMobileMenuOpen(true)} style={bottomNavStyle(false, ROYAL_BLUE, MUTED)}>
                ⋯<span>{item.label}</span>
              </button>
            ) : (
              <Link key={item.path} to={item.path} style={bottomNavStyle(location.pathname === item.path, ROYAL_BLUE, MUTED)}>
                ●<span>{item.label}</span>
              </Link>
            )
          )}
        </nav>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: BG, fontFamily: "Arial, sans-serif" }}>
      <aside style={{ width: "260px", backgroundColor: ROYAL_BLUE, color: WHITE }}>
        <div style={{ padding: "22px 20px", fontSize: "20px", fontWeight: "bold" }}>Eltham Konnect</div>
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} style={navItemStyle(location.pathname === item.path)}>
            {item.label}
          </Link>
        ))}
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ minHeight: "82px", backgroundColor: WHITE, borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px" }}>
          <div>
            <strong>{customer.name}</strong>
            <div style={{ color: MUTED, fontSize: "12px" }}>{customer.ekonId}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ color: GOLD, fontWeight: "bold" }}>
              EK Points: {Number(customer.pointsBalance || 0).toLocaleString()}
            </span>
            <button onClick={logout} style={{ backgroundColor: "#dc2626", color: WHITE, border: "none", padding: "9px 13px", borderRadius: "8px", fontWeight: "bold" }}>
              Logout
            </button>
          </div>
        </header>

        <main style={{ padding: "18px 16px 24px" }}>{renderRoutes()}</main>
      </div>
    </div>
  );
}

function bottomNavStyle(active, activeColor, mutedColor) {
  return {
    border: "none",
    backgroundColor: "white",
    color: active ? activeColor : mutedColor,
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
  };
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/signup" element={<CustomerSignup />} />
      <Route path="/*" element={<CustomerPortalLayout />} />
    </Routes>
  );
}