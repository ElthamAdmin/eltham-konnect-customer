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

function CustomerPortalLayout() {
  const location = useLocation();
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ROYAL_BLUE = "#0B3D91";
  const SIDEBAR_BLUE = "#1f3a93";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BG = "#f4f7fb";
  const TEXT = "#0f172a";
  const MUTED = "#64748b";
  const BORDER = "#dbe3ef";

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

  if (!customer) {
    return <Navigate to="/login" replace />;
  }

  const navItemStyle = (active) => ({
    color: WHITE,
    textDecoration: "none",
    padding: "14px 18px",
    display: "block",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    fontWeight: active ? "700" : "600",
    opacity: active ? 1 : 0.94,
    background: active
      ? "linear-gradient(90deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))"
      : "transparent",
    borderLeft: active ? `4px solid ${GOLD}` : "4px solid transparent",
    transition: "all 0.2s ease",
  });

  const initials = useMemo(() => {
    const parts = (customer.name || "").split(" ").filter(Boolean);
    if (parts.length === 0) return "EK";
    return (
      ((parts[0][0] || "E") + (parts[1]?.[0] || parts[0]?.[1] || "K")).toUpperCase()
    );
  }, [customer.name]);

  const hasAcceptedPolicies = customer.termsAccepted && customer.privacyAccepted;

  if (!hasAcceptedPolicies && location.pathname !== "/policy-acceptance") {
    return <Navigate to="/policy-acceptance" replace />;
  }

  const sidebarContent = (
    <>
      <div
        style={{
          padding: "22px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))",
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "0.3px" }}>
          Eltham Konnect
        </div>
        <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
          Customer Portal
        </div>
      </div>

      <Link to="/" style={navItemStyle(location.pathname === "/")}>
        Dashboard
      </Link>
      <Link to="/my-packages" style={navItemStyle(location.pathname === "/my-packages")}>
        My Packages
      </Link>
      <Link to="/pre-alerts" style={navItemStyle(location.pathname === "/pre-alerts")}>
        Pre-Alerts
      </Link>
      <Link to="/my-invoices" style={navItemStyle(location.pathname === "/my-invoices")}>
        My Invoices
      </Link>
      <Link
  to="/rates-calculator"
  style={navItemStyle(location.pathname === "/rates-calculator")}
>
  Rates Calculator
</Link>
      <Link to="/my-rewards" style={navItemStyle(location.pathname === "/my-rewards")}>
  My Rewards
</Link>
<Link to="/my-rewards" style={navItemStyle(location.pathname === "/my-rewards")}>
  My Referral Code
</Link>
      <Link
  to="/amazon-associate-links"
  style={navItemStyle(location.pathname === "/amazon-associate-links")}
>
  Amazon Associate Links
</Link>
      <Link to="/support" style={navItemStyle(location.pathname === "/support")}>
        Support Tickets
      </Link>
      <Link to="/upload-invoice" style={navItemStyle(location.pathname === "/upload-invoice")}>
        Upload Invoice
      </Link>
      <Link to="/profile-settings" style={navItemStyle(location.pathname === "/profile-settings")}>
        Profile Settings
      </Link>
    </>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        backgroundColor: BG,
      }}
    >
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.48)",
            zIndex: 40,
          }}
        />
      )}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div
          style={{
            width: "260px",
            background: `linear-gradient(180deg, ${SIDEBAR_BLUE}, ${ROYAL_BLUE})`,
            color: WHITE,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            boxShadow: "8px 0 24px rgba(15,23,42,0.08)",
          }}
          className="desktop-sidebar"
        >
          {sidebarContent}
        </div>

        <div
          style={{
            position: "fixed",
            top: 0,
            left: mobileMenuOpen ? 0 : "-290px",
            width: "260px",
            height: "100vh",
            background: `linear-gradient(180deg, ${SIDEBAR_BLUE}, ${ROYAL_BLUE})`,
            color: WHITE,
            display: "flex",
            flexDirection: "column",
            zIndex: 50,
            transition: "left 0.25s ease",
            boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
          }}
          className="mobile-sidebar"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.16)",
            }}
          >
            <div>
              <div style={{ fontSize: "18px", fontWeight: "800" }}>Eltham Konnect</div>
              <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "3px" }}>
                Customer Portal
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                backgroundColor: "transparent",
                color: WHITE,
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "8px",
                padding: "6px 10px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          </div>
          {sidebarContent}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              minHeight: "82px",
              backgroundColor: WHITE,
              borderBottom: `1px solid ${BORDER}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              gap: "14px",
              flexWrap: "wrap",
              boxShadow: "0 2px 10px rgba(15,23,42,0.03)",
            }}
          >
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                fontSize: "24px",
                color: MUTED,
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 8px",
              }}
            >
              ☰
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                marginLeft: "auto",
              }}
            >
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  background: "linear-gradient(180deg, #f8fafc, #e2e8f0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#475569",
                  fontWeight: "bold",
                  flexShrink: 0,
                  border: "1px solid #e2e8f0",
                }}
              >
                {initials}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1.2,
                  minWidth: 0,
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    color: TEXT,
                    fontWeight: "800",
                    wordBreak: "break-word",
                    fontSize: "15px",
                  }}
                >
                  {customer.name}
                </span>

                <span style={{ color: MUTED, fontSize: "12px" }}>
                  {customer.ekonId}
                </span>

                <span
                  style={{
                    color: GOLD,
                    fontSize: "12px",
                    fontWeight: "700",
                    marginTop: "2px",
                  }}
                >
                  EK Points: {Number(customer.pointsBalance || 0).toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem("ek_customer_token");
                  localStorage.removeItem("ek_customer_data");
                  setCustomer(null);
                }}
                style={{
                  backgroundColor: "#dc2626",
                  color: WHITE,
                  border: "none",
                  padding: "9px 13px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Logout
              </button>
            </div>
          </div>

          <div
            style={{
              margin: "16px 16px 0 16px",
              background: "linear-gradient(180deg, #fff7db, #fef3c7)",
              border: "1px solid #f2c94c",
              color: "#8a5a00",
              padding: "14px 16px",
              borderRadius: "14px",
              fontWeight: "700",
              lineHeight: 1.5,
              boxShadow: "0 4px 14px rgba(212,175,55,0.08)",
            }}
          >
            Upload your package invoice as soon as your item reaches our warehouse to help prevent customs clearance delays.
          </div>

          <div style={{ padding: "18px 16px 24px 16px" }}>
            <Routes>
              <Route path="/" element={<CustomerDashboard customer={customer} />} />
              <Route path="/my-packages" element={<MyPackages />} />
              <Route path="/pre-alerts" element={<PreAlerts />} />
              <Route path="/my-invoices" element={<MyInvoices />} />
              <Route path="/rates-calculator" element={<RatesCalculator />} />
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
          </div>
        </div>
      </div>

      <style>
        {`
          .mobile-sidebar {
            display: none;
          }

          @media (max-width: 900px) {
            .desktop-sidebar {
              display: none !important;
            }

            .mobile-sidebar {
              display: flex !important;
            }
          }

          @media (min-width: 901px) {
            .mobile-sidebar {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
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