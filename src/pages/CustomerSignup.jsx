import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function CustomerSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
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
          maxWidth: "600px",
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "26px",
        }}
      >
        <h1 style={{ marginTop: 0, color: "#1f3552" }}>Customer Signup</h1>
        <p style={{ color: "#64748b" }}>
          Create your Eltham Konnect customer portal account.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            style={{ padding: "12px" }}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            style={{ padding: "12px" }}
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            style={{ padding: "12px" }}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            style={{ padding: "12px" }}
          />
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: loading ? "#94a3b8" : "#16a34a",
            color: "white",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p style={{ marginTop: "16px" }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default CustomerSignup;