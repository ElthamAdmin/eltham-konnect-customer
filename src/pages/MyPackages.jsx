import { useEffect, useMemo, useState } from "react";
import api from "../api";

function MyPackages() {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });

  const [packages, setPackages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchPackages = async () => {
    try {
      setLoading(true);

      const customerData =
        customer || JSON.parse(localStorage.getItem("ek_customer_data") || "null");

      if (!customerData?.ekonId) {
        setPackages([]);
        return;
      }

      const res = await api.get("/api/packages");
      const allPackages = res.data.data || [];

      const customerPackages = allPackages.filter(
        (pkg) => pkg.customerEkonId === customerData.ekonId
      );

      setPackages(customerPackages);
    } catch (error) {
      console.error("Error loading customer packages:", error);
      alert(error?.response?.data?.message || "Could not load your packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesSearch =
        `${pkg.trackingNumber} ${pkg.customerName} ${pkg.courier} ${pkg.status} ${pkg.warehouseLocation}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || pkg.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [packages, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: packages.length,
      atWarehouse: packages.filter((pkg) => pkg.status === "At Warehouse").length,
      inTransit: packages.filter(
        (pkg) =>
          pkg.status === "In Transit" ||
          pkg.status === "Manifest Assigned" ||
          pkg.status === "Cleared Customs" ||
          pkg.status === "In Transit to Branch"
      ).length,
      ready: packages.filter(
        (pkg) => pkg.status === "Ready for Pickup" || pkg.readyForPickup === true
      ).length,
    };
  }, [packages]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return String(value).slice(0, 10);
    } catch {
      return value;
    }
  };

  const formatCurrency = (value) =>
    `JMD ${Number(value || 0).toLocaleString()}`;

  const getStatusBadge = (status) => {
    let backgroundColor = "#64748b";
    let glowColor = "rgba(100, 116, 139, 0.18)";

    if (status === "At Warehouse") {
      backgroundColor = ROYAL_BLUE;
      glowColor = "rgba(11, 61, 145, 0.18)";
    } else if (status === "Manifest Assigned") {
      backgroundColor = "#7c3aed";
      glowColor = "rgba(124, 58, 237, 0.18)";
    } else if (status === "In Transit") {
      backgroundColor = "#f59e0b";
      glowColor = "rgba(245, 158, 11, 0.18)";
    } else if (status === "Cleared Customs") {
      backgroundColor = "#0891b2";
      glowColor = "rgba(8, 145, 178, 0.18)";
    } else if (status === "In Transit to Branch") {
      backgroundColor = "#ea580c";
      glowColor = "rgba(234, 88, 12, 0.18)";
    } else if (status === "Ready for Pickup") {
      backgroundColor = "#16a34a";
      glowColor = "rgba(22, 163, 74, 0.18)";
    } else if (status === "Delivered") {
      backgroundColor = "#475569";
      glowColor = "rgba(71, 85, 105, 0.18)";
    }

    return (
      <span
        style={{
          backgroundColor,
          color: "white",
          padding: "6px 12px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
          display: "inline-block",
          boxShadow: `0 6px 16px ${glowColor}`,
          whiteSpace: "nowrap",
        }}
      >
        {status}
      </span>
    );
  };

  const handleUploadInvoice = (trackingNumber) => {
    alert(`Invoice upload for package ${trackingNumber} will be connected next.`);
  };

  const cardStyle = {
    backgroundColor: WHITE,
    borderRadius: "16px",
    padding: "20px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
  };

  const metricCardBase = {
    backgroundColor: WHITE,
    borderRadius: "16px",
    padding: "20px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
    minHeight: "125px",
  };

  const summaryCard = (value, label, valueColor, bgTone) => (
    <div
      style={{
        ...metricCardBase,
        background: `linear-gradient(180deg, ${WHITE}, ${bgTone})`,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          fontSize: "32px",
          color: valueColor,
          marginBottom: "10px",
          fontWeight: "800",
        }}
      >
        {value}
      </h2>
      <p style={{ fontWeight: "700", color: "#334155", margin: 0 }}>{label}</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: LIGHT_BG }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "22px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: TEXT, fontSize: "38px" }}>My Packages</h1>
          <p style={{ margin: "6px 0 0 0", color: MUTED }}>
            Track your package movement, pickup readiness, and invoice status.
          </p>
        </div>

        <button
          onClick={fetchPackages}
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            width: "100%",
            maxWidth: "160px",
          }}
        >
          Refresh
        </button>
      </div>

      <div className="mypackages-summary-grid">
        {summaryCard(summary.total, "Total Packages", "#1f3552", "#f8fbff")}
        {summaryCard(summary.atWarehouse, "At Warehouse", ROYAL_BLUE, "#f2f7ff")}
        {summaryCard(summary.inTransit, "In Transit", "#f59e0b", "#fff8ea")}
        {summaryCard(summary.ready, "Ready for Pickup", "#16a34a", "#effcf4")}
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "6px", color: TEXT }}>
            Search & Filter
          </h2>
          <p style={{ margin: 0, color: MUTED, fontSize: "14px" }}>
            Quickly find packages by tracking number, courier, status, or location.
          </p>
        </div>

        <div className="mypackages-filter-grid">
          <input
            type="text"
            placeholder="Search by tracking number, courier, status, or location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: `1px solid ${BORDER}`,
              backgroundColor: WHITE,
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: `1px solid ${BORDER}`,
              backgroundColor: WHITE,
            }}
          >
            <option value="All">All Statuses</option>
            <option value="At Warehouse">At Warehouse</option>
            <option value="Manifest Assigned">Manifest Assigned</option>
            <option value="In Transit">In Transit</option>
            <option value="Cleared Customs">Cleared Customs</option>
            <option value="In Transit to Branch">In Transit to Branch</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Delivered">Delivered</option>
          </select>
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
            <h2 style={{ marginTop: 0, marginBottom: "6px", color: TEXT }}>
              Package Records
            </h2>
            <p style={{ margin: 0, color: MUTED, fontSize: "14px" }}>
              {filteredPackages.length} package{filteredPackages.length === 1 ? "" : "s"} matched
              your current search.
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: MUTED, margin: 0 }}>Loading your packages...</p>
        ) : (
          <>
            <div className="mypackages-table-wrap">
              <table
                border="1"
                cellPadding="12"
                style={{
                  minWidth: "1500px",
                  width: "100%",
                  borderCollapse: "collapse",
                  borderColor: BORDER,
                }}
              >
                <thead style={{ backgroundColor: "#eef4ff" }}>
                  <tr>
                    <th>Tracking Number</th>
                    <th>Courier</th>
                    <th>Weight</th>
                    <th>Estimated Charge</th>
                    <th>Status</th>
                    <th>Warehouse Location</th>
                    <th>Invoice Status</th>
                    <th>Date Received</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPackages.length > 0 ? (
                    filteredPackages.map((pkg, index) => (
                      <tr key={pkg._id || index} style={{ backgroundColor: WHITE }}>
                        <td style={{ fontWeight: "700", color: TEXT, wordBreak: "break-word" }}>
                          {pkg.trackingNumber}
                        </td>
                        <td>{pkg.courier || "-"}</td>
                        <td>{pkg.weight}</td>
                        <td style={{ fontWeight: "700" }}>
                          {formatCurrency(pkg.estimatedCharge)}
                        </td>
                        <td>{getStatusBadge(pkg.status)}</td>
                        <td>{pkg.warehouseLocation || "-"}</td>
                        <td>{pkg.invoiceStatus || "-"}</td>
                        <td>{formatDate(pkg.dateReceived)}</td>
                        <td>
                          <button
                            onClick={() => handleUploadInvoice(pkg.trackingNumber)}
                            style={{
                              backgroundColor: ROYAL_BLUE,
                              color: "white",
                              border: "none",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "700",
                            }}
                          >
                            Upload Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", color: MUTED, padding: "20px" }}>
                        No packages found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mypackages-mobile-list">
              {filteredPackages.length > 0 ? (
                filteredPackages.map((pkg, index) => (
                  <div
                    key={pkg._id || index}
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: "16px",
                      padding: "16px",
                      backgroundColor: WHITE,
                      marginBottom: "14px",
                      boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: MUTED, marginBottom: "4px" }}>
                        Tracking Number
                      </div>
                      <div style={{ fontWeight: "800", wordBreak: "break-word", color: TEXT }}>
                        {pkg.trackingNumber}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "12px",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Courier</div>
                        <div>{pkg.courier || "-"}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Weight</div>
                        <div>{pkg.weight}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Estimated Charge</div>
                        <div style={{ fontWeight: "700" }}>
                          {formatCurrency(pkg.estimatedCharge)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Status</div>
                        <div>{getStatusBadge(pkg.status)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Warehouse Location</div>
                        <div>{pkg.warehouseLocation || "-"}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Invoice Status</div>
                        <div>{pkg.invoiceStatus || "-"}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Date Received</div>
                        <div>{formatDate(pkg.dateReceived)}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUploadInvoice(pkg.trackingNumber)}
                      style={{
                        backgroundColor: ROYAL_BLUE,
                        color: "white",
                        border: "none",
                        padding: "11px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        width: "100%",
                        fontWeight: "bold",
                      }}
                    >
                      Upload Invoice
                    </button>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: "14px",
                    padding: "16px",
                    backgroundColor: WHITE,
                    color: MUTED,
                  }}
                >
                  No packages found.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>
        {`
          .mypackages-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 24px;
          }

          .mypackages-filter-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 15px;
          }

          .mypackages-mobile-list {
            display: none;
          }

          .mypackages-table-wrap {
            overflow-x: auto;
          }

          @media (max-width: 1100px) {
            .mypackages-summary-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 700px) {
            .mypackages-summary-grid,
            .mypackages-filter-grid {
              grid-template-columns: 1fr;
            }

            .mypackages-table-wrap {
              display: none;
            }

            .mypackages-mobile-list {
              display: block;
            }
          }
        `}
      </style>
    </div>
  );
}

export default MyPackages;