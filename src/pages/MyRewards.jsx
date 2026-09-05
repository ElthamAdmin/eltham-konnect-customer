import { useEffect, useMemo, useState } from "react";
import api from "../api";

function MyRewards() {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });

    const [pointsHistory, setPointsHistory] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const ROYAL_BLUE = "#0B3D91";
    const GOLD = "#F15A24";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

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

      const [profileRes, historyRes, referralRes] = await Promise.all([
  api.get("/api/customer-auth/me"),
  api.get("/api/customers/points-history"),
  api.get(`/api/referrals/customer/${savedCustomer.ekonId}`),
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
      setReferrals(referralRes.data?.data || []);
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
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return pointsHistory.filter((record) => {
      const searchableText = [
        record?.action,
        record?.customerName,
        record?.customerEkonId,
        record?.date,
        record?.createdAt,
        record?.points,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [pointsHistory, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / pageSize)
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageStart = (page - 1) * pageSize;

  const paginatedHistory = filteredHistory.slice(
    pageStart,
    pageStart + pageSize
  );

  const firstVisibleRecord =
    filteredHistory.length === 0 ? 0 : pageStart + 1;

  const lastVisibleRecord = Math.min(
    pageStart + pageSize,
    filteredHistory.length
  );

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
          fontSize: "30px",
          color: valueColor,
          marginBottom: "10px",
          fontWeight: "800",
          wordBreak: "break-word",
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
          <h1 style={{ margin: 0, color: TEXT, fontSize: "38px" }}>My Rewards</h1>
          <p style={{ margin: "6px 0 0 0", color: MUTED }}>
            Track your EK Points balance, earned rewards, and redemption history.
          </p>
        </div>

        <button
          onClick={fetchRewardsData}
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

      <div
        style={{
          ...cardStyle,
          marginBottom: "22px",
          background: `linear-gradient(135deg, ${ROYAL_BLUE}, #1f4fb0)`,
          color: WHITE,
          border: "none",
        }}
      >
        <div className="rewards-hero-grid">
          <div>
            <div
              style={{
                fontSize: "13px",
                opacity: 0.85,
                marginBottom: "10px",
                fontWeight: "700",
              }}
            >
              REWARDS OVERVIEW
            </div>

            <h2 style={{ marginTop: 0, marginBottom: "10px", fontSize: "30px" }}>
              Your EK Points
            </h2>

            <div style={{ lineHeight: 1.8 }}>
              <div><strong>Customer:</strong> {customer?.name || ""}</div>
              <div><strong>EKON ID:</strong> {customer?.ekonId || ""}</div>
              <div><strong>Minimum Points to Redeem:</strong> 500</div>
              <div><strong>Maximum Points Balance:</strong> 1500</div>
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
            <div
              style={{
                fontSize: "13px",
                fontWeight: "700",
                opacity: 0.9,
                marginBottom: "10px",
              }}
            >
              CURRENT BALANCE
            </div>

            <div
              style={{
                fontSize: "38px",
                fontWeight: "800",
                color: GOLD,
                marginBottom: "8px",
              }}
            >
              {summary.currentBalance.toLocaleString()}
            </div>

            <div style={{ fontSize: "14px", opacity: 0.95 }}>
              EK Points available
            </div>

            <div style={{ fontSize: "13px", marginTop: "10px", opacity: 0.85 }}>
              1 EK Point = JMD $1
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "22px" }}>
  <h2 style={{ marginTop: 0, color: TEXT }}>My Referral Code</h2>

  <p style={{ color: MUTED }}>
    Share your referral code with someone. When they sign up with your code and their first package arrives at our warehouse, you earn 100 EK Points and they earn 150 EK Points.
  </p>

  {referrals.find((item) => item.referrerEkonId === customer?.ekonId && item.status === "Active") ? (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          backgroundColor: "#eef4ff",
          border: `1px solid ${BORDER}`,
          borderRadius: "12px",
          padding: "14px 18px",
          fontSize: "24px",
          fontWeight: "800",
          color: ROYAL_BLUE,
          letterSpacing: "1px",
        }}
      >
        {
          referrals.find(
            (item) => item.referrerEkonId === customer?.ekonId && item.status === "Active"
          )?.referralCode
        }
      </div>

      <button
        onClick={() => {
          const activeReferral = referrals.find(
            (item) => item.referrerEkonId === customer?.ekonId && item.status === "Active"
          );
          navigator.clipboard.writeText(activeReferral?.referralCode || "");
          alert("Referral code copied.");
        }}
        style={{
          backgroundColor: GOLD,
          color: "black",
          border: "none",
          padding: "12px 16px",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Copy Code
      </button>
    </div>
  ) : (
    <button
      onClick={async () => {
        try {
          const res = await api.post("/api/referrals/create", {
            ekonId: customer?.ekonId,
          });

          alert(res.data.message || "Referral code created.");
          await fetchRewardsData();
        } catch (error) {
          alert(error?.response?.data?.message || "Could not create referral code.");
        }
      }}
      style={{
        backgroundColor: ROYAL_BLUE,
        color: WHITE,
        border: "none",
        padding: "12px 16px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Generate My Referral Code
    </button>
  )}
</div>

      <div className="rewards-summary-grid">
                {summaryCard(
          summary.currentBalance.toLocaleString(),
          "Current EK Points",
          GOLD,
          "#fff7ed"
        )}
        {summaryCard(
          summary.totalEarned.toLocaleString(),
          "Total Earned",
          "#16a34a",
          "#effcf4"
        )}
        {summaryCard(
          summary.totalUsedOrExpired.toLocaleString(),
          "Redeemed / Expired",
          "#dc2626",
          "#fff3f2"
        )}
        {summaryCard(
          summary.totalActivity,
          "Rewards Activity",
          ROYAL_BLUE,
          "#f2f7ff"
        )}
      </div>

      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "6px", color: TEXT }}>
            Search Rewards Activity
          </h2>
          <p style={{ margin: 0, color: MUTED, fontSize: "14px" }}>
            Search by action, EKON ID, customer name, or date.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search rewards activity"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: `1px solid ${BORDER}`,
            backgroundColor: WHITE,
          }}
        />
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
              Rewards History
            </h2>
                        <p
              style={{
                margin: 0,
                color: MUTED,
                fontSize: "14px",
              }}
            >
              Showing {firstVisibleRecord} to{" "}
              {lastVisibleRecord} of{" "}
              {filteredHistory.length} matched reward{" "}
              {filteredHistory.length === 1
                ? "activity"
                : "activities"}.
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: MUTED, margin: 0 }}>Loading your rewards history...</p>
        ) : (
          <>
            <div className="rewards-table" style={{ overflowX: "auto" }}>
              <table
                border="1"
                cellPadding="12"
                style={{
                  minWidth: "1100px",
                  width: "100%",
                  borderCollapse: "collapse",
                  borderColor: BORDER,
                }}
              >
                <thead style={{ backgroundColor: "#eef4ff" }}>
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
                    paginatedHistory.map((record) => (
                      <tr key={record._id} style={{ backgroundColor: WHITE }}>
                        <td>{formatDate(record.date || record.createdAt)}</td>
                        <td>{record.customerName}</td>
                        <td>{record.customerEkonId}</td>
                        <td style={{ color: TEXT, fontWeight: "600" }}>
                          {record.action}
                        </td>
                        <td style={getPointsStyle(record.points)}>
                          {Number(record.points || 0) > 0
                            ? `+${Number(record.points || 0).toLocaleString()}`
                            : Number(record.points || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", color: MUTED, padding: "20px" }}
                      >
                        No rewards activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rewards-mobile">
              {filteredHistory.length > 0 ? (
                paginatedHistory.map((record) => (
                  <div
                    key={record._id}
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: "16px",
                      padding: "16px",
                      marginBottom: "12px",
                      backgroundColor: WHITE,
                      boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div style={{ display: "grid", gap: "10px" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Date</div>
                        <div>{formatDate(record.date || record.createdAt)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Action</div>
                        <div style={{ fontWeight: "700", color: TEXT }}>
                          {record.action}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: MUTED }}>Points</div>
                        <div style={getPointsStyle(record.points)}>
                          {Number(record.points || 0) > 0
                            ? `+${Number(record.points || 0).toLocaleString()}`
                            : Number(record.points || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
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
                  No rewards activity found.
                </div>
              )}
                        </div>

            {filteredHistory.length > 0 && (
              <div className="rewards-pagination">
                <div className="rewards-page-size">
                  <label htmlFor="rewards-page-size">
                    Rows:
                  </label>

                  <select
                    id="rewards-page-size"
                    value={pageSize}
                    onChange={(event) =>
                      setPageSize(Number(event.target.value))
                    }
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="rewards-page-status">
                  Page {page} of {totalPages}
                </div>

                <div className="rewards-page-buttons">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((currentPage) =>
                        Math.max(1, currentPage - 1)
                      )
                    }
                    disabled={page === 1}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((currentPage) =>
                        Math.min(
                          totalPages,
                          currentPage + 1
                        )
                      )
                    }
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

            <style>
        {`
          .rewards-summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 20px;
            margin-bottom: 24px;
          }

          .rewards-summary-grid > div {
            min-width: 0;
          }

          .rewards-hero-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 18px;
            align-items: stretch;
          }

          .rewards-table {
            overflow-x: auto;
            border: 1px solid #dbe3ef;
            border-radius: 12px;
          }

          .rewards-table table {
            border: 0 !important;
          }

          .rewards-table th,
          .rewards-table td {
            border-color: #dbe3ef;
            text-align: left;
          }

          .rewards-table th {
            color: #0B3D91;
            font-size: 13px;
            white-space: nowrap;
          }

          .rewards-mobile {
            display: none;
          }

          .rewards-pagination {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 16px;
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid #dbe3ef;
          }

          .rewards-page-size {
            display: flex;
            align-items: center;
            gap: 8px;
            justify-self: start;
          }

          .rewards-page-size label {
            color: #64748b;
            font-size: 13px;
            font-weight: 700;
          }

          .rewards-page-size select {
            padding: 9px 28px 9px 10px;
            border: 1px solid #dbe3ef;
            border-radius: 9px;
            background: #ffffff;
            color: #0f172a;
          }

          .rewards-page-status {
            color: #334155;
            font-size: 13px;
            font-weight: 800;
            text-align: center;
          }

          .rewards-page-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            justify-self: end;
          }

          .rewards-page-buttons button {
            min-width: 82px;
            padding: 9px 13px;
            border: 0;
            border-radius: 9px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .rewards-page-buttons button:disabled {
            background: #e2e8f0;
            color: #64748b;
            cursor: not-allowed;
          }

          .rewards-page-buttons button:not(:disabled):hover {
            background: #082f70;
          }

          .rewards-page-buttons button:focus-visible,
          .rewards-page-size select:focus-visible {
            outline: 3px solid rgba(241, 90, 36, 0.3);
            outline-offset: 2px;
          }

          @media (max-width: 900px) {
            .rewards-summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .rewards-hero-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .rewards-pagination {
              grid-template-columns: 1fr;
            }

            .rewards-page-size,
            .rewards-page-status,
            .rewards-page-buttons {
              width: 100%;
              justify-self: stretch;
            }

            .rewards-page-size {
              justify-content: center;
            }

            .rewards-page-buttons button {
              flex: 1;
            }
          }

          @media (max-width: 600px) {
            .rewards-summary-grid {
              grid-template-columns: 1fr;
              gap: 14px;
            }

            .rewards-table {
              display: none;
            }

            .rewards-mobile {
              display: block;
            }
          }

          @media (max-width: 420px) {
            .rewards-page-buttons {
              flex-direction: column;
            }

            .rewards-page-buttons button {
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}

export default MyRewards;