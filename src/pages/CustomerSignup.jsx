import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function CustomerSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "Eltham Park Mainstore",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async () => {
    try {
      if (
        !formData.name ||
        !formData.email ||
        !formData.phone ||
        !formData.branch ||
        !formData.password
      ) {
        alert("Please complete all signup fields.");
        return;
      }

      setLoading(true);

      const res = await api.post("/api/customer-auth/signup", formData);

      localStorage.setItem("ek_customer_token", res.data.token);
      localStorage.setItem("ek_customer_data", JSON.stringify(res.data.data));

      alert(`Account created successfully. Your EKON ID is ${res.data.data.ekonId}`);
      navigate("/policy-acceptance");
    } catch (error) {
      console.error("Customer signup error:", error);
      alert(error?.response?.data?.message || "Customer signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        backgroundColor: "#eef2f7",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          backgroundColor: "white",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          padding: "28px",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "8px", color: "#0B3D91" }}>
          Customer Signup
        </h1>

        <p style={{ color: "#64748b", marginTop: 0, marginBottom: "20px" }}>
          Create your Eltham Konnect customer portal account and choose your preferred branch.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
            }}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
            }}
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
            }}
          />

          <select
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "white",
            }}
          >
            <option value="Eltham Park Mainstore">Eltham Park Mainstore</option>
            <option value="Brown's Town Square">Brown's Town Square</option>
          </select>

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              gridColumn: "span 2",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            borderRadius: "10px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#334155",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#0B3D91" }}>Branch Selection:</strong>
          <div style={{ marginTop: "6px" }}>
            Choose the branch you want linked to your account for pickup and service support.
          </div>
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "18px",
            padding: "13px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: loading ? "#94a3b8" : "#16a34a",
            color: "white",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "15px",
          }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p style={{ marginTop: "18px", color: "#475569" }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>

      <style>
        {`
          @media (max-width: 700px) {
            div[style*="grid-template-columns: repeat(2, 1fr)"] {
              grid-template-columns: 1fr !important;
            }

            input[name="password"] {
              grid-column: span 1 !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default CustomerSignup;