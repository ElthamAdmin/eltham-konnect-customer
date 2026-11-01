import { useEffect, useMemo, useState } from "react";
import api from "../api";
import CustomerPortalBanner from "../components/CustomerPortalBanner";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  Gift,
  Wallet,
  UploadCloud,
  FileText,
  Calculator,
  Headphones,
} from "lucide-react";
import CustomerHolidayCalendar from "../components/CustomerHolidayCalendar";

function CustomerDashboard({ customer }) {
const [packages, setPackages] = useState([]);
const [invoices, setInvoices] = useState([]);
const [notifications, setNotifications] = useState([]);
const [communications, setCommunications] = useState([]);
const [supportTickets, setSupportTickets] = useState([]);
const [loading, setLoading] = useState(true);
const [showNotificationPopup, setShowNotificationPopup] = useState(false);

const [alertsPage, setAlertsPage] = useState(1);
const [expandedAlerts, setExpandedAlerts] = useState({});

const ROYAL_BLUE = "#0B3D91";
const ORANGE = "#F15A24";
const WHITE = "#ffffff";
const LIGHT_BG = "#f4f7fb";
const BORDER = "#dbe3ef";
const MUTED = "#64748b";
const TEXT = "#0f172a";

const alertsPerPage = 5;

const fetchDashboardData = async () => {
try {
setLoading(true);

const results = await Promise.allSettled([  
    api.get("/api/packages/my"),
api.get("/api/invoices/my"),
api.get("/api/customer-notifications/mine"),
api.get("/api/support-tickets/my"),
api.get("/api/communication/my"),
  ]);  

  const packagesRes =  
    results[0].status === "fulfilled" ? results[0].value : null;  
  const invoicesRes =  
    results[1].status === "fulfilled" ? results[1].value : null;  
  const notificationsRes =  
    results[2].status === "fulfilled" ? results[2].value : null;  
  const ticketsRes =  
    results[3].status === "fulfilled" ? results[3].value : null;  
  const communicationsRes =  
    results[4].status === "fulfilled" ? results[4].value : null;  

  if (results[2].status === "rejected") {  
    console.error(  
      "Customer notifications request failed:",  
      results[2].reason  
    );  
  }  

  if (results[4].status === "rejected") {  
    console.error("Customer communication request failed:", results[4].reason);  
  }  

  const allPackages = packagesRes?.data?.data || [];  
  const allInvoices = invoicesRes?.data?.data || [];  
  const customerNotifications = notificationsRes?.data?.data || [];  
  const customerTickets = ticketsRes?.data?.data || [];  
  const customerCommunications = communicationsRes?.data?.data || [];  

  const customerPackages = allPackages.filter(  
    (pkg) => pkg.customerEkonId === customer.ekonId  
  );  

  const customerInvoices = allInvoices.filter(  
    (inv) => inv.customerEkonId === customer.ekonId  
  );  

  setPackages(customerPackages);  
  setInvoices(customerInvoices);  
  setNotifications(customerNotifications);  
  setCommunications(customerCommunications);  
  setSupportTickets(customerTickets);    
} catch (error) {  
  console.error("Error loading customer dashboard data:", error);  
} finally {  
  setLoading(false);  
}

};

useEffect(() => {
if (customer?.ekonId) {
fetchDashboardData();
}
}, [customer?.ekonId]);

const unreadNotifications = useMemo(
() => notifications.filter((item) => !item.isRead),
[notifications]
);

const inWarehouseCount = useMemo(
() => packages.filter((pkg) => pkg.status === "At Warehouse").length,
[packages]
);

const inTransitCount = useMemo(
() =>
packages.filter(
(pkg) =>
pkg.status === "In Transit" ||
pkg.status === "Manifest Assigned" ||
pkg.status === "Cleared Customs" ||
pkg.status === "In Transit to Branch"
).length,
[packages]
);

const readyForPickupCount = useMemo(
() =>
packages.filter(
(pkg) => pkg.status === "Ready for Pickup" || pkg.readyForPickup === true
).length,
[packages]
);

const outstandingBalance = useMemo(
() =>
invoices
.filter((inv) => inv.status === "Unpaid")
.reduce((sum, inv) => sum + Number(inv.finalTotal || 0), 0),
[invoices]
);

const newInvoicesCount = useMemo(
() => invoices.filter((inv) => inv.status === "Unpaid").length,
[invoices]
);

const customsAlertsCount = useMemo(
() =>
notifications.filter((item) => item.title === "Package Received at Warehouse")
.length,
[notifications]
);

const packagesReadyNotifications = useMemo(
() =>
notifications.filter((item) => item.title === "Package Ready for Pickup")
.length,
[notifications]
);

const communicationCount = useMemo(() => communications.length, [communications]);

const latestNotifications = useMemo(() => {
const appNotifications = notifications.map((item) => ({
type: item.type || "Notification",
title: item.title,
message: item.message,
date: item.date || item.createdAt,
status: item.isRead ? "Read" : "Unread",
sortDate: item.createdAt || item.date,
isRead: item.isRead,
notificationNumber: item.notificationNumber,
}));

const communicationItems = communications.map((item) => ({  
  type: item.channel || "Communication",  
  title: item.subject || "Communication",  
  message: item.message,  
  date: item.date || item.createdAt,  
  status: item.status || "Sent",  
  sortDate: item.createdAt || item.date,  
  isRead: true,  
  notificationNumber: `communication-${item.logNumber || item._id}`,  
}));  

const ticketItems = supportTickets.map((item) => ({  
  type: "Support Ticket",  
  title: item.subject,  
  message: `Ticket ${item.ticketNumber} is ${item.status}`,  
  date: item.date || item.createdAt,  
  status: item.status,  
  sortDate: item.createdAt || item.date,  
  isRead: true,  
  notificationNumber: `ticket-${item.ticketNumber}`,  
}));  

return [...appNotifications, ...communicationItems, ...ticketItems].sort(  
  (a, b) => new Date(b.sortDate) - new Date(a.sortDate)  
);

}, [notifications, communications, supportTickets]);

const totalAlertsPages = Math.max(
1,
Math.ceil(latestNotifications.length / alertsPerPage)
);

const paginatedAlerts = useMemo(() => {
const startIndex = (alertsPage - 1) * alertsPerPage;
return latestNotifications.slice(startIndex, startIndex + alertsPerPage);
}, [latestNotifications, alertsPage]);

useEffect(() => {
if (alertsPage > totalAlertsPages) {
setAlertsPage(1);
}
}, [alertsPage, totalAlertsPages]);

const markNotificationRead = async (notificationNumber) => {
try {
await api.put(`/api/customer-notifications/${notificationNumber}/read`);
await fetchDashboardData();
} catch (error) {
console.error("Error marking notification as read:", error);
}
};

const markAllNotificationsRead = async () => {
try {
await api.put("/api/customer-notifications/read-all");
setShowNotificationPopup(false);
await fetchDashboardData();
} catch (error) {
console.error("Error marking all notifications as read:", error);
}
};

const formatCurrency = (value) => `JMD ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) => {
if (!value) return "";
try {
return new Date(value).toLocaleDateString();
} catch {
return String(value).slice(0, 10);
}
};

const getAlertPreview = (message = "", expanded = false) => {
if (expanded) return message;
if (message.length <= 180) return message;
return `${message.slice(0, 180)}...`;
};

const toggleExpandedAlert = (notificationNumber) => {
setExpandedAlerts((prev) => ({
...prev,
[notificationNumber]: !prev[notificationNumber],
}));
};

const cardStyle = {
backgroundColor: WHITE,
padding: "20px",
borderRadius: "16px",
border: `1px solid ${BORDER}`,
boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
};

const sectionTitleStyle = {
marginBottom: "14px",
fontSize: "23px",
color: TEXT,
};

const metricCardBase = {
borderRadius: "16px",
padding: "20px",
minHeight: "126px",
border: `1px solid ${BORDER}`,
boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
backgroundColor: WHITE,
};

const notificationBadge = (type) => {
let backgroundColor = "#0ea5e9";

if (type === "Invoice Update") backgroundColor = "#7c3aed";  
if (type === "Package Update") backgroundColor = "#16a34a";  
if (type === "Support Ticket") backgroundColor = "#f59e0b";  
if (type === "Email") backgroundColor = ROYAL_BLUE;  
if (type === "WhatsApp") backgroundColor = "#16a34a";  
if (type === "SMS") backgroundColor = "#f97316";  
if (type === "Communication") backgroundColor = "#334155";  
if (type === "Rewards Hub") backgroundColor = ORANGE;

return (  
  <span  
    style={{  
      backgroundColor,  
      color: type === "Rewards Hub" ? "black" : WHITE,  
      padding: "5px 10px",  
      borderRadius: "999px",  
      fontSize: "12px",  
      fontWeight: "bold",  
      whiteSpace: "nowrap",  
    }}  
  >  
    {type}  
  </span>  
);

};

const quickCard = (value, label, valueColor, accentBg) => (
<div
style={{
...metricCardBase,
background: `linear-gradient(180deg, ${WHITE}, ${accentBg})`,
}}
>
<h3
style={{
marginTop: 0,
fontSize: "32px",
color: valueColor,
marginBottom: "10px",
fontWeight: "800",
}}
>
{value}
</h3>
<p style={{ fontWeight: "700", color: "#334155", margin: 0 }}>
{label}
</p>
</div>
);

return (
  <div className="ek-dashboard">
    <CustomerPortalBanner />

    <div className="ek-dashboard-heading">
      <div>
        <p className="ek-dashboard-date">
          {new Intl.DateTimeFormat("en-JM", {
            timeZone: "America/Jamaica",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date())}
        </p>
        <h1>Hello, {customer.name.split(" ")[0]}</h1>
        <p>Your packages and account at a glance.</p>
      </div>

      <button
        type="button"
        onClick={fetchDashboardData}
        disabled={loading}
        className="ek-dashboard-refresh"
      >
        {loading ? "Refreshing…" : "Refresh"}
      </button>
    </div>

    <div className="ek-dashboard-period">
      Account overview <span>All current account records</span>
    </div>

    {loading && (
      <p role="status" className="ek-dashboard-muted">
        Loading your latest account information…
      </p>
    )}

    <div className="ek-dashboard-metrics">
      {[
        {
          label: "Total Packages",
          value: loading ? "—" : packages.length,
          Icon: Package,
          to: "/my-packages",
        },
        {
          label: "Ready for Pickup",
          value: loading ? "—" : readyForPickupCount,
          Icon: Truck,
          to: "/my-packages",
        },
        {
          label: "Outstanding Balance",
          value: loading ? "—" : formatCurrency(outstandingBalance),
          Icon: Wallet,
          to: "/my-invoices",
        },
        {
          label: "EK Points",
          value: Number(customer.pointsBalance || 0).toLocaleString(),
          Icon: Gift,
          to: "/my-rewards",
        },
      ].map(({ label, value, Icon, to }, index) => (
        <Link
          key={label}
          to={to}
          className={`ek-dashboard-metric ${index % 2 ? "ek-dashboard-orange" : ""}`}
        >
          <span className="ek-dashboard-icon">
            <Icon size={23} aria-hidden="true" />
          </span>
          <strong>{value}</strong>
          <span>{label}</span>
          {label === "EK Points" && <small>1 point = JMD $1</small>}
        </Link>
      ))}
    </div>

    <section className="ek-dashboard-section">
      <h2>Package Pipeline</h2>
      <div className="ek-dashboard-pipeline">
        {[
          ["At Warehouse", inWarehouseCount, Package],
          ["In Transit", inTransitCount, Truck],
          ["Ready for Pickup", readyForPickupCount, Package],
        ].map(([label, count, Icon], index) => (
          <Link
            key={label}
            to="/my-packages"
            className={`ek-dashboard-pipeline-card ${index === 1 ? "ek-dashboard-orange" : ""}`}
          >
            <span className="ek-dashboard-dot" />
            <Icon size={26} aria-hidden="true" />
            <strong>{loading ? "—" : count}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </section>

    <section className="ek-dashboard-section">
      <h2>Quick Actions</h2>
      <div className="ek-dashboard-actions">
        {[
          ["Upload Invoice", "/upload-invoice", UploadCloud],
          ["View Invoices", "/my-invoices", FileText],
          ["Pre-Alert", "/pre-alerts", Package],
          ["Calculator", "/rates-calculator", Calculator],
          ["Rewards Hub", "/rewards-hub", Gift],
          ["Get Support", "/support", Headphones],
        ].map(([label, to, Icon]) => (
          <Link key={to} to={to} className="ek-dashboard-action">
            <span className="ek-dashboard-icon">
              <Icon size={24} aria-hidden="true" />
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </section>

    <section className="ek-dashboard-section">
      <h2>Your Information</h2>
            <CustomerHolidayCalendar />

      <details className="ek-dashboard-details">
        <summary>Mailbox Address</summary>
        <div className="ek-dashboard-details-body">
          <p>Use these details when placing your orders.</p>
          <dl className="ek-dashboard-fields">
            <dt>Name</dt><dd>{customer.name} EKON</dd>
            <dt>Address Line 1</dt><dd>2099 NW 141st St</dd>
            <dt>Address Line 2</dt><dd>Unit 8 {customer.ekonId}</dd>
            <dt>City</dt><dd>Opa-Locka</dd>
            <dt>State</dt><dd>Florida</dd>
            <dt>ZIP</dt><dd>33054</dd>
            <dt>Country</dt><dd>USA</dd>
          </dl>
        </div>
      </details>

      <details className="ek-dashboard-details">
        <summary>Account Details</summary>
        <div className="ek-dashboard-details-body">
          <dl className="ek-dashboard-fields">
            <dt>Name</dt><dd>{customer.name}</dd>
            <dt>EKON ID</dt><dd>{customer.ekonId}</dd>
            <dt>Email</dt><dd>{customer.email}</dd>
            <dt>Branch</dt>
            <dd>{customer.branch || "Eltham Park Mainstore"}</dd>
          </dl>
          <Link to="/profile-settings" className="ek-dashboard-text-link">
            Open profile settings →
          </Link>
        </div>
      </details>

      <details className="ek-dashboard-details">
        <summary>Notification &amp; Communication Summary</summary>
        <div className="ek-dashboard-details-body">
          <p>Open the bell at the top of your screen to read individual messages.</p>
          <dl className="ek-dashboard-fields">
            <dt>Unpaid invoices</dt><dd>{newInvoicesCount}</dd>
            <dt>Warehouse notices</dt><dd>{customsAlertsCount}</dd>
            <dt>Ready-for-pickup notices</dt><dd>{packagesReadyNotifications}</dd>
            <dt>Unread notifications</dt><dd>{unreadNotifications.length}</dd>
            <dt>Company messages</dt><dd>{communicationCount}</dd>
          </dl>
          {communications.length > 0 && (
            <p>
              <strong>Latest company message:</strong>{" "}
              {communications[0].subject}
              <br />
              {formatDate(communications[0].date || communications[0].createdAt)}
            </p>
          )}
        </div>
      </details>
    </section>

    <style>{`
      .ek-dashboard {
        --ek-blue: #0B3D91;
        --ek-orange: #F15A24;
        color: #17243b;
        max-width: 1200px;
        margin: 0 auto;
        padding-bottom: 16px;
      }
      .ek-dashboard * { box-sizing: border-box; }
      .ek-dashboard-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin: 22px 0;
      }
      .ek-dashboard-heading h1 {
        font-size: clamp(24px, 3vw, 32px);
        color: var(--ek-blue);
        margin: 6px 0;
      }
      .ek-dashboard-heading p {
        color: #64748b;
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
      }
      .ek-dashboard-heading .ek-dashboard-date { font-size: 13px; }
      .ek-dashboard-refresh {
        background: white;
        border: 1px solid #dce4ef;
        color: var(--ek-blue);
        padding: 10px 14px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 700;
        flex-shrink: 0;
      }
      .ek-dashboard-refresh:disabled { opacity: .6; cursor: wait; }
      .ek-dashboard-period {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        background: white;
        padding: 15px 18px;
        border: 1px solid #e4e9f1;
        border-left: 3px solid var(--ek-orange);
        border-radius: 12px;
        color: var(--ek-blue);
        font-weight: 700;
        margin-bottom: 18px;
      }
      .ek-dashboard-period span {
        font-weight: 400;
        color: #64748b;
        font-size: 13px;
      }
      .ek-dashboard-metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }
      .ek-dashboard-metric,
      .ek-dashboard-pipeline-card,
      .ek-dashboard-action {
        text-decoration: none;
        background: white;
        border: 1px solid #e4e9f1;
        border-radius: 16px;
        box-shadow: 0 2px 3px rgba(15, 23, 42, .035);
        color: var(--ek-blue);
        min-width: 0;
      }
      .ek-dashboard-metric {
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .ek-dashboard-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 13px;
        background: #edf3ff;
        color: var(--ek-blue);
        flex-shrink: 0;
      }
      .ek-dashboard-orange .ek-dashboard-icon {
        background: #fff0e9;
        color: var(--ek-orange);
      }
      .ek-dashboard-metric strong {
        font-size: clamp(22px, 2.4vw, 30px);
        line-height: 1.2;
        overflow-wrap: anywhere;
      }
      .ek-dashboard-metric > span:last-of-type,
      .ek-dashboard-pipeline-card > span:last-child {
        color: #64748b;
        font-size: 14px;
      }
      .ek-dashboard-metric small { color: #64748b; font-size: 11px; }
      .ek-dashboard-section { margin-top: 28px; }
      .ek-dashboard-section h2 {
        font-size: 20px;
        color: var(--ek-blue);
        margin: 0 0 14px;
      }
      .ek-dashboard-pipeline {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .ek-dashboard-pipeline-card {
        padding: 18px 10px;
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 10px;
        text-align: center;
      }
      .ek-dashboard-pipeline-card strong { font-size: 28px; }
      .ek-dashboard-dot {
        width: 7px;
        height: 7px;
        background: var(--ek-blue);
        border-radius: 50%;
      }
      .ek-dashboard-orange .ek-dashboard-dot { background: var(--ek-orange); }
      .ek-dashboard-pipeline-card.ek-dashboard-orange > svg {
        color: var(--ek-orange);
      }
      .ek-dashboard-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .ek-dashboard-action {
        padding: 18px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 12px;
        font-size: 14px;
        font-weight: 600;
      }
      .ek-dashboard-action:nth-child(even) .ek-dashboard-icon {
        background: #fff0e9;
        color: var(--ek-orange);
      }
      .ek-dashboard-details {
        background: white;
        border: 1px solid #e4e9f1;
        border-radius: 12px;
        margin-bottom: 10px;
      }
      .ek-dashboard-details summary {
        padding: 17px;
        cursor: pointer;
        color: var(--ek-blue);
        font-weight: 600;
      }
      .ek-dashboard-details-body {
        padding: 0 17px 17px;
        font-size: 14px;
        line-height: 1.6;
        color: #475569;
      }
      .ek-dashboard-fields {
        display: grid;
        grid-template-columns: minmax(100px, 1fr) minmax(0, 2fr);
        gap: 9px 14px;
      }
      .ek-dashboard-fields dt { font-weight: 600; }
      .ek-dashboard-fields dd { margin: 0; overflow-wrap: anywhere; }
      .ek-dashboard-text-link { color: var(--ek-blue); font-weight: 600; }
      .ek-dashboard-muted { color: #64748b; }
      .ek-dashboard a:hover { border-color: #9bb5df; }
      .ek-dashboard a:focus-visible,
      .ek-dashboard button:focus-visible,
      .ek-dashboard summary:focus-visible {
        outline: 3px solid var(--ek-orange);
        outline-offset: 3px;
      }
      @media (max-width: 900px) {
        .ek-dashboard-metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 480px) {
        .ek-dashboard-metrics { gap: 10px; }
        .ek-dashboard-metric { padding: 16px 13px; }
        .ek-dashboard-heading { align-items: flex-start; }
        .ek-dashboard-pipeline { gap: 8px; }
        .ek-dashboard-pipeline-card > span:last-child { font-size: 12px; }
        .ek-dashboard-actions { gap: 8px; }
        .ek-dashboard-action { padding: 16px 8px; font-size: 12px; }
        .ek-dashboard-fields {
          grid-template-columns: minmax(90px, 1fr) minmax(0, 1.5fr);
        }
      }
    `}</style>
  </div>
);
}

export default CustomerDashboard;