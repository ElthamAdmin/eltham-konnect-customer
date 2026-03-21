import { useEffect, useMemo, useState } from "react";
import api from "../api";

function MyRewards() {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });

  const [pointsHistory, setPointsHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRewardsData = async () => {
    try {
      setLoading(true);

      const savedCustomer =
        customer || JSON.parse(localStorage.getItem("ek_customer_data") || "null");

      if (!savedCustomer?.ekonId) {
        setPointsHistory([]);
        setCustomer(null);
        return;
      }

      const [profileRes, historyRes] = await Promise.all([
        api.get("/api/customer-auth/me"),
        api.get("/api/customers/points-history"),
      ]);

      const freshCustomer = profileRes.data?.data || null;
      const allRecords = historyRes.data?.data || [];

      if (freshCustomer) {
        setCustomer(freshCustomer);
        localStorage.setItem("ek_customer_data", JSON.stringify(freshCustomer));
      }

      const ekonIdToUse = freshCustomer?.ekonId || savedCustomer.ekonId;

      const customerRecords = allRecords.filter(
        (record) => record.customerEkonId === ekonIdToUse
      );

      setPointsHistory(customerRecords);
    } catch (error) {
      console.error("Error loading rewards data:", error);
      alert(error?.response?.data?.message || "Could not load rewards data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const filteredHistory = useMemo(() => {
    return pointsHistory.filter((record) =>
      `${record.action} ${record.customerName} ${record.customerEkonId} ${record.date}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [pointsHistory, searchTerm]);

  const summary = useMemo(() => {
    const earned = pointsHistory
      .filter((item) => Number(item.points || 0) > 0)
      .reduce((sum, item) => sum + Number(item.points || 0), 0);

    const redeemedOrExpired = pointsHistory
      .filter((item) => Number(item.points || 0) < 0)
      .reduce((sum, item) => sum + Math.abs(Number(item.points || 0)), 0);

    return {
      currentBalance: Number(customer?.pointsBalance || 0),
      totalEarned: earned,
      totalUsedOrExpired: redeemedOrExpired,
      totalActivity: pointsHistory.length,
    };
  }, [pointsHistory, customer]);

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return String(value).slice(0, 10);
    } catch {
      return value;
    }
  };

  const getPointsStyle = (points) => {
    const numericPoints = Number(points || 0);

    return {
      color: numericPoints >= 0 ? "#16a34a" : "#dc2626",
      fontWeight: "bold",
    };
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
        <h1 style={{ margin: 0 }}>My Rewards</h1>

        <button
          onClick={fetchRewardsData}
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
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#7c3aed" }}>
            {summary.currentBalance.toLocaleString()}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Current EK Points</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#16a34a" }}>
            {summary.totalEarned.toLocaleString()}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Total Earned</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#dc2626" }}>
            {summary.totalUsedOrExpired.toLocaleString()}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Redeemed / Expired</p>
        </div>

        <div style={metricCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "30px", color: "#0B3D91" }}>
            {summary.totalActivity}
          </h2>
          <p style={{ fontWeight: "bold", color: "#334155" }}>Rewards Activity</p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Rewards Information</h2>
        <div style={{ lineHeight: "1.8", color: "#334155" }}>
          <div><strong>Customer:</strong> {customer?.name || ""}</div>
          <div><strong>EKON ID:</strong> {customer?.ekonId || ""}</div>
          <div><strong>Current Points Balance:</strong> {summary.currentBalance.toLocaleString()}</div>
          <div><strong>Minimum Points to Redeem:</strong> 500</div>
          <div><strong>Maximum Points Balance:</strong> 1500</div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h2 style={{ marginTop: 0 }}>Search Rewards Activity</h2>

        <input
          type="text"
          placeholder="Search by action or date"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "10px" }}
        />
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Rewards History</h2>

        {loading ? (
          <p>Loading your rewards history...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table border="1" cellPadding="10" style={{ minWidth: "1100px", width: "100%" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>EKON ID</th>
                  <th>Action</th>
                  <th>Points</th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((record) => (
                    <tr key={record._id}>
                      <td>{formatDate(record.date || record.createdAt)}</td>
                      <td>{record.customerName}</td>
                      <td>{record.customerEkonId}</td>
                      <td>{record.action}</td>
                      <td style={getPointsStyle(record.points)}>
                        {Number(record.points || 0) > 0
                          ? `+${Number(record.points || 0).toLocaleString()}`
                          : Number(record.points || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No rewards activity found.</td>
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

export default MyRewards;