import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Calculator,
  ClipboardList,
  FileText,
  Gift,
  Headphones,
  Home,
  LayoutDashboard,
  MoreHorizontal,
  PackageSearch,
  ReceiptText,
  ShoppingBag,
  Trophy,
  UploadCloud,
  UserRound,
  Menu,
ShoppingCart,
Sparkles,
X,
} from "lucide-react";
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
import MarketplaceCart from "./pages/MarketplaceCart";
import MyMarketplaceInvoices from "./pages/MyMarketplaceInvoices";
import MyMarketplaceOrders from "./pages/MyMarketplaceOrders";

function CustomerPortalLayout() {
  const location = useLocation();
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ROYAL_BLUE = "#0B3D91";
  const ORANGE = "#F15A24";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const BG = "#f4f7fb";
  const MUTED = "#64748b";
  const BORDER = "#dbe3ef";

  const [isMobile, setIsMobile] = useState(
  () => window.innerWidth <= 768
);

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

  useEffect(() => {
  const handleScreenResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  window.addEventListener("resize", handleScreenResize);

  return () => {
    window.removeEventListener("resize", handleScreenResize);
  };
}, []);

  const initials = useMemo(() => {
  const parts = (customer?.name || "").split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "EK";
  }

  return (
    (parts[0]?.[0] || "E") +
    (parts[1]?.[0] || parts[0]?.[1] || "K")
  ).toUpperCase();
}, [customer?.name]);

if (!customer) {
  return <Navigate to="/login" replace />;
}

const hasAcceptedPolicies =
  customer.termsAccepted && customer.privacyAccepted;

  if (!hasAcceptedPolicies && location.pathname !== "/policy-acceptance") {
    return <Navigate to="/policy-acceptance" replace />;
  }

  const navItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Packages",
    path: "/my-packages",
    icon: PackageSearch,
  },
  {
    label: "Pre-Alerts",
    path: "/pre-alerts",
    icon: BellRing,
  },
  {
    label: "Invoices",
    path: "/my-invoices",
    icon: ReceiptText,
  },
  {
    label: "Calculator",
    path: "/rates-calculator",
    icon: Calculator,
  },
  {
    label: "Rewards Hub",
    path: "/rewards-hub",
    icon: Gift,
  },
  {
    label: "My Rewards",
    path: "/my-rewards",
    icon: Trophy,
  },
  {
    label: "Marketplace",
    path: "/amazon-associate-links",
    icon: ShoppingBag,
  },
  {
    label: "My Market Orders",
    path: "/my-marketplace-orders",
    icon: ClipboardList,
  },
  {
    label: "Market Invoices",
    path: "/my-marketplace-invoices",
    icon: FileText,
  },
  {
    label: "Support",
    path: "/support",
    icon: Headphones,
  },
  {
    label: "Upload Invoice",
    path: "/upload-invoice",
    icon: UploadCloud,
  },
  {
    label: "Profile",
    path: "/profile-settings",
    icon: UserRound,
  },
];

const bottomItems = [
  {
    label: "Home",
    path: "/",
    icon: Home,
  },
  {
    label: "Packages",
    path: "/my-packages",
    icon: PackageSearch,
  },
  {
    label: "Invoices",
    path: "/my-invoices",
    icon: ReceiptText,
  },
  {
    label: "Rewards",
    path: "/my-rewards",
    icon: Trophy,
  },
  {
    label: "More",
    path: "__more",
    icon: MoreHorizontal,
  },
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
  display: "flex",
  alignItems: "center",
  gap: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    fontWeight: "bold",
    backgroundColor: active ? "rgba(255,255,255,0.14)" : "transparent",
    borderLeft: active
  ? `4px solid ${ORANGE}`
  : "4px solid transparent",
  });

  const renderRoutes = () => (
    <Routes>
      <Route path="/" element={<CustomerDashboard customer={customer} />} />
      <Route path="/my-packages" element={<MyPackages />} />
      <Route
  path="/pre-alerts"
  element={<PreAlerts customer={customer} />}
/>
      <Route path="/my-invoices" element={<MyInvoices />} />
      <Route path="/rates-calculator" element={<RatesCalculator />} />
      <Route path="/rewards-hub" element={<RewardsHub />} />
      <Route path="/my-rewards" element={<MyRewards />} />
      <Route path="/amazon-associate-links" element={<AmazonAssociateLinks />} />
      <Route path="/marketplace-cart" element={<MarketplaceCart />} />
      <Route path="/my-marketplace-orders" element={<MyMarketplaceOrders />} />
      <Route path="/my-marketplace-invoices" element={<MyMarketplaceInvoices />} />
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <button
  type="button"
  onClick={() => setMobileMenuOpen(true)}
  aria-label="Open navigation menu"
  style={{
    width: "44px",
    height: "44px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "10px",
    color: WHITE,
    cursor: "pointer",
    flexShrink: 0,
  }}
>
  <Menu size={24} strokeWidth={2.2} aria-hidden="true" />
</button>

          <div style={{ flex: 1, minWidth: 0 }}>
  <img
    src="/ek-logo.png"
    alt="Eltham Konnect"
    style={{
      display: "block",
      width: "145px",
      maxWidth: "100%",
      height: "44px",
      objectFit: "contain",
      objectPosition: "left center",
      backgroundColor: WHITE,
      borderRadius: "9px",
      padding: "4px 7px",
    }}
  />
</div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ color: GOLD, fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
              <span
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  }}
>
  <Sparkles size={15} aria-hidden="true" />
  {Number(customer.pointsBalance || 0).toLocaleString()}
</span>
            </div>

            <Link
              to="/marketplace-cart"
              style={{
                backgroundColor: "#082f78",
                color: WHITE,
                textDecoration: "none",
                padding: "8px 10px",
                borderRadius: "999px",
                fontWeight: "bold",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              <ShoppingCart size={20} strokeWidth={2.2} aria-hidden="true" />
            </Link>

            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                backgroundColor: WHITE,
                color: ROYAL_BLUE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {initials}
            </div>
          </div>
        </div>
      </div>

      <div style={{ margin: "14px", backgroundColor: WHITE, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "14px", color: MUTED, lineHeight: 1.5 }}>
        Upload your package invoice as soon as your item reaches our warehouse to prevent customs delays.
      </div>

      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.55)", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "82%", maxWidth: "330px", height: "100%", backgroundColor: ROYAL_BLUE, overflowY: "auto" }}>
            <div
  style={{
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.16)",
  }}
>
  <img
    src="/ek-logo.png"
    alt="Eltham Konnect"
    style={{
      width: "190px",
      maxWidth: "calc(100% - 54px)",
      height: "58px",
      objectFit: "contain",
      backgroundColor: WHITE,
      borderRadius: "10px",
      padding: "5px 8px",
    }}
  />

  <button
    type="button"
    onClick={() => setMobileMenuOpen(false)}
    aria-label="Close navigation menu"
    style={{
      width: "42px",
      height: "42px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid rgba(255,255,255,0.25)",
      borderRadius: "10px",
      color: WHITE,
      background: "transparent",
      cursor: "pointer",
      flexShrink: 0,
    }}
  >
    <X size={22} aria-hidden="true" />
  </button>
</div>
            {navItems.map((item) => {
  const Icon = item.icon;

  return (
    <Link
      key={item.path}
      to={item.path}
      style={navItemStyle(location.pathname === item.path)}
    >
      <Icon size={20} strokeWidth={2} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
})}
            <button onClick={logout} style={{ margin: "18px", width: "calc(100% - 36px)", backgroundColor: "#dc2626", color: WHITE, border: "none", padding: "12px", borderRadius: "10px", fontWeight: "bold" }}>
              Logout
            </button>
          </div>
        </div>
      )}

      <main style={{ padding: "14px", overflowX: "hidden" }}>{renderRoutes()}</main>

      <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, height: "70px", backgroundColor: WHITE, borderTop: `1px solid ${BORDER}`, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", zIndex: 30 }}>
        {bottomItems.map((item) => {
  const Icon = item.icon;

  if (item.path === "__more") {
    return (
      <button
        key={item.label}
        onClick={() => setMobileMenuOpen(true)}
        style={bottomNavStyle(false, ROYAL_BLUE, MUTED)}
        aria-label="Open full navigation"
      >
        <Icon size={21} strokeWidth={2} aria-hidden="true" />
        <span>{item.label}</span>
      </button>
    );
  }

  return (
    <Link
      key={item.path}
      to={item.path}
      style={bottomNavStyle(
        location.pathname === item.path,
        ROYAL_BLUE,
        MUTED
      )}
    >
      <Icon size={21} strokeWidth={2} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
})}
      </nav>
    </div>
  );
}

return (
  <div style={{ display: "flex", minHeight: "100vh", backgroundColor: BG, fontFamily: "Arial, sans-serif" }}>
    <aside style={{ width: "260px", backgroundColor: ROYAL_BLUE, color: WHITE }}>
      <div
  style={{
    padding: "18px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.16)",
  }}
>
  <img
    src="/ek-logo.png"
    alt="Eltham Konnect"
    style={{
      display: "block",
      width: "100%",
      height: "72px",
      objectFit: "contain",
      backgroundColor: WHITE,
      borderRadius: "12px",
      padding: "7px 10px",
    }}
  />
</div>
      {navItems.map((item) => {
  const Icon = item.icon;

  return (
    <Link
      key={item.path}
      to={item.path}
      style={navItemStyle(location.pathname === item.path)}
    >
      <Icon size={20} strokeWidth={2} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
})}
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

          <Link
            to="/marketplace-cart"
            style={{
              backgroundColor: ROYAL_BLUE,
              color: WHITE,
              textDecoration: "none",
              padding: "9px 13px",
              borderRadius: "999px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ShoppingCart size={20} strokeWidth={2.2} aria-hidden="true" /> Cart
          </Link>

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
  