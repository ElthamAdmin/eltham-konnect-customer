import { Link } from "react-router-dom";

function CustomerSignup() {
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
          Signup page placeholder for new Eltham Konnect customers.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          <input type="text" placeholder="Full Name" style={{ padding: "12px" }} />
          <input type="email" placeholder="Email" style={{ padding: "12px" }} />
          <input type="text" placeholder="Phone" style={{ padding: "12px" }} />
          <input type="password" placeholder="Password" style={{ padding: "12px" }} />
        </div>

        <button
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#16a34a",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Create Account
        </button>

        <p style={{ marginTop: "16px" }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default CustomerSignup;