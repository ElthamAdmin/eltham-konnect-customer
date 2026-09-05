import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
} from "lucide-react";
import api from "../api";

function MyMarketplaceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const ROYAL_BLUE = "#0B3D91";
  const ORANGE = "#F15A24";
  const WHITE = "#ffffff";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await api.get(
        "/api/marketplace-orders/my-orders"
      );

      setOrders(
        Array.isArray(res.data?.data)
          ? res.data.data
          : []
      );
    } catch (error) {
      console.error(
        "Could not load Marketplace orders:",
        error
      );

      setOrders([]);

      setErrorMessage(
        error?.response?.data?.message ||
          "Could not load your Marketplace orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const statusOptions = useMemo(() => {
    const availableStatuses = orders
      .map((order) => order?.status)
      .filter(Boolean);

    return [
      "All",
      ...new Set(availableStatuses),
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "All" ||
        order?.status === statusFilter;

      const itemText = Array.isArray(order?.items)
        ? order.items
            .map((item) =>
              [
                item?.title,
                item?.itemNumber,
                item?.quantity,
              ]
                .filter(Boolean)
                .join(" ")
            )
            .join(" ")
        : "";

      const searchableText = [
        order?.orderNumber,
        order?.status,
        order?.createdAt,
        order?.subtotal,
        itemText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        searchableText.includes(normalizedSearch)
      );
    });
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / pageSize)
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageStart = (page - 1) * pageSize;

  const paginatedOrders = filteredOrders.slice(
    pageStart,
    pageStart + pageSize
  );

  const firstVisibleOrder =
    filteredOrders.length === 0 ? 0 : pageStart + 1;

  const lastVisibleOrder = Math.min(
    pageStart + pageSize,
    filteredOrders.length
  );

  const orderSummary = useMemo(() => {
    const totalValue = orders.reduce(
      (total, order) =>
        total + Number(order?.subtotal || 0),
      0
    );

    const activeOrders = orders.filter((order) => {
      const normalizedStatus = String(
        order?.status || ""
      ).toLowerCase();

      return ![
        "completed",
        "delivered",
        "cancelled",
        "canceled",
      ].includes(normalizedStatus);
    }).length;

    const completedOrders = orders.filter((order) => {
      const normalizedStatus = String(
        order?.status || ""
      ).toLowerCase();

      return [
        "completed",
        "delivered",
      ].includes(normalizedStatus);
    }).length;

    return {
      totalOrders: orders.length,
      activeOrders,
      completedOrders,
      totalValue,
    };
  }, [orders]);

  const money = (value) =>
    `JMD ${Number(value || 0).toLocaleString(
      "en-JM",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  const formatDate = (value) => {
    if (!value) {
      return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  };

  const getStatusStyle = (status) => {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (
      ["completed", "delivered"].includes(
        normalizedStatus
      )
    ) {
      return {
        backgroundColor: "#dcfce7",
        color: "#166534",
        borderColor: "#bbf7d0",
      };
    }

    if (
      ["cancelled", "canceled"].includes(
        normalizedStatus
      )
    ) {
      return {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        borderColor: "#fecaca",
      };
    }

    if (
      ["processing", "confirmed"].includes(
        normalizedStatus
      )
    ) {
      return {
        backgroundColor: "#dbeafe",
        color: "#1e40af",
        borderColor: "#bfdbfe",
      };
    }

    if (
      ["ready", "ready for pickup"].includes(
        normalizedStatus
      )
    ) {
      return {
        backgroundColor: "#f0fdf4",
        color: "#15803d",
        borderColor: "#bbf7d0",
      };
    }

    return {
      backgroundColor: "#fff7ed",
      color: "#9a3412",
      borderColor: "#fed7aa",
    };
  };

  const summaryCards = [
    {
      label: "Total Orders",
      value: orderSummary.totalOrders,
      color: ROYAL_BLUE,
      background: "#eef4ff",
      icon: ShoppingBag,
    },
    {
      label: "Active Orders",
      value: orderSummary.activeOrders,
      color: ORANGE,
      background: "#fff7ed",
      icon: Clock3,
    },
    {
      label: "Completed",
      value: orderSummary.completedOrders,
      color: "#16a34a",
      background: "#f0fdf4",
      icon: PackageCheck,
    },
    {
      label: "Total Order Value",
      value: money(orderSummary.totalValue),
      color: ROYAL_BLUE,
      background: "#f8fafc",
      icon: Box,
    },
  ];

  return (
    <div className="market-orders-page">
      <div className="market-orders-header">
        <div>
          <div className="market-orders-title">
            <ShoppingBag
              size={33}
              color={ROYAL_BLUE}
              strokeWidth={2.2}
            />

            <h1>My Marketplace Orders</h1>
          </div>

          <p>
            Track your EK Marketplace purchases and
            order requests.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="market-orders-refresh"
        >
          <RefreshCw size={17} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="market-orders-summary">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              style={{
                background: `linear-gradient(180deg, ${WHITE}, ${card.background})`,
              }}
            >
              <div
                className="market-orders-summary-icon"
                style={{
                  backgroundColor: card.background,
                  color: card.color,
                }}
              >
                <Icon size={21} />
              </div>

              <strong style={{ color: card.color }}>
                {card.value}
              </strong>

              <span>{card.label}</span>
            </div>
          );
        })}
      </div>

      <section className="market-orders-controls">
        <div>
          <h2>Search & Filter</h2>

          <p>
            Find orders by order number, product,
            status, or date.
          </p>
        </div>

        <div className="market-orders-filter-grid">
          <div className="market-orders-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search Marketplace orders"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter by order status"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "All"
                  ? "All Statuses"
                  : status}
              </option>
            ))}
          </select>
        </div>
      </section>

      {errorMessage && (
        <div className="market-orders-error">
          <div>
            <strong>Orders could not be loaded</strong>
            <span>{errorMessage}</span>
          </div>

          <button
            type="button"
            onClick={fetchOrders}
          >
            Try Again
          </button>
        </div>
      )}

      <section className="market-orders-records">
        <div className="market-orders-records-header">
          <div>
            <h2>Order Records</h2>

            <p>
              Showing {firstVisibleOrder} to{" "}
              {lastVisibleOrder} of{" "}
              {filteredOrders.length} matched orders.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="market-orders-empty">
            <RefreshCw
              size={28}
              className="market-orders-spinner"
            />

            <strong>
              Loading your Marketplace orders...
            </strong>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="market-orders-empty">
            <ShoppingBag size={32} />

            <strong>
              {orders.length === 0
                ? "You have not submitted any Marketplace orders yet."
                : "No Marketplace orders match your search."}
            </strong>

            {orders.length > 0 && (
              <span>
                Try another search or select a
                different status.
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="market-orders-list">
              {paginatedOrders.map((order) => {
                const statusStyle = getStatusStyle(
                  order.status
                );

                return (
                  <article
                    key={
                      order._id ||
                      order.orderNumber
                    }
                    className="market-order-card"
                  >
                    <div className="market-order-top">
                      <div>
                        <div className="market-order-number">
                          {order.orderNumber ||
                            "Marketplace Order"}
                        </div>

                        <div className="market-order-date">
                          <Clock3 size={14} />
                          {formatDate(order.createdAt)}
                        </div>
                      </div>

                      <div
                        className="market-order-status"
                        style={statusStyle}
                      >
                        {order.status || "Pending"}
                      </div>
                    </div>

                    <div className="market-order-items">
                      {(order.items || []).length >
                      0 ? (
                        order.items.map(
                          (item, index) => (
                            <div
                              key={
                                item.itemNumber ||
                                `${order.orderNumber}-${index}`
                              }
                              className="market-order-item"
                            >
                              <div>
                                <strong>
                                  {item.title ||
                                    "Marketplace Item"}
                                </strong>

                                <span>
                                  Item:{" "}
                                  {item.itemNumber ||
                                    "N/A"}{" "}
                                  · Qty:{" "}
                                  {Number(
                                    item.quantity || 0
                                  )}
                                </span>
                              </div>

                              <strong>
                                {money(item.lineTotal)}
                              </strong>
                            </div>
                          )
                        )
                      ) : (
                        <div className="market-order-no-items">
                          No item details are available
                          for this order.
                        </div>
                      )}
                    </div>

                    <div className="market-order-total">
                      <span>Order Total</span>
                      <strong>
                        {money(order.subtotal)}
                      </strong>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="market-orders-pagination">
              <div className="market-orders-page-size">
                <label htmlFor="market-orders-page-size">
                  Orders:
                </label>

                <select
                  id="market-orders-page-size"
                  value={pageSize}
                  onChange={(event) =>
                    setPageSize(
                      Number(event.target.value)
                    )
                  }
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="market-orders-page-status">
                Page {page} of {totalPages}
              </div>

              <div className="market-orders-page-buttons">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.max(
                        1,
                        currentPage - 1
                      )
                    )
                  }
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.min(
                        totalPages,
                        currentPage + 1
                      )
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <style>
        {`
          .market-orders-page {
            min-height: 100%;
          }

          .market-orders-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 22px;
          }

          .market-orders-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .market-orders-title h1 {
            margin: 0;
            color: #0f172a;
            font-size: 36px;
            line-height: 1.15;
          }

          .market-orders-header p {
            margin: 7px 0 0;
            color: #64748b;
            line-height: 1.5;
          }

          .market-orders-refresh {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-width: 120px;
            padding: 11px 15px;
            border: 0;
            border-radius: 9px;
            background: #16a34a;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .market-orders-refresh:disabled {
            opacity: 0.65;
            cursor: wait;
          }

          .market-orders-summary {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 22px;
          }

          .market-orders-summary > div {
            position: relative;
            min-width: 0;
            min-height: 120px;
            padding: 18px;
            border: 1px solid #dbe3ef;
            border-radius: 15px;
          }

          .market-orders-summary-icon {
            position: absolute;
            top: 15px;
            right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 39px;
            height: 39px;
            border-radius: 10px;
          }

          .market-orders-summary strong,
          .market-orders-summary span {
            display: block;
          }

          .market-orders-summary > div > strong {
            max-width: calc(100% - 45px);
            margin-top: 10px;
            font-size: 25px;
            line-height: 1.2;
            overflow-wrap: anywhere;
          }

          .market-orders-summary > div > span {
            margin-top: 10px;
            color: #334155;
            font-weight: 800;
          }

          .market-orders-controls,
          .market-orders-records {
            margin-bottom: 20px;
            padding: 19px;
            border: 1px solid #dbe3ef;
            border-radius: 16px;
            background: #ffffff;
          }

          .market-orders-controls h2,
          .market-orders-records h2 {
            margin: 0;
            color: #0f172a;
          }

          .market-orders-controls p,
          .market-orders-records p {
            margin: 5px 0 0;
            color: #64748b;
            font-size: 13px;
          }

          .market-orders-filter-grid {
            display: grid;
            grid-template-columns: 1fr 280px;
            gap: 12px;
            margin-top: 15px;
          }

          .market-orders-search {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 0 13px;
            border: 1px solid #dbe3ef;
            border-radius: 10px;
            color: #64748b;
          }

          .market-orders-search:focus-within {
            border-color: #0B3D91;
            box-shadow:
              0 0 0 3px rgba(11, 61, 145, 0.1);
          }

          .market-orders-search input {
            width: 100%;
            padding: 12px 0;
            border: 0;
            outline: 0;
            background: transparent;
          }

          .market-orders-filter-grid > select {
            padding: 12px;
            border: 1px solid #dbe3ef;
            border-radius: 10px;
            background: #ffffff;
          }

          .market-orders-error {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 20px;
            padding: 14px 16px;
            border: 1px solid #fecaca;
            border-radius: 12px;
            background: #fef2f2;
            color: #991b1b;
          }

          .market-orders-error div {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .market-orders-error button {
            padding: 9px 14px;
            border: 0;
            border-radius: 8px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .market-orders-records-header {
            margin-bottom: 16px;
          }

          .market-orders-list {
            display: grid;
            gap: 15px;
          }

          .market-order-card {
            overflow: hidden;
            border: 1px solid #dbe3ef;
            border-radius: 15px;
            background: #ffffff;
          }

          .market-order-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            padding: 16px;
            background: #f8fafc;
            border-bottom: 1px solid #dbe3ef;
          }

          .market-order-number {
            color: #0B3D91;
            font-size: 17px;
            font-weight: 900;
            overflow-wrap: anywhere;
          }

          .market-order-date {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 6px;
            color: #64748b;
            font-size: 13px;
          }

          .market-order-status {
            flex-shrink: 0;
            padding: 7px 11px;
            border: 1px solid;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 900;
          }

          .market-order-items {
            display: grid;
            padding: 0 16px;
          }

          .market-order-item {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
            padding: 14px 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .market-order-item:last-child {
            border-bottom: 0;
          }

          .market-order-item > div {
            min-width: 0;
          }

          .market-order-item strong,
          .market-order-item span {
            display: block;
          }

          .market-order-item > div > strong {
            color: #0f172a;
            overflow-wrap: anywhere;
          }

          .market-order-item span {
            margin-top: 5px;
            color: #64748b;
            font-size: 12px;
          }

          .market-order-item > strong {
            flex-shrink: 0;
            color: #0f172a;
            text-align: right;
          }

          .market-order-no-items {
            padding: 15px 0;
            color: #64748b;
          }

          .market-order-total {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 14px;
            padding: 14px 16px;
            border-top: 1px solid #dbe3ef;
            background: #eef4ff;
          }

          .market-order-total span {
            color: #64748b;
            font-size: 13px;
            font-weight: 800;
          }

          .market-order-total strong {
            color: #0B3D91;
            font-size: 19px;
          }

          .market-orders-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 9px;
            min-height: 180px;
            color: #64748b;
            text-align: center;
          }

          .market-orders-empty strong {
            color: #0f172a;
          }

          .market-orders-spinner {
            animation: market-orders-spin 1s linear
              infinite;
          }

          @keyframes market-orders-spin {
            to {
              transform: rotate(360deg);
            }
          }

          .market-orders-pagination {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 16px;
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid #dbe3ef;
          }

          .market-orders-page-size {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .market-orders-page-size label {
            color: #64748b;
            font-size: 13px;
            font-weight: 800;
          }

          .market-orders-page-size select {
            padding: 9px 28px 9px 10px;
            border: 1px solid #dbe3ef;
            border-radius: 9px;
            background: #ffffff;
          }

          .market-orders-page-status {
            color: #334155;
            font-size: 13px;
            font-weight: 800;
            text-align: center;
          }

          .market-orders-page-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }

          .market-orders-page-buttons button {
            min-width: 82px;
            padding: 9px 13px;
            border: 0;
            border-radius: 9px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .market-orders-page-buttons button:disabled {
            background: #e2e8f0;
            color: #64748b;
            cursor: not-allowed;
          }

          @media (max-width: 1000px) {
            .market-orders-summary {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 700px) {
            .market-orders-header {
              flex-direction: column;
            }

            .market-orders-title {
              align-items: flex-start;
            }

            .market-orders-title h1 {
              font-size: 30px;
            }

            .market-orders-refresh {
              width: 100%;
            }

            .market-orders-summary {
              grid-template-columns: 1fr;
              gap: 13px;
            }

            .market-orders-filter-grid {
              grid-template-columns: 1fr;
            }

            .market-order-top,
            .market-order-item {
              flex-direction: column;
            }

            .market-order-status {
              align-self: flex-start;
            }

            .market-order-item > strong {
              text-align: left;
            }

            .market-order-total {
              align-items: flex-start;
              flex-direction: column;
              gap: 5px;
            }

            .market-orders-pagination {
              grid-template-columns: 1fr;
            }

            .market-orders-page-size,
            .market-orders-page-buttons {
              justify-content: center;
            }

            .market-orders-page-buttons button {
              flex: 1;
            }

            .market-orders-error {
              align-items: stretch;
              flex-direction: column;
            }
          }

          @media (max-width: 420px) {
            .market-orders-title h1 {
              font-size: 27px;
            }

            .market-orders-controls,
            .market-orders-records {
              padding: 15px;
            }

            .market-orders-page-buttons {
              flex-direction: column;
            }

            .market-orders-page-buttons button {
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}

export default MyMarketplaceOrders;