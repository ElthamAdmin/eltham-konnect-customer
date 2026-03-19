import { useEffect, useMemo, useState } from "react";
import api from "../api";

function MyInvoices() {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });

  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      const customerData =
        customer || JSON.parse(localStorage.getItem("ek_customer_data") || "null");

      if (!customerData?.ekonId) {
        setInvoices([]);
        return;
      }

      const res = await api.get("/api/invoices");
      const allInvoices = res.data.data || [];

      const customerInvoices = allInvoices.filter(
        (inv) => inv.customerEkonId === customerData.ekonId
      );

      setInvoices(customerInvoices);
    } catch (error) {
      console.error("Error loading customer invoices:", error);
      alert(error?.response?.data?.message || "Could not load your invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        `${inv.invoiceNumber} ${inv.customerName} ${inv.customerEkonId} ${inv.status}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const unpaid = invoices.filter((inv) => inv.status === "Unpaid");
    const paid = invoices.filter((inv) => inv.status === "Paid");

    return {
      totalInvoices: invoices.length,
      unpaidInvoices: unpaid.length,
      paidInvoices: paid.length,
      outstandingBalance: unpaid.reduce(
        (sum, inv) => sum + Number(inv.finalTotal || 0),
        0
      ),
    };
  }, [invoices]);

  const formatCurrency = (value) =>
    `JMD ${Number(value || 0).toLocaleString()}`;

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return String(value).slice(0, 10);
    } catch {
      return value;
    }
  };

  const getStatusBadge = (status) => {
    const backgroundColor =
      status === "Paid"
        ? "#16a34a"
        : status === "Unpaid"
        ? "#dc2626"
        : "#64748b";

    return (
      <span
        style={{
          backgroundColor,
          color: "white",
          padding: "4px 10px",
          borderRadius: "6px",
          fontWeight: "bold",
          fontSize: "12px",
          display: "inline-block",
        }}
      >
        {status}
      </span>
    );
  };

  const handlePayNow = (invoice) => {
    if (invoice.paymentLink) {
      window.open(invoice.paymentLink, "_blank", "noopener,noreferrer");
      return;
    }

    alert(`Payment link has not been added yet for invoice ${invoice.invoiceNumber}. Please contact Eltham Konnect if needed.`);
  };

  const cardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  };

  const metricCardStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    minHeight: "120px",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h1 style={{ margin: 0 }}>My Invoices</h1>

        <button
          onClick={fetchInvoices}
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#1f3552" }}>
            {summary.totalInvoices}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Total Invoices</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#dc2626" }}>
            {summary.unpaidInvoices}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Unpaid Invoices</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#16a34a" }}>
            {summary.paidInvoices}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Paid Invoices</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#0B3D91" }}>
            {formatCurrency(summary.outstandingBalance)}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>
            Outstanding Balance
          </p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Search & Filter</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "15px",
          }}
        >
          <input
            type="text"
            placeholder="Search by invoice number or status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px" }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px" }}
          >
            <option value="All">All Statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Invoice Records</h2>

        {loading ? (
          <p>Loading your invoices...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="10" style={{ minWidth: "1700px", width: "100%" }}>
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Customer</th>
                  <th>Package Count</th>
                  <th>Subtotal</th>
                  <th>Points Redeemed</th>
                  <th>Final Total</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Paid Date</th>
                  <th>Payment Link</th>
                  <th>Pay Now</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv, index) => (
                    <tr key={inv._id || index}>
                      <td>{inv.invoiceNumber}</td>
                      <td>{inv.customerName}</td>
                      <td>{inv.packageCount}</td>
                      <td>{formatCurrency(inv.subtotal)}</td>
                      <td>{Number(inv.pointsRedeemed || 0).toLocaleString()}</td>
                      <td>{formatCurrency(inv.finalTotal)}</td>
                      <td>{getStatusBadge(inv.status)}</td>
                      <td>{formatDate(inv.createdAt)}</td>
                      <td>{inv.paidDate ? formatDate(inv.paidDate) : "Not paid yet"}</td>
                      <td>
                        {inv.paymentLink ? (
                          <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                            Link Added
                          </span>
                        ) : (
                          <span style={{ color: "#dc2626", fontWeight: "bold" }}>
                            Not Added Yet
                          </span>
                        )}
                      </td>
                      <td>
                        {inv.status === "Unpaid" ? (
                          <button
                            onClick={() => handlePayNow(inv)}
                            disabled={!inv.paymentLink}
                            style={{
                              backgroundColor: !inv.paymentLink ? "#999" : "#0B3D91",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: !inv.paymentLink ? "not-allowed" : "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            Pay Now
                          </button>
                        ) : (
                          <span style={{ color: "#16a34a", fontWeight: "bold" }}>
                            Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11">No invoices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyInvoices;