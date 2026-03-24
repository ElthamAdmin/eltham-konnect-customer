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

    alert(
      `Payment link has not been added yet for invoice ${invoice.invoiceNumber}. Please contact Eltham Konnect if needed.`
    );
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
            width: "100%",
            maxWidth: "160px",
          }}
        >
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="invoice-summary">
        <div style={metricCardStyle}>
          <h2>{summary.totalInvoices}</h2>
          <p>Total Invoices</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ color: "#dc2626" }}>{summary.unpaidInvoices}</h2>
          <p>Unpaid</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ color: "#16a34a" }}>{summary.paidInvoices}</h2>
          <p>Paid</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ color: "#0B3D91" }}>
            {formatCurrency(summary.outstandingBalance)}
          </h2>
          <p>Outstanding</p>
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2>Search & Filter</h2>

        <div className="invoice-filter">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div style={cardStyle}>
        <h2>Invoice Records</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="table-desktop">
              <table border="1" cellPadding="10" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Pay</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv._id}>
                      <td>{inv.invoiceNumber}</td>
                      <td>{inv.customerName}</td>
                      <td>{formatCurrency(inv.finalTotal)}</td>
                      <td>{getStatusBadge(inv.status)}</td>
                      <td>
                        {inv.status === "Unpaid" && (
                          <button
                            onClick={() => handlePayNow(inv)}
                            disabled={!inv.paymentLink}
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="table-mobile">
              {filteredInvoices.map((inv) => (
                <div key={inv._id} className="mobile-card">
                  <div><strong>{inv.invoiceNumber}</strong></div>
                  <div>{formatCurrency(inv.finalTotal)}</div>
                  <div>{getStatusBadge(inv.status)}</div>

                  {inv.status === "Unpaid" && (
                    <button
                      onClick={() => handlePayNow(inv)}
                      disabled={!inv.paymentLink}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CSS */}
      <style>{`
        .invoice-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .invoice-filter {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 10px;
        }

        .table-mobile {
          display: none;
        }

        .mobile-card {
          border: 1px solid #ddd;
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .invoice-summary {
            grid-template-columns: 1fr;
          }

          .invoice-filter {
            grid-template-columns: 1fr;
          }

          .table-desktop {
            display: none;
          }

          .table-mobile {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}

export default MyInvoices;