import { useEffect, useMemo, useState } from "react";
import api from "../api";

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
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        api.get("/api/packages"),
        api.get("/api/invoices"),
        api.get("/api/customer-notifications/mine"),
        api.get("/api/support-tickets"),
        api.get("/api/communication"),
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

      const unreadItems = customerNotifications.filter((item) => !item.isRead);

      setPackages(customerPackages);
      setInvoices(customerInvoices);
      setNotifications(customerNotifications);
      setCommunications(customerCommunications);
      setSupportTickets(customerTickets);
      setShowNotificationPopup(unreadItems.length > 0);
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

  useEffect(() => {
  if (alertsPage > totalAlertsPages) {
    setAlertsPage(1);
  }
}, [alertsPage, totalAlertsPages]);

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

const alertsPerPage = 5;

const totalAlertsPages = Math.max(
  1,
  Math.ceil(latestNotifications.length / alertsPerPage)
);

const paginatedAlerts = useMemo(() => {
  const startIndex = (alertsPage - 1) * alertsPerPage;
  return latestNotifications.slice(startIndex, startIndex + alertsPerPage);
}, [latestNotifications, alertsPage]);

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

    return (
      <span
        style={{
          backgroundColor,
          color: WHITE,
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
    <div style={{ backgroundColor: LIGHT_BG }}>
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ marginTop: 0, marginBottom: "6px", color: TEXT, fontSize: "42px" }}>
            Customer Dashboard
          </h1>
          <p style={{ margin: 0, color: MUTED, fontSize: "15px" }}>
            Welcome back, {customer.name}. Here is your latest account activity.
          </p>
        </div>

        <div
          style={{
            ...cardStyle,
            minWidth: "240px",
            background: "linear-gradient(180deg, #fffdf5, #fff8e1)",
            border: "1px solid #f3dd90",
          }}
        >
          <div style={{ color: MUTED, fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>
            Available Rewards
          </div>
          <div style={{ color: GOLD, fontSize: "30px", fontWeight: "800" }}>
            {Number(customer.pointsBalance || 0).toLocaleString()} EK Points
          </div>
          <div style={{ color: "#8a6a00", fontSize: "13px", marginTop: "6px" }}>
            1 point = JMD $1
          </div>
        </div>
      </div>

      {showNotificationPopup && unreadNotifications.length > 0 && (
        <>
          <div
            onClick={() => setShowNotificationPopup(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.45)",
              zIndex: 9998,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: "16px",
              left: "16px",
              right: "16px",
              maxWidth: "450px",
              width: "auto",
              margin: "0 auto",
              maxHeight: "76vh",
              overflowY: "auto",
              backgroundColor: WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: "16px",
              boxShadow: "0 20px 45px rgba(0,0,0,0.18)",
              padding: "18px",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <h3 style={{ margin: 0, color: TEXT }}>New Notifications</h3>
              <button
                onClick={() => setShowNotificationPopup(false)}
                style={{
                  border: "none",
                  backgroundColor: "#e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {unreadNotifications.map((item) => (
                <div
                  key={item.notificationNumber}
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: "14px",
                    padding: "14px",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginBottom: "8px",
                    }}
                  >
                    {notificationBadge(item.type)}
                    <span style={{ fontSize: "12px", color: MUTED }}>
                      {formatDate(item.date || item.createdAt)}
                    </span>
                  </div>

                  <div style={{ fontWeight: "800", marginBottom: "6px", color: TEXT }}>
                    {item.title}
                  </div>

                  <div style={{ color: "#334155", marginBottom: "10px", lineHeight: 1.5 }}>
                    {item.message}
                  </div>

                  <button
                    onClick={() => markNotificationRead(item.notificationNumber)}
                    style={{
                      backgroundColor: ROYAL_BLUE,
                      color: WHITE,
                      border: "none",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      width: "100%",
                      fontWeight: "700",
                    }}
                  >
                    Mark as Read
                  </button>
                </div>
              ))}
            </div>

            {unreadNotifications.length > 1 && (
              <button
                onClick={markAllNotificationsRead}
                style={{
                  marginTop: "14px",
                  backgroundColor: "#16a34a",
                  color: WHITE,
                  border: "none",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "100%",
                  fontWeight: "bold",
                }}
              >
                Mark All as Read
              </button>
            )}
          </div>
        </>
      )}

      <div
        style={{
          ...cardStyle,
          marginBottom: "24px",
          background: `linear-gradient(135deg, ${ROYAL_BLUE}, #1f4fb0)`,
          color: WHITE,
          border: "none",
        }}
      >
        <div className="dashboard-hero-grid">
          <div>
            <div style={{ fontSize: "13px", opacity: 0.85, marginBottom: "10px", fontWeight: "700" }}>
              ACCOUNT OVERVIEW
            </div>
            <h2 style={{ marginTop: 0, marginBottom: "12px", fontSize: "30px" }}>
              Welcome, {customer.name}
            </h2>
            <div style={{ display: "grid", gap: "8px", lineHeight: 1.6 }}>
              <div><strong>EKON ID:</strong> {customer.ekonId}</div>
              <div><strong>Email:</strong> {customer.email}</div>
              <div><strong>Branch:</strong> {customer.branch || "Eltham Park Mainstore"}</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "16px",
              padding: "18px",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: "700", opacity: 0.9, marginBottom: "10px" }}>
              MAILBOX ADDRESS
            </div>
            <div style={{ lineHeight: "1.8", wordBreak: "break-word" }}>
              <div><strong>1. Name:</strong> {customer.name} EKON</div>
              <div><strong>2. Address Line 1:</strong> 1447 Banks Road</div>
              <div><strong>3. Address Line 2:</strong> {customer.ekonId}</div>
              <div><strong>4. City:</strong> Margate</div>
              <div><strong>5. State:</strong> Florida</div>
              <div><strong>6. ZIP:</strong> 33063</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={cardStyle}>
          <p style={{ margin: 0, color: MUTED }}>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "6px" }}>
            <h2 style={sectionTitleStyle}>Packages</h2>
            <div className="dashboard-grid dashboard-grid-3">
              {quickCard(inWarehouseCount, "In Warehouse", ROYAL_BLUE, "#f3f7ff")}
              {quickCard(inTransitCount, "In Transit", "#f59e0b", "#fff8ea")}
              {quickCard(readyForPickupCount, "Ready for Pickup", "#16a34a", "#effcf4")}
            </div>
          </div>

          <div style={{ marginBottom: "6px" }}>
            <h2 style={sectionTitleStyle}>Account</h2>
            <div className="dashboard-grid dashboard-grid-2">
              {quickCard(formatCurrency(outstandingBalance), "Outstanding Balance", "#dc2626", "#fff3f2")}
              {quickCard(Number(customer.pointsBalance || 0).toLocaleString(), "EK Points", "#7c3aed", "#f7f2ff")}
            </div>
          </div>

          <div style={{ marginBottom: "6px" }}>
            <h2 style={sectionTitleStyle}>Notifications</h2>
            <div className="dashboard-grid dashboard-grid-4">
              {quickCard(newInvoicesCount, "New Invoices", "#0ea5e9", "#eff9ff")}
              {quickCard(customsAlertsCount, "Customs Alerts", "#f97316", "#fff4ed")}
              {quickCard(packagesReadyNotifications, "Packages Ready", "#16a34a", "#effcf4")}
              {quickCard(unreadNotifications.length, "Unread Alerts", "#7c3aed", "#f7f2ff")}
            </div>
          </div>

          <div style={{ marginBottom: "6px" }}>
            <h2 style={sectionTitleStyle}>Communication</h2>
            <div className="dashboard-grid dashboard-grid-2">
              {quickCard(communicationCount, "Messages from Eltham Konnect", ROYAL_BLUE, "#f3f7ff")}

              <div style={{ ...metricCardBase, background: "linear-gradient(180deg, #fffdf7, #fff9ec)" }}>
                <h3
                  style={{
                    marginTop: 0,
                    fontSize: "18px",
                    color: GOLD,
                    marginBottom: "10px",
                    lineHeight: 1.4,
                    fontWeight: "800",
                  }}
                >
                  {communications.length > 0
                    ? communications[0].subject
                    : "No communication yet"}
                </h3>
                <p style={{ color: "#334155", margin: 0, fontWeight: "600" }}>
                  {communications.length > 0
                    ? formatDate(communications[0].date || communications[0].createdAt)
                    : "Check back later"}
                </p>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "16px",
    }}
  >
    <div>
      <h2 style={{ marginTop: 0, marginBottom: "4px", color: TEXT }}>
        Latest Alerts
      </h2>
      <p style={{ margin: 0, color: MUTED, fontSize: "14px" }}>
        Notifications, messages, and support updates in one place.
      </p>
    </div>

    {unreadNotifications.length > 0 && (
      <button
        onClick={markAllNotificationsRead}
        style={{
          backgroundColor: "#16a34a",
          color: WHITE,
          border: "none",
          padding: "10px 14px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          width: "100%",
          maxWidth: "260px",
        }}
      >
        Mark All Notifications as Read
      </button>
    )}
  </div>

  {latestNotifications.length > 0 ? (
    <>
      <div style={{ display: "grid", gap: "14px" }}>
        {paginatedAlerts.map((item) => {
          const isExpanded = !!expandedAlerts[item.notificationNumber];

          return (
            <div
              key={item.notificationNumber}
              style={{
                border: `1px solid ${BORDER}`,
                borderRadius: "14px",
                padding: "15px",
                backgroundColor: item.isRead ? "#fbfcfe" : "#eff6ff",
                boxShadow: "0 4px 12px rgba(15,23,42,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "10px",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {notificationBadge(item.type)}
                  <strong style={{ wordBreak: "break-word", color: TEXT }}>
                    {item.title}
                  </strong>
                </div>

                <span style={{ color: MUTED, fontSize: "13px" }}>
                  {formatDate(item.date)}
                </span>
              </div>

              <div
                style={{
                  color: "#334155",
                  marginBottom: "10px",
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                }}
              >
                {getAlertPreview(item.message, isExpanded)}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ color: MUTED, fontSize: "13px" }}>
                  Status: {item.status}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {item.message && item.message.length > 180 && (
                    <button
                      onClick={() => toggleExpandedAlert(item.notificationNumber)}
                      style={{
                        backgroundColor: "#e2e8f0",
                        color: TEXT,
                        border: "none",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "700",
                      }}
                    >
                      {isExpanded ? "Show Less" : "View More"}
                    </button>
                  )}

                  {!item.isRead &&
                    item.notificationNumber &&
                    !String(item.notificationNumber).startsWith("ticket-") && (
                      <button
                        onClick={() => markNotificationRead(item.notificationNumber)}
                        style={{
                          backgroundColor: ROYAL_BLUE,
                          color: WHITE,
                          border: "none",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "700",
                        }}
                      >
                        Mark as Read
                      </button>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ color: MUTED, fontSize: "14px", fontWeight: "600" }}>
          Page {alertsPage} of {totalAlertsPages}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setAlertsPage((prev) => Math.max(prev - 1, 1))}
            disabled={alertsPage === 1}
            style={{
              backgroundColor: alertsPage === 1 ? "#cbd5e1" : ROYAL_BLUE,
              color: WHITE,
              border: "none",
              padding: "9px 14px",
              borderRadius: "8px",
              cursor: alertsPage === 1 ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            Previous
          </button>

          <button
            onClick={() =>
              setAlertsPage((prev) => Math.min(prev + 1, totalAlertsPages))
            }
            disabled={alertsPage === totalAlertsPages}
            style={{
              backgroundColor:
                alertsPage === totalAlertsPages ? "#cbd5e1" : ROYAL_BLUE,
              color: WHITE,
              border: "none",
              padding: "9px 14px",
              borderRadius: "8px",
              cursor:
                alertsPage === totalAlertsPages ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            Next
          </button>
        </div>
      </div>
    </>
  ) : (
    <p style={{ margin: 0, color: MUTED }}>
      No alerts available yet.
    </p>
  )}
</div>
        </>
      )}

      <style>
        {`
          .dashboard-grid {
            display: grid;
            gap: 20px;
            margin-bottom: 28px;
          }

          .dashboard-grid-4 {
            grid-template-columns: repeat(4, 1fr);
          }

          .dashboard-grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }

          .dashboard-grid-2 {
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-hero-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 18px;
            align-items: stretch;
          }

          @media (max-width: 1100px) {
            .dashboard-grid-4 {
              grid-template-columns: repeat(2, 1fr);
            }

            .dashboard-grid-3 {
              grid-template-columns: repeat(2, 1fr);
            }

            .dashboard-hero-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .dashboard-grid-4,
            .dashboard-grid-3,
            .dashboard-grid-2 {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}

export default CustomerDashboard;