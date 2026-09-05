import { useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  Clock3,
  FileText,
  Receipt,
  RefreshCw,
  Search,
} from "lucide-react";
import api from "../api";

function MyMarketplaceInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const ROYAL_BLUE = "#0B3D91";
  const ORANGE = "#F15A24";
  const MUTED = "#64748b";

  const fetchInvoices = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await api.get(
        "/api/marketplace-invoices/my-invoices"
      );

      setInvoices(
        Array.isArray(res.data?.data)
          ? res.data.data
          : []
      );
    } catch (error) {
      console.error(
        "Could not load Marketplace invoices:",
        error
      );

      setInvoices([]);

      setErrorMessage(
        error?.response?.data?.message ||
          "Could not load your Marketplace invoices."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const isPaidInvoice = (invoice) =>
    String(invoice?.status || "")
      .trim()
      .toLowerCase() === "paid";

  const statusOptions = useMemo(() => {
    const availableStatuses = invoices
      .map((invoice) => invoice?.status)
      .filter(Boolean);

    return [
      "All",
      ...new Set(availableStatuses),
    ];
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return invoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === "All" ||
        invoice?.status === statusFilter;

      const itemText = Array.isArray(invoice?.items)
        ? invoice.items
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
        invoice?.invoiceNumber,
        invoice?.orderNumber,
        invoice?.status,
        invoice?.createdAt,
        invoice?.finalTotal,
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
  }, [
    invoices,
    searchTerm,
    statusFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / pageSize)
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageStart = (page - 1) * pageSize;

  const paginatedInvoices = filteredInvoices.slice(
    pageStart,
    pageStart + pageSize
  );

  const firstVisibleInvoice =
    filteredInvoices.length === 0
      ? 0
      : pageStart + 1;

  const lastVisibleInvoice = Math.min(
    pageStart + pageSize,
    filteredInvoices.length
  );

  const summary = useMemo(() => {
    const paidInvoices = invoices.filter(
      isPaidInvoice
    );

    const unpaidInvoices = invoices.filter(
      (invoice) => !isPaidInvoice(invoice)
    );

    const totalPaid = paidInvoices.reduce(
      (total, invoice) =>
        total + Number(invoice?.finalTotal || 0),
      0
    );

    const outstanding = unpaidInvoices.reduce(
      (total, invoice) =>
        total + Number(invoice?.finalTotal || 0),
      0
    );

    return {
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      unpaidInvoices: unpaidInvoices.length,
      totalPaid,
      outstanding,
    };
  }, [invoices]);

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

    if (normalizedStatus === "paid") {
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

    return {
      backgroundColor: "#fff7ed",
      color: "#9a3412",
      borderColor: "#fed7aa",
    };
  };

  const summaryCards = [
    {
      label: "Total Invoices",
      value: summary.totalInvoices,
      color: ROYAL_BLUE,
      background: "#eef4ff",
      icon: FileText,
    },
    {
      label: "Unpaid",
      value: summary.unpaidInvoices,
      color: "#dc2626",
      background: "#fef2f2",
      icon: Clock3,
    },
    {
      label: "Paid",
      value: summary.paidInvoices,
      color: "#16a34a",
      background: "#f0fdf4",
      icon: Receipt,
    },
    {
      label: "Outstanding",
      value: money(summary.outstanding),
      color: ORANGE,
      background: "#fff7ed",
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="market-invoices-page">
      <div className="market-invoices-header">
        <div>
          <div className="market-invoices-title">
            <Receipt
              size={33}
              color={ROYAL_BLUE}
              strokeWidth={2.2}
            />

            <h1>My Marketplace Invoices</h1>
          </div>

          <p>
            View and pay invoices for EK Marketplace
            purchases.
          </p>
        </div>

        <button
          type="button"
          className="market-invoices-refresh"
          onClick={fetchInvoices}
          disabled={loading}
        >
          <RefreshCw size={17} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="market-invoices-summary">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              style={{
                background: `linear-gradient(180deg, #ffffff, ${card.background})`,
              }}
            >
              <div
                className="market-invoices-summary-icon"
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

      <section className="market-invoices-controls">
        <div>
          <h2>Search & Filter</h2>

          <p>
            Find invoices by invoice number, order,
            product, status, or date.
          </p>
        </div>

        <div className="market-invoices-filter-grid">
          <div className="market-invoices-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search Marketplace invoices"
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
            aria-label="Filter invoices by status"
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
        <div className="market-invoices-error">
          <div>
            <strong>
              Invoices could not be loaded
            </strong>

            <span>{errorMessage}</span>
          </div>

          <button
            type="button"
            onClick={fetchInvoices}
          >
            Try Again
          </button>
        </div>
      )}

      <section className="market-invoices-records">
        <div className="market-invoices-records-header">
          <h2>Invoice Records</h2>

          <p>
            Showing {firstVisibleInvoice} to{" "}
            {lastVisibleInvoice} of{" "}
            {filteredInvoices.length} matched
            invoices.
          </p>
        </div>

        {loading ? (
          <div className="market-invoices-empty">
            <RefreshCw
              size={28}
              className="market-invoices-spinner"
            />

            <strong>
              Loading your Marketplace invoices...
            </strong>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="market-invoices-empty">
            <Receipt size={32} />

            <strong>
              {invoices.length === 0
                ? "No Marketplace invoices found."
                : "No Marketplace invoices match your search."}
            </strong>

            {invoices.length > 0 && (
              <span>
                Try another search or select a
                different payment status.
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="market-invoices-list">
              {paginatedInvoices.map((invoice) => {
                const paid =
                  isPaidInvoice(invoice);

                const statusStyle = getStatusStyle(
                  invoice.status
                );

                return (
                  <article
                    key={
                      invoice._id ||
                      invoice.invoiceNumber
                    }
                    className="market-invoice-card"
                  >
                    <div className="market-invoice-top">
                      <div>
                        <div className="market-invoice-number">
                          {invoice.invoiceNumber ||
                            "Marketplace Invoice"}
                        </div>

                        <div className="market-invoice-order">
                          Order:{" "}
                          {invoice.orderNumber ||
                            "Not available"}
                        </div>

                        <div className="market-invoice-date">
                          <Clock3 size={14} />
                          {formatDate(
                            invoice.createdAt
                          )}
                        </div>
                      </div>

                      <div className="market-invoice-top-right">
                        <div
                          className="market-invoice-status"
                          style={statusStyle}
                        >
                          {invoice.status ||
                            "Unpaid"}
                        </div>

                        <strong>
                          {money(
                            invoice.finalTotal
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="market-invoice-items">
                      {(invoice.items || []).length >
                      0 ? (
                        invoice.items.map(
                          (item, index) => (
                            <div
                              key={
                                item.itemNumber ||
                                `${invoice.invoiceNumber}-${index}`
                              }
                              className="market-invoice-item"
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
                                {money(
                                  item.lineTotal
                                )}
                              </strong>
                            </div>
                          )
                        )
                      ) : (
                        <div className="market-invoice-no-items">
                          No item details are available
                          for this invoice.
                        </div>
                      )}
                    </div>

                    <div className="market-invoice-footer">
                      <div>
                        <span>Invoice Total</span>
                        <strong>
                          {money(
                            invoice.finalTotal
                          )}
                        </strong>
                      </div>

                      {paid ? (
                        <div className="market-invoice-paid">
                          <Receipt size={17} />
                          Paid Successfully
                        </div>
                      ) : invoice.paymentLink ? (
                        <a
                          href={invoice.paymentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="market-invoice-pay"
                        >
                          <CircleDollarSign
                            size={17}
                          />
                          Pay Now
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="market-invoice-pending"
                        >
                          <Clock3 size={17} />
                          Payment Link Pending
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="market-invoices-pagination">
              <div className="market-invoices-page-size">
                <label htmlFor="market-invoices-page-size">
                  Invoices:
                </label>

                <select
                  id="market-invoices-page-size"
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

              <div className="market-invoices-page-status">
                Page {page} of {totalPages}
              </div>

              <div className="market-invoices-page-buttons">
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
          .market-invoices-page {
            min-height: 100%;
          }

          .market-invoices-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 22px;
          }

          .market-invoices-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .market-invoices-title h1 {
            margin: 0;
            color: #0f172a;
            font-size: 36px;
            line-height: 1.15;
          }

          .market-invoices-header p {
            margin: 7px 0 0;
            color: #64748b;
            line-height: 1.5;
          }

          .market-invoices-refresh {
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

          .market-invoices-refresh:disabled {
            opacity: 0.65;
            cursor: wait;
          }

          .market-invoices-summary {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 22px;
          }

          .market-invoices-summary > div {
            position: relative;
            min-width: 0;
            min-height: 120px;
            padding: 18px;
            border: 1px solid #dbe3ef;
            border-radius: 15px;
          }

          .market-invoices-summary-icon {
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

          .market-invoices-summary strong,
          .market-invoices-summary span {
            display: block;
          }

          .market-invoices-summary > div > strong {
            max-width: calc(100% - 45px);
            margin-top: 10px;
            font-size: 25px;
            line-height: 1.2;
            overflow-wrap: anywhere;
          }

          .market-invoices-summary > div > span {
            margin-top: 10px;
            color: #334155;
            font-weight: 800;
          }

          .market-invoices-controls,
          .market-invoices-records {
            margin-bottom: 20px;
            padding: 19px;
            border: 1px solid #dbe3ef;
            border-radius: 16px;
            background: #ffffff;
          }

          .market-invoices-controls h2,
          .market-invoices-records h2 {
            margin: 0;
            color: #0f172a;
          }

          .market-invoices-controls p,
          .market-invoices-records p {
            margin: 5px 0 0;
            color: #64748b;
            font-size: 13px;
          }

          .market-invoices-filter-grid {
            display: grid;
            grid-template-columns: 1fr 280px;
            gap: 12px;
            margin-top: 15px;
          }

          .market-invoices-search {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 0 13px;
            border: 1px solid #dbe3ef;
            border-radius: 10px;
            color: #64748b;
          }

          .market-invoices-search:focus-within {
            border-color: #0B3D91;
            box-shadow:
              0 0 0 3px rgba(11, 61, 145, 0.1);
          }

          .market-invoices-search input {
            width: 100%;
            padding: 12px 0;
            border: 0;
            outline: 0;
            background: transparent;
          }

          .market-invoices-filter-grid > select {
            padding: 12px;
            border: 1px solid #dbe3ef;
            border-radius: 10px;
            background: #ffffff;
          }

          .market-invoices-error {
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

          .market-invoices-error div {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .market-invoices-error button {
            padding: 9px 14px;
            border: 0;
            border-radius: 8px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .market-invoices-records-header {
            margin-bottom: 16px;
          }

          .market-invoices-list {
            display: grid;
            gap: 15px;
          }

          .market-invoice-card {
            overflow: hidden;
            border: 1px solid #dbe3ef;
            border-radius: 15px;
            background: #ffffff;
          }

          .market-invoice-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            padding: 16px;
            border-bottom: 1px solid #dbe3ef;
            background: #f8fafc;
          }

          .market-invoice-number {
            color: #0B3D91;
            font-size: 17px;
            font-weight: 900;
            overflow-wrap: anywhere;
          }

          .market-invoice-order,
          .market-invoice-date {
            margin-top: 5px;
            color: #64748b;
            font-size: 13px;
          }

          .market-invoice-date {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .market-invoice-top-right {
            text-align: right;
          }

          .market-invoice-top-right > strong {
            display: block;
            margin-top: 9px;
            color: #0f172a;
            font-size: 21px;
          }

          .market-invoice-status {
            display: inline-block;
            padding: 7px 11px;
            border: 1px solid;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 900;
          }

          .market-invoice-items {
            display: grid;
            padding: 0 16px;
          }

          .market-invoice-item {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
            padding: 14px 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .market-invoice-item:last-child {
            border-bottom: 0;
          }

          .market-invoice-item > div {
            min-width: 0;
          }

          .market-invoice-item strong,
          .market-invoice-item span {
            display: block;
          }

          .market-invoice-item > div > strong {
            color: #0f172a;
            overflow-wrap: anywhere;
          }

          .market-invoice-item span {
            margin-top: 5px;
            color: #64748b;
            font-size: 12px;
          }

          .market-invoice-item > strong {
            flex-shrink: 0;
            color: #0f172a;
            text-align: right;
          }

          .market-invoice-no-items {
            padding: 15px 0;
            color: #64748b;
          }

          .market-invoice-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 14px 16px;
            border-top: 1px solid #dbe3ef;
            background: #eef4ff;
          }

          .market-invoice-footer > div:first-child span,
          .market-invoice-footer > div:first-child strong {
            display: block;
          }

          .market-invoice-footer > div:first-child span {
            color: #64748b;
            font-size: 12px;
            font-weight: 800;
          }

          .market-invoice-footer > div:first-child strong {
            margin-top: 4px;
            color: #0B3D91;
            font-size: 19px;
          }

          .market-invoice-paid,
          .market-invoice-pay,
          .market-invoice-pending {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 42px;
            padding: 10px 15px;
            border-radius: 10px;
            box-sizing: border-box;
            font-weight: 900;
            text-decoration: none;
          }

          .market-invoice-paid {
            background: #dcfce7;
            color: #166534;
          }

          .market-invoice-pay {
            background: #F15A24;
            color: #ffffff;
          }

          .market-invoice-pending {
            border: 0;
            background: #cbd5e1;
            color: #475569;
            cursor: not-allowed;
          }

          .market-invoices-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 9px;
            min-height: 180px;
            color: #64748b;
            text-align: center;
          }

          .market-invoices-empty strong {
            color: #0f172a;
          }

          .market-invoices-spinner {
            animation: market-invoice-spin 1s linear
              infinite;
          }

          @keyframes market-invoice-spin {
            to {
              transform: rotate(360deg);
            }
          }

          .market-invoices-pagination {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 16px;
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid #dbe3ef;
          }

          .market-invoices-page-size {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .market-invoices-page-size label {
            color: #64748b;
            font-size: 13px;
            font-weight: 800;
          }

          .market-invoices-page-size select {
            padding: 9px 28px 9px 10px;
            border: 1px solid #dbe3ef;
            border-radius: 9px;
            background: #ffffff;
          }

          .market-invoices-page-status {
            color: #334155;
            font-size: 13px;
            font-weight: 800;
            text-align: center;
          }

          .market-invoices-page-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }

          .market-invoices-page-buttons button {
            min-width: 82px;
            padding: 9px 13px;
            border: 0;
            border-radius: 9px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .market-invoices-page-buttons button:disabled {
            background: #e2e8f0;
            color: #64748b;
            cursor: not-allowed;
          }

          @media (max-width: 1000px) {
            .market-invoices-summary {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 700px) {
            .market-invoices-header {
              flex-direction: column;
            }

            .market-invoices-title {
              align-items: flex-start;
            }

            .market-invoices-title h1 {
              font-size: 30px;
            }

            .market-invoices-refresh {
              width: 100%;
            }

            .market-invoices-summary {
              grid-template-columns: 1fr;
              gap: 13px;
            }

            .market-invoices-filter-grid {
              grid-template-columns: 1fr;
            }

            .market-invoice-top,
            .market-invoice-item,
            .market-invoice-footer {
              align-items: flex-start;
              flex-direction: column;
            }

            .market-invoice-top-right {
              text-align: left;
            }

            .market-invoice-item > strong {
              text-align: left;
            }

            .market-invoice-paid,
            .market-invoice-pay,
            .market-invoice-pending {
              width: 100%;
            }

            .market-invoices-pagination {
              grid-template-columns: 1fr;
            }

            .market-invoices-page-size,
            .market-invoices-page-buttons {
              justify-content: center;
            }

            .market-invoices-page-buttons button {
              flex: 1;
            }

            .market-invoices-error {
              align-items: stretch;
              flex-direction: column;
            }
          }

          @media (max-width: 420px) {
            .market-invoices-title h1 {
              font-size: 27px;
            }

            .market-invoices-controls,
            .market-invoices-records {
              padding: 15px;
            }

            .market-invoices-page-buttons {
              flex-direction: column;
            }

            .market-invoices-page-buttons button {
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}

export default MyMarketplaceInvoices;