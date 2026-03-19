import { useEffect, useMemo, useState } from "react";
import api from "../api";

function CustomerDashboard({ customer }) {
  const [packages, setPackages] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [packagesRes, invoicesRes, communicationsRes, ticketsRes] = await Promise.all([
        api.get("/api/packages"),
        api.get("/api/invoices"),
        api.get("/api/communication"),
        api.get("/api/support-tickets"),
      ]);

      const allPackages = packagesRes.data.data || [];
      const allInvoices = invoicesRes.data.data || [];
      const customerNotifications = communicationsRes.data.data || [];
      const customerTickets = ticketsRes.data.data || [];

      const customerPackages = allPackages.filter(
        (pkg) => pkg.customerEkonId === customer.ekonId
      );

      const customerInvoices = allInvoices.filter(
        (inv) => inv.customerEkonId === customer.ekonId
      );

      setPackages(customerPackages);
      setInvoices(customerInvoices);
      setNotifications(customerNotifications);
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
          pkg.status === "Cleared Customs"
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
    () => packages.filter((pkg) => pkg.status === "At Warehouse").length,
    [packages]
  );

  const packagesReadyNotifications = useMemo(
    () =>
      packages.filter(
        (pkg) => pkg.status === "Ready for Pickup" || pkg.readyForPickup === true
      ).length,
    [packages]
  );

  const latestNotifications = useMemo(() => {
    const communicationItems = notifications.map((item) => ({
      type: "Communication",
      title: item.subject,
      message: item.message,
      date: item.date || item.createdAt,
      status: item.status || "Sent",
      sortDate: item.createdAt || item.date,
    }));

    const ticketItems = supportTickets.map((item) => ({
      type: "Support Ticket",
      title: item.subject,
      message: `Ticket ${item.ticketNumber} is ${item.status}`,
      date: item.date || item.createdAt,
      status: item.status,
      sortDate: item.createdAt || item.date,
    }));

    return [...communicationItems, ...ticketItems]
      .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
      .slice(0, 8);
  }, [notifications, supportTickets]);

  const formatCurrency = (value) =>
    `JMD ${Number(value || 0).toLocaleString()}`;

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
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  };

  const metricCardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    minHeight: "130px",
  };

  const notificationBadge = (type) => {
    const backgroundColor =
      type === "Communication"
        ? "#0ea5e9"
        : "#7c3aed";

    return (
      <span
        style={{
          backgroundColor,
          color: "white",
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        {type}
      </span>
    );
  };

  return (
    <div>
      <h1>Customer Dashboard</h1>

      <div
        style={{
          ...cardStyle,
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Welcome</h2>
        <p><strong>Name:</strong> {customer.name}</p>
        <p><strong>EKON ID:</strong> {customer.ekonId}</p>
        <p><strong>Email:</strong> {customer.email}</p>
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Your Mailbox Address</h2>
        <div style={{ lineHeight: "1.8" }}>
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
            <h2 style={{ marginBottom: "14px" }}>Packages</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
                marginBottom: "28px",
              }}
            >
              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#0B3D91" }}>
                  {inWarehouseCount}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155" }}>
                  In Warehouse
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#f59e0b" }}>
                  {inTransitCount}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155" }}>
                  In Transit
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#16a34a" }}>
                  {readyForPickupCount}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155" }}>
                  Ready for Pickup
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <h2 style={{ marginBottom: "14px" }}>Account</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "20px",
                marginBottom: "28px",
              }}
            >
              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#dc2626" }}>
                  {formatCurrency(outstandingBalance)}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155" }}>
                  Outstanding Balance
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#7c3aed" }}>
                  {Number(customer.pointsBalance || 0).toLocaleString()}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155" }}>
                  EK Points
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <h2 style={{ marginBottom: "14px" }}>Notifications</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
                marginBottom: "28px",
              }}
            >
              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#0ea5e9" }}>
                  {newInvoicesCount}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155" }}>
                  New Invoices
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#f97316" }}>
                  {customsAlertsCount}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155" }}>
                  Customs Alerts
                </p>
              </div>

              <div style={metricCardStyle}>
                <h3 style={{ marginTop: 0, fontSize: "30px", color: "#16a34a" }}>
                  {packagesReadyNotifications}
                </h3>
                <p style={{ fontWeight: "bold", color: "#334155" }}>
                  Packages Ready
                </p>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Latest Alerts</h2>

            {latestNotifications.length > 0 ? (
              <div style={{ display: "grid", gap: "14px" }}>
                {latestNotifications.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "14px",
                      backgroundColor: "#f8fafc",
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
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        {notificationBadge(item.type)}
                        <strong>{item.title}</strong>
                      </div>
                      <span style={{ color: "#64748b", fontSize: "13px" }}>
                        {formatDate(item.date)}
                      </span>
                    </div>

                    <div style={{ color: "#334155", marginBottom: "6px" }}>
                      {item.message}
                    </div>

                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                      Status: {item.status}
                    </div>
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
    </div>
  );
}

export default CustomerDashboard;