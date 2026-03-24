import { useEffect, useMemo, useState } from "react";
import api from "../api";

function CustomerDashboard({ customer }) {
  const [packages, setPackages] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        api.get("/api/packages"),
        api.get("/api/invoices"),
        api.get("/api/customer-notifications/mine"),
        api.get("/api/support-tickets"),
      ]);

      const packagesRes =
        results[0].status === "fulfilled" ? results[0].value : null;
      const invoicesRes =
        results[1].status === "fulfilled" ? results[1].value : null;
      const notificationsRes =
        results[2].status === "fulfilled" ? results[2].value : null;
      const ticketsRes =
        results[3].status === "fulfilled" ? results[3].value : null;

      if (results[2].status === "rejected") {
        console.error(
          "Customer notifications request failed:",
          results[2].reason
        );
      }

      const allPackages = packagesRes?.data?.data || [];
      const allInvoices = invoicesRes?.data?.data || [];
      const customerNotifications = notificationsRes?.data?.data || [];
      const customerTickets = ticketsRes?.data?.data || [];

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

    return [...appNotifications, ...ticketItems]
      .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
      .slice(0, 10);
  }, [notifications, supportTickets]);

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
    backgroundColor: "white",
    padding: "18px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  };

  const metricCardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    minHeight: "120px",
  };

  const sectionTitleStyle = {
    marginBottom: "14px",
    fontSize: "22px",
  };

  const notificationBadge = (type) => {
    let backgroundColor = "#0ea5e9";

    if (type === "Invoice Update") backgroundColor = "#7c3aed";
    if (type === "Package Update") backgroundColor = "#16a34a";
    if (type === "Support Ticket") backgroundColor = "#f59e0b";

    return (
      <span
        style={{
          backgroundColor,
          color: "white",
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "bold",
          whiteSpace: "nowrap",
        }}
      >
        {type}
      </span>
    );
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: "18px" }}>Customer Dashboard</h1>

      {showNotificationPopup && unreadNotifications.length > 0 && (
        <>
          <div
            onClick={() => setShowNotificationPopup(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.4)",
              zIndex: 9998,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: "16px",
              left: "16px",
              right: "16px",
              maxWidth: "420px",
              width: "auto",
              margin: "0 auto",
              maxHeight: "75vh",
              overflowY: "auto",
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 15px 40px rgba(0,0,0,0.18)",
              padding: "16px",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <h3 style={{ margin: 0 }}>New Notifications</h3>
              <button
                onClick={() => setShowNotificationPopup(false)}
                style={{
                  border: "none",
                  backgroundColor: "#e2e8f0",
                  borderRadius: "6px",
                  padding: "8px 10px",
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
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "12px",
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
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {formatDate(item.date || item.createdAt)}
                    </span>
                  </div>

                  <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                    {item.title}
                  </div>

                  <div style={{ color: "#334155", marginBottom: "10px", lineHeight: 1.5 }}>
                    {item.message}
                  </div>

                  <button
                    onClick={() => markNotificationRead(item.notificationNumber)}
                    style={{
                      backgroundColor: "#0B3D91",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      width: "100%",
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
                  color: "white",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "6px",
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

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Welcome</h2>
        <p style={{ marginBottom: "8px", wordBreak: "break-word" }}>
          <strong>Name:</strong> {customer.name}
        </p>
        <p style={{ marginBottom: "8px", wordBreak: "break-word" }}>
          <strong>EKON ID:</strong> {customer.ekonId}
        </p>
        <p style={{ marginBottom: 0, wordBreak: "break-word" }}>
          <strong>Email:</strong> {customer.email}
        </p>
      </div>

      <div style={{ ...cardStyle, marginBottom: "24px" }}>
        <h2 style={{ marginTop: 0 }}>Your Mailbox Address</h2>
        <div style={{ lineHeight: "1.8", wordBreak: "break-word" }}>
          <div><strong>1. Name:</strong> {customer.name} EKON</div>
          <div><strong>2. Address Line 1:</strong> 1447 Banks Road</div>
          <div><strong>3. Address Line 2:</strong> {customer.ekonId}</div>
          <div><strong>4. City:</strong> Margate</div>
          <div><strong>5. State:</strong> Florida</div>
          <div><strong>6. ZIP:</strong> 33063</div>
        </div>
      </div>

      {loading ? (
        <div style={cardStyle}>
          <p style={{ margin: 0 }}>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "10px" }}>
            <h2 style={sectionTitleStyle}>Packages</h2>
            <div className="dashboard-grid dashboard-grid-3">
              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#0B3D91", marginBottom: "8px" }}>
                  {inWarehouseCount}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
                  In Warehouse
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#f59e0b", marginBottom: "8px" }}>
                  {inTransitCount}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
                  In Transit
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#16a34a", marginBottom: "8px" }}>
                  {readyForPickupCount}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
                  Ready for Pickup
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <h2 style={sectionTitleStyle}>Account</h2>
            <div className="dashboard-grid dashboard-grid-2">
              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#dc2626", marginBottom: "8px", wordBreak: "break-word" }}>
                  {formatCurrency(outstandingBalance)}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
                  Outstanding Balance
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#7c3aed", marginBottom: "8px" }}>
                  {Number(customer.pointsBalance || 0).toLocaleString()}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
                  EK Points
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <h2 style={sectionTitleStyle}>Notifications</h2>
            <div className="dashboard-grid dashboard-grid-4">
              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#0ea5e9", marginBottom: "8px" }}>
                  {newInvoicesCount}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
                  New Invoices
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#f97316", marginBottom: "8px" }}>
                  {customsAlertsCount}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
                  Customs Alerts
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#16a34a", marginBottom: "8px" }}>
                  {packagesReadyNotifications}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
                  Packages Ready
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#7c3aed", marginBottom: "8px" }}>
                  {unreadNotifications.length}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155", margin: 0 }}>
                  Unread Alerts
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
                marginBottom: "14px",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>Latest Alerts</h2>

              {unreadNotifications.length > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  style={{
                    backgroundColor: "#16a34a",
                    color: "white",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: "6px",
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
              <div style={{ display: "grid", gap: "14px" }}>
                {latestNotifications.map((item) => (
                  <div
                    key={item.notificationNumber}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px",
                      backgroundColor: item.isRead ? "#f8fafc" : "#eff6ff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
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
                        <strong style={{ wordBreak: "break-word" }}>{item.title}</strong>
                      </div>
                      <span style={{ color: "#64748b", fontSize: "13px" }}>
                        {formatDate(item.date)}
                      </span>
                    </div>

                    <div style={{ color: "#334155", marginBottom: "6px", lineHeight: 1.5 }}>
                      {item.message}
                    </div>

                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                      Status: {item.status}
                    </div>

                    {!item.isRead &&
                      item.notificationNumber &&
                      !String(item.notificationNumber).startsWith("ticket-") && (
                        <button
                          onClick={() => markNotificationRead(item.notificationNumber)}
                          style={{
                            marginTop: "10px",
                            backgroundColor: "#0B3D91",
                            color: "white",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            width: "100%",
                            maxWidth: "180px",
                          }}
                        >
                          Mark as Read
                        </button>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: "#64748b" }}>
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

          @media (max-width: 1100px) {
            .dashboard-grid-4 {
              grid-template-columns: repeat(2, 1fr);
            }

            .dashboard-grid-3 {
              grid-template-columns: repeat(2, 1fr);
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