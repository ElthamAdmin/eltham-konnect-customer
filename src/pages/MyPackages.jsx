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

  const fetchPackages = async () => {
    try {
      setLoading(true);

      const customerData = customer || JSON.parse(localStorage.getItem("ek_customer_data") || "null");
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
          pkg.status === "Cleared Customs"
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

    if (status === "At Warehouse") backgroundColor = "#0B3D91";
    else if (status === "Manifest Assigned") backgroundColor = "#7c3aed";
    else if (status === "In Transit") backgroundColor = "#f59e0b";
    else if (status === "Cleared Customs") backgroundColor = "#0891b2";
    else if (status === "Ready for Pickup") backgroundColor = "#16a34a";
    else if (status === "Delivered") backgroundColor = "#475569";

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

  const handleUploadInvoice = (trackingNumber) => {
    alert(`Invoice upload for package ${trackingNumber} will be connected next.`);
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
        <h1 style={{ margin: 0 }}>My Packages</h1>

        <button
          onClick={fetchPackages}
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
            {summary.total}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Total Packages</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#0B3D91" }}>
            {summary.atWarehouse}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>At Warehouse</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#f59e0b" }}>
            {summary.inTransit}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>In Transit</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#16a34a" }}>
            {summary.ready}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Ready for Pickup</p>
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
            placeholder="Search by tracking number, courier, status, or location"
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
            <option value="At Warehouse">At Warehouse</option>
            <option value="Manifest Assigned">Manifest Assigned</option>
            <option value="In Transit">In Transit</option>
            <option value="Cleared Customs">Cleared Customs</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Package Records</h2>

        {loading ? (
          <p>Loading your packages...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="10" style={{ minWidth: "1500px", width: "100%" }}>
              <thead>
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
                    <tr key={pkg._id || index}>
                      <td>{pkg.trackingNumber}</td>
                      <td>{pkg.courier}</td>
                      <td>{pkg.weight}</td>
                      <td>{formatCurrency(pkg.estimatedCharge)}</td>
                      <td>{getStatusBadge(pkg.status)}</td>
                      <td>{pkg.warehouseLocation || ""}</td>
                      <td>{pkg.invoiceStatus || ""}</td>
                      <td>{formatDate(pkg.dateReceived)}</td>
                      <td>
                        <button
                          onClick={() => handleUploadInvoice(pkg.trackingNumber)}
                          style={{
                            backgroundColor: "#0B3D91",
                            color: "white",
                            border: "none",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Upload Invoice
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9">No packages found.</td>
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

export default MyPackages;