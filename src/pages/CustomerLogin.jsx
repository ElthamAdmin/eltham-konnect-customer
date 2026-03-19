import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function CustomerLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ekonId: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async () => {
    try {
      if (!formData.ekonId || !formData.password) {
        alert("Please enter EKON ID and password.");
        return;
      }

      const res = await api.post("/api/customer-auth/login", formData);

      localStorage.setItem("ek_customer_token", res.data.token);
      localStorage.setItem("ek_customer_data", JSON.stringify(res.data.data));

      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error("Customer login error:", error);
      alert(error?.response?.data?.message || "Customer login failed.");
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
          maxWidth: "520px",
          backgroundColor: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "26px",
        }}
      >
        <h1 style={{ marginTop: 0, color: "#1f3552" }}>Customer Login</h1>
        <p style={{ color: "#64748b" }}>
          Login with your EKON ID and customer portal password.
        </p>

        <input
          type="text"
          name="ekonId"
          placeholder="EKON ID"
          value={formData.ekonId}
          onChange={handleChange}
          style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          style={{ width: "100%", padding: "12px", marginBottom: "12px" }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#0B3D91",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        <p style={{ marginTop: "16px" }}>
          Don’t have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default CustomerLogin;