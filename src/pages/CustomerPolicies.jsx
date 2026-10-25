import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";

export default function CustomerPolicies() {
  const [searchParams] = useSearchParams();
  const requestedType = searchParams.get("type");

  const selectedType = ["terms", "privacy"].includes(requestedType)
    ? requestedType
    : "all";

  const [policies, setPolicies] = useState({
    current: { terms: null, privacy: null },
    upcoming: [],
    previous: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState("");

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/api/customer-policies/published"
      );

      setPolicies({
        current: response.data.data?.current || {
          terms: null,
          privacy: null,
        },
        upcoming: response.data.data?.upcoming || [],
        previous: response.data.data?.previous || [],
      });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Policies could not be loaded. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const matchesType = (policy) =>
    selectedType === "all" || policy.policyType === selectedType;

  const current = Object.values(policies.current)
    .filter(Boolean)
    .filter(matchesType);

  const upcoming = policies.upcoming.filter(matchesType);
  const previous = policies.previous.filter(matchesType);

  const openPolicy = async (policy, download = false) => {
    if (opening) return;

    setError("");

    const fileWindow = window.open("about:blank", "_blank");

    if (!fileWindow) {
      setError("Please allow popups to open or download the PDF.");
      return;
    }

    fileWindow.opener = null;
    fileWindow.document.title = "Opening policy";
    fileWindow.document.body.textContent = "Opening PDF…";

    setOpening(policy.policyNumber);

    try {
      const response = await api.get(
        `/api/customer-policies/published/${encodeURIComponent(
          policy.policyNumber
        )}/access`,
        {
          params: download ? { download: "1" } : {},
        }
      );

      const url = response.data?.data?.url;

      if (typeof url !== "string" || !url.startsWith("https://")) {
        throw new Error("The document link could not be opened.");
      }

      if (!fileWindow.closed) {
        fileWindow.location.replace(url);
      }
    } catch (requestError) {
      fileWindow.close();

      setError(
        requestError?.response?.data?.message ||
          requestError.message ||
          "The PDF could not be opened."
      );
    } finally {
      setOpening("");
    }
  };

  const buttonStyle = {
    border: 0,
    borderRadius: "8px",
    padding: "11px 16px",
    backgroundColor: "#0B3D91",
    color: "#ffffff",
    fontWeight: 700,
    cursor: opening ? "wait" : "pointer",
  };

  const renderGroup = (heading, documents, explanation) => (
    <section style={{ marginTop: "28px" }}>
      <h2 style={{ color: "#0B3D91" }}>{heading}</h2>
      <p style={{ color: "#475569", lineHeight: 1.6 }}>
        {explanation}
      </p>

      {documents.length === 0 ? (
        <p style={{ color: "#64748b" }}>
          No documents published in this category.
        </p>
      ) : (
        documents.map((policy) => (
          <article
            key={policy.policyNumber}
            style={{
              border: "1px solid #dbe3ef",
              borderRadius: "12px",
              padding: "18px",
              marginBottom: "14px",
              backgroundColor: "#ffffff",
            }}
          >
            <h3 style={{ marginTop: 0 }}>{policy.title}</h3>

            <p style={{ color: "#475569", lineHeight: 1.7 }}>
              {policy.policyType === "terms"
                ? "Terms and Conditions"
                : "Privacy Policy"}
              <br />
              Version: {policy.version}
              <br />
              Effective date: {policy.effectiveDate}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                disabled={Boolean(opening)}
                onClick={() => openPolicy(policy)}
                style={buttonStyle}
              >
                {opening === policy.policyNumber
                  ? "Opening…"
                  : "View PDF"}
              </button>

              <button
                type="button"
                disabled={Boolean(opening)}
                onClick={() => openPolicy(policy, true)}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#F15A24",
                }}
              >
                Download PDF
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f7fb",
        padding: "24px 16px",
        fontFamily: "Arial, sans-serif",
        color: "#0f172a",
      }}
    >
      <main
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          border: "1px solid #dbe3ef",
          borderRadius: "14px",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <Link to="/" style={{ color: "#0B3D91" }}>
            Customer Portal
          </Link>

          <Link to="/login" style={{ color: "#0B3D91" }}>
            Customer Login
          </Link>
        </div>

        <h1 style={{ color: "#0B3D91" }}>
          Terms and Privacy
        </h1>

        <p style={{ color: "#475569", lineHeight: 1.7 }}>
          Read or download Eltham Konnect’s published customer
          policies at your convenience. Viewing or downloading
          a document does not record your acceptance.
        </p>

        <nav
          aria-label="Policy categories"
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            margin: "20px 0",
          }}
        >
          <Link to="/policies" style={{ color: "#0B3D91" }}>
            All Policies
          </Link>
          <Link
            to="/policies?type=terms"
            style={{ color: "#0B3D91" }}
          >
            Terms and Conditions
          </Link>
          <Link
            to="/policies?type=privacy"
            style={{ color: "#0B3D91" }}
          >
            Privacy Policy
          </Link>
        </nav>

        <button
          type="button"
          onClick={loadPolicies}
          disabled={loading || Boolean(opening)}
          style={buttonStyle}
        >
          {loading ? "Loading…" : "Refresh Policies"}
        </button>

        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {renderGroup(
              "Current Policies",
              current,
              "These are the latest published versions whose effective dates have arrived."
            )}

            {renderGroup(
              "Upcoming Policies",
              upcoming,
              "These documents are available to review in advance. Their stated effective dates have not yet arrived."
            )}

            {previous.length > 0 &&
              renderGroup(
                "Previous Versions",
                previous,
                "Earlier published versions are available for reference."
              )}
          </>
        )}

        <p
          style={{
            marginTop: "28px",
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Questions? Contact{" "}
          <a href="mailto:elthamkonnect1@gmail.com">
            elthamkonnect1@gmail.com
          </a>.
        </p>
      </main>
    </div>
  );
}