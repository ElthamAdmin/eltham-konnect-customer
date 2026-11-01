import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import api from "../api";

export default function CustomerNotificationBell({ customer, light = false }) {
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const storageKey = `ekos.hiddenAlerts.v1.${customer.ekonId}`;

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let active = true;
    let fetching = false;

    const refresh = async () => {
      if (fetching) return;
      fetching = true;

      try {
        const results = await Promise.allSettled([
          api.get("/api/customer-notifications/mine"),
          api.get("/api/communication/my"),
          api.get("/api/support-tickets/my"),
        ]);

        if (!active) return;

        const kinds = ["notification", "communication", "ticket"];

        setItems((previous) => {
          const next = [];

          results.forEach((result, index) => {
            const kind = kinds[index];

            if (
              result.status !== "fulfilled" ||
              !Array.isArray(result.value.data?.data)
            ) {
              next.push(...previous.filter((item) => item.kind === kind));
              return;
            }

            result.value.data.data.forEach((item) => {
              const sourceId =
                kind === "notification"
                  ? item.notificationNumber
                  : kind === "communication"
                    ? item.logNumber || item._id
                    : item.ticketNumber || item._id;

              if (!sourceId) return;

              next.push({
                id: `${kind}:${sourceId}`,
                kind,
                notificationNumber: item.notificationNumber,
                title: item.title || item.subject || "Account update",
                message:
                  kind === "ticket"
                    ? `Ticket ${item.ticketNumber} is ${item.status}`
                    : item.message || "",
                date: item.createdAt || item.date,
                isRead: kind === "notification" ? Boolean(item.isRead) : true,
              });
            });
          });

          return next.sort(
            (a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
          );
        });

        setError(
          results.some(
            (result) =>
              result.status !== "fulfilled" ||
              !Array.isArray(result.value.data?.data)
          )
            ? "Some messages could not be refreshed. Please try again later."
            : ""
        );
      } catch {
        if (active) setError("Could not refresh notifications.");
      } finally {
        fetching = false;
        if (active) setLoading(false);
      }
    };

    void refresh();
    const interval = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [customer.ekonId]);

  useEffect(() => {
    if (!open) return;

    const outside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    const escape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const saveHidden = (next) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setHidden(next);
      setError("");
    } catch {
      setError("Your browser could not save this visibility preference.");
    }
  };

  const markRead = async (item) => {
    if (item.kind !== "notification" || item.isRead || busy) return;

    setBusy(true);
    try {
      await api.put(
        `/api/customer-notifications/${encodeURIComponent(item.notificationNumber)}/read`
      );
      setItems((previous) =>
        previous.map((entry) =>
          entry.id === item.id ? { ...entry, isRead: true } : entry
        )
      );
      setError("");
    } catch {
      setError("Could not mark this notification as read.");
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      await api.put("/api/customer-notifications/read-all");
      setItems((previous) =>
        previous.map((item) => ({ ...item, isRead: true }))
      );
      setError("");
    } catch {
      setError("Could not mark notifications as read.");
    } finally {
      setBusy(false);
    }
  };

  const unread = items.filter(
    (item) => !item.isRead && !hidden.includes(item.id)
  ).length;

  const displayed = items.filter(
    (item) => hidden.includes(item.id) === showHidden
  );

  const actionStyle = {
    background: "transparent",
    border: "none",
    color: "#bfdbfe",
    cursor: "pointer",
    padding: "6px",
    fontSize: "12px",
  };

  return (
    <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        aria-controls="customer-notification-panel"
        onClick={() => setOpen((previous) => !previous)}
        style={{
          position: "relative",
          width: "42px",
          height: "42px",
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          border: open ? "2px solid #60a5fa" : "1px solid transparent",
          background: open ? (light ? "#ffffff22" : "#eff6ff") : "transparent",
          color: light ? "#fff" : "#64748b",
          cursor: "pointer",
        }}
      >
        <Bell size={24} strokeWidth={1.8} aria-hidden="true" />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-3px",
              right: "-4px",
              background: "#dc2626",
              color: "#fff",
              borderRadius: "20px",
              padding: "2px 5px",
              fontSize: "10px",
              fontWeight: "bold",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <section
          id="customer-notification-panel"
          aria-label="Customer notifications"
          className="customer-notification-panel"
        >
          <div style={{ padding: "14px", borderBottom: "1px solid #374151" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <strong>Notifications</strong>
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                style={actionStyle}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                aria-pressed={!showHidden}
                onClick={() => setShowHidden(false)}
                style={{ ...actionStyle, color: !showHidden ? "#fff" : "#94a3b8" }}
              >
                Inbox
              </button>
              <button
                type="button"
                aria-pressed={showHidden}
                onClick={() => setShowHidden(true)}
                style={{ ...actionStyle, color: showHidden ? "#fff" : "#94a3b8" }}
              >
                Hidden ({items.filter((item) => hidden.includes(item.id)).length})
              </button>
              <button
                type="button"
                disabled={busy || !items.some((item) => !item.isRead)}
                onClick={markAllRead}
                style={{ ...actionStyle, marginLeft: "auto", opacity: busy ? 0.5 : 1 }}
              >
                Mark all read
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" style={{ padding: "0 14px", color: "#fca5a5", fontSize: "13px" }}>
              {error}
            </p>
          )}

          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && !items.length ? (
              <p style={{ padding: "14px" }}>Loading messages…</p>
            ) : displayed.length === 0 ? (
              <p style={{ padding: "14px", color: "#cbd5e1" }}>
                {showHidden ? "No hidden messages." : "No messages to show."}
              </p>
            ) : (
              displayed.map((item) => (
                <article
                  key={item.id}
                  style={{
                    padding: "14px",
                    borderBottom: "1px solid #374151",
                    background: item.isRead ? "transparent" : "#26374e",
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                    <details
                      style={{ flex: 1, minWidth: 0 }}
                      onToggle={(event) => {
                        if (event.currentTarget.open) void markRead(item);
                      }}
                    >
                      <summary
                        style={{
                          cursor: "pointer",
                          fontWeight: item.isRead ? 600 : 800,
                          fontSize: "14px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {item.title}
                        {!item.isRead && (
                          <span style={{ color: "#93c5fd", marginLeft: "8px" }}>•</span>
                        )}
                      </summary>

                      <p
                        style={{
                          color: "#d1d5db",
                          fontSize: "13px",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {item.message}
                      </p>

                      {item.kind === "notification" && !item.isRead && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => markRead(item)}
                          style={actionStyle}
                        >
                          Mark as read
                        </button>
                      )}
                    </details>

                    <button
                      type="button"
                      aria-label={`${showHidden ? "Restore" : "Hide"} ${item.title}`}
                      onClick={() =>
                        saveHidden(
                          showHidden
                            ? hidden.filter((id) => id !== item.id)
                            : [...new Set([...hidden, item.id])]
                        )
                      }
                      style={actionStyle}
                    >
                      {showHidden ? "Restore" : <X size={16} aria-hidden="true" />}
                    </button>
                  </div>

                  <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "8px" }}>
                    {Number.isFinite(Date.parse(item.date))
                      ? new Date(item.date).toLocaleString("en-JM", {
                          timeZone: "America/Jamaica",
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : ""}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      <style>{`
        .customer-notification-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: min(390px, calc(100vw - 24px));
          max-height: min(560px, calc(100dvh - 110px));
          display: flex;
          flex-direction: column;
          background: #1f2937;
          color: #f3f4f6;
          border: 1px solid #374151;
          border-radius: 12px;
          box-shadow: 0 18px 45px rgba(0,0,0,.3);
          z-index: 100;
          text-align: left;
        }
        @media (max-width: 768px) {
          .customer-notification-panel {
            position: fixed;
            top: 82px;
            right: 12px;
          }
        }
      `}</style>
    </div>
  );
}