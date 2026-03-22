import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function CustomerLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ekonId: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      setIsSubmitting(true);

      const res = await api.post("/api/customer-auth/login", {
        ekonId: formData.ekonId.trim().toUpperCase(),
        password: formData.password,
      });

      localStorage.setItem("ek_customer_token", res.data.token);
      localStorage.setItem("ek_customer_data", JSON.stringify(res.data.data));

      navigate("/");
    } catch (error) {
      console.error("Customer login error:", error);
      alert(error?.response?.data?.message || "Customer login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ek-login-page">
      <div className="ek-login-mobile-header">
        <img
          src="/ek-logo.png"
          alt="Eltham Konnect"
          className="ek-login-mobile-logo"
        />
        <div className="ek-login-mobile-brand">
          <div className="ek-login-mobile-name">Eltham Konnect</div>
          <div className="ek-login-mobile-tag">Your Konnection, Our Priority</div>
        </div>
      </div>

      <div className="ek-login-shell">
        <div className="ek-login-brand-panel">
          <div className="ek-login-brand-top">
            <img
              src="/ek-logo.png"
              alt="Eltham Konnect"
              className="ek-login-logo"
            />
            <div className="ek-login-brand-text">
              <span className="ek-login-brand-name">Eltham Konnect</span>
              <span className="ek-login-brand-tag">
                Your Konnection, Our Priority
              </span>
            </div>
          </div>

          <div className="ek-login-hero-card">
            <div className="ek-login-hero-badge">Customer Portal</div>

            <h1 className="ek-login-hero-title">
              Your packages, invoices, rewards, and updates in one place.
            </h1>

            <p className="ek-login-hero-copy">
              Sign in to check shipment status, see balances, upload invoices,
              and receive alerts from Eltham Konnect.
            </p>

            <div className="ek-login-feature-grid">
              <div className="ek-login-feature-item">
                <div className="ek-login-feature-icon">📦</div>
                <div>
                  <strong>Track Packages</strong>
                  <p>Know when items arrive and when they are ready for pickup.</p>
                </div>
              </div>

              <div className="ek-login-feature-item">
                <div className="ek-login-feature-icon">🧾</div>
                <div>
                  <strong>View Invoices</strong>
                  <p>Check balances and payment activity anytime.</p>
                </div>
              </div>

              <div className="ek-login-feature-item">
                <div className="ek-login-feature-icon">🎁</div>
                <div>
                  <strong>EK Rewards</strong>
                  <p>Follow your points and rewards activity easily.</p>
                </div>
              </div>

              <div className="ek-login-feature-item">
                <div className="ek-login-feature-icon">🔔</div>
                <div>
                  <strong>Portal Alerts</strong>
                  <p>Get updates when admin changes your package or invoice.</p>
                </div>
              </div>
            </div>

            <div className="ek-login-trust-row">
              <span>Florida Warehouse</span>
              <span>Jamaica Delivery</span>
              <span>Live Updates</span>
            </div>
          </div>
        </div>

        <div className="ek-login-form-panel">
          <div className="ek-login-form-card">
            <div className="ek-login-form-header">
              <img
                src="/ek-logo.png"
                alt="Eltham Konnect"
                className="ek-login-form-logo"
              />
              <div>
                <h2 className="ek-login-form-title">Customer Login</h2>
                <p className="ek-login-form-subtitle">
                  Login with your EKON ID and password.
                </p>
              </div>
            </div>

            <div className="ek-login-quick-points">
              <div className="ek-login-quick-point">Fast package tracking</div>
              <div className="ek-login-quick-point">Invoice visibility</div>
              <div className="ek-login-quick-point">Pickup alerts</div>
            </div>

            <div className="ek-login-form-group">
              <label className="ek-login-label">EKON ID</label>
              <input
                type="text"
                name="ekonId"
                placeholder="Enter your EKON ID"
                value={formData.ekonId}
                onChange={handleChange}
                className="ek-login-input"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="ek-login-form-group">
              <label className="ek-login-label">Password</label>
              <div className="ek-login-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="ek-login-input ek-login-password-input"
                  autoComplete="current-password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleLogin();
                    }
                  }}
                />
                <button
                  type="button"
                  className="ek-login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={isSubmitting}
              className="ek-login-button"
            >
              {isSubmitting ? "Signing In..." : "Login"}
            </button>

            <div className="ek-login-helper-box">
              <strong>Portal Access Includes:</strong>
              <ul className="ek-login-helper-list">
                <li>Package updates</li>
                <li>Invoices and balances</li>
                <li>Rewards and alerts</li>
                <li>Invoice upload and support</li>
              </ul>
            </div>

            <p className="ek-login-footer-text">
              Don’t have an account? <Link to="/signup">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;