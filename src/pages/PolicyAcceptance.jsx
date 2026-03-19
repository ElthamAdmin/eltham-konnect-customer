import { useState } from "react";
import api from "../api";

function PolicyAcceptance({ customer, onAccept }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleAccept = async () => {
    try {
      if (!termsAccepted || !privacyAccepted) {
        alert("You must accept both the Terms and Conditions and Privacy Policy.");
        return;
      }

      const res = await api.post("/api/customer-auth/accept-policies", {
        termsAccepted: true,
        privacyAccepted: true,
      });

      const updatedCustomer = {
        ...customer,
        termsAccepted: true,
        privacyAccepted: true,
        termsAcceptedAt: res.data.data.termsAcceptedAt,
        privacyAcceptedAt: res.data.data.privacyAcceptedAt,
      };

      localStorage.setItem("ek_customer_data", JSON.stringify(updatedCustomer));
      onAccept(updatedCustomer);
    } catch (error) {
      console.error("Policy acceptance error:", error);
      alert(error?.response?.data?.message || "Could not save policy acceptance.");
    }
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
      }}
    >
      <h1 style={{ marginTop: 0 }}>Terms & Privacy Acceptance</h1>
      <p>
        Before using the Eltham Konnect Customer Portal, you must accept our Terms and Conditions
        and Privacy Policy.
      </p>

      <div
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          padding: "14px",
          borderRadius: "8px",
          marginBottom: "18px",
        }}
      >
        <strong>Customer:</strong> {customer.name} <br />
        <strong>EKON ID:</strong> {customer.ekonId}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
          <h3 style={{ marginTop: 0 }}>Terms and Conditions</h3>
          <p>Placeholder for active Terms and Conditions PDF/document.</p>
          <label>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />{" "}
            I accept the Terms and Conditions
          </label>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
          <h3 style={{ marginTop: 0 }}>Privacy Policy</h3>
          <p>Placeholder for active Privacy Policy PDF/document.</p>
          <label>
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
            />{" "}
            I accept the Privacy Policy
          </label>
        </div>
      </div>

      <button
  onClick={handleAccept}
  disabled={!termsAccepted || !privacyAccepted}
  style={{
    backgroundColor: !termsAccepted || !privacyAccepted ? "#94a3b8" : "#16a34a",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "6px",
    cursor: !termsAccepted || !privacyAccepted ? "not-allowed" : "pointer",
    fontWeight: "bold",
  }}
>
  Accept and Continue
</button>
    </div>
  );
}

export default PolicyAcceptance;