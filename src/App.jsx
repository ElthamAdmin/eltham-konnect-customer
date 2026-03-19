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

function CustomerPortalLayout() {
  const location = useLocation();
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved
      ? JSON.parse(saved)
      : null;
  });

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

  if (!customer) {
    return <Navigate to="/login" replace />;
  }

  const navItemStyle = (active) => ({
    color: "white",
    textDecoration: "none",
    padding: "14px 20px",
    display: "block",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    fontWeight: "bold",
    opacity: active ? 1 : 0.92,
    backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
  });

  const initials = useMemo(() => {
    const parts = (customer.name || "").split(" ").filter(Boolean);
    if (parts.length === 0) return "EK";
    return ((parts[0][0] || "E") + (parts[1]?.[0] || parts[0]?.[1] || "K")).toUpperCase();
  }, [customer.name]);

  const hasAcceptedPolicies = customer.termsAccepted && customer.privacyAccepted;

  if (!hasAcceptedPolicies && location.pathname !== "/policy-acceptance") {
    return <Navigate to="/policy-acceptance" replace />;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#eef2f7",
      }}
    >
      <div
        style={{
          width: "250px",
          backgroundColor: "#253a95",
          color: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "22px 20px",
            fontSize: "22px",
            fontWeight: "bold",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          Eltham Konnect
        </div>

        <Link to="/" style={navItemStyle(location.pathname === "/")}>Dashboard</Link>
        <Link to="/my-packages" style={navItemStyle(location.pathname === "/my-packages")}>My Packages</Link>
        <Link to="/pre-alerts" style={navItemStyle(location.pathname === "/pre-alerts")}>Pre-Alerts</Link>
        <Link to="/my-invoices" style={navItemStyle(location.pathname === "/my-invoices")}>My Invoices</Link>
        <Link to="/my-rewards" style={navItemStyle(location.pathname === "/my-rewards")}>My Rewards</Link>
        <Link to="/support" style={navItemStyle(location.pathname === "/support")}>Support Tickets</Link>
        <Link to="/upload-invoice" style={navItemStyle(location.pathname === "/upload-invoice")}>Upload Invoice</Link>
        <Link to="/profile-settings" style={navItemStyle(location.pathname === "/profile-settings")}>Profile Settings</Link>
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            minHeight: "76px",
            backgroundColor: "white",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 24px",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "22px", color: "#64748b" }}>☰</div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                backgroundColor: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
                fontWeight: "bold",
              }}
            >
              {initials}
            </div>

            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ color: "#334155", fontWeight: "bold" }}>{customer.name}</span>
              <span style={{ color: "#64748b", fontSize: "12px" }}>{customer.ekonId}</span>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("ek_customer_token");
                localStorage.removeItem("ek_customer_data");
                setCustomer(null);
              }}
              style={{
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
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
            margin: "20px 26px 0 26px",
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            color: "#92400e",
            padding: "14px 16px",
            borderRadius: "10px",
            fontWeight: "bold",
          }}
        >
          Upload your package invoice as soon as your item reaches our warehouse to help prevent customs clearance delays.
        </div>

        <div style={{ padding: "26px" }}>
          <Routes>
            <Route path="/" element={<CustomerDashboard customer={customer} />} />
            <Route path="/my-packages" element={<MyPackages />} />
            <Route path="/pre-alerts" element={<PreAlerts />} />
            <Route path="/my-invoices" element={<MyInvoices />} />
            <Route path="/my-rewards" element={<MyRewards />} />
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