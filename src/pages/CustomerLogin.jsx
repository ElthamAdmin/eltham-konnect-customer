import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function CustomerLogin() {
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({
    ekonId: "",
    password: "",
  });

  const [setupForm, setSetupForm] = useState({
    ekonId: "",
    emailOrPhone: "",
    password: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [showSetupConfirmPassword, setShowSetupConfirmPassword] = useState(false);
  const [showSetupSection, setShowSetupSection] = useState(false);

  const handleLoginChange = (e) => {
    setLoginForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSetupChange = (e) => {
    setSetupForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async () => {
    try {
      if (!loginForm.ekonId || !loginForm.password) {
        alert("Please enter EKON ID and password.");
        return;
      }

      setIsSubmitting(true);

      const res = await api.post("/api/customer-auth/login", {
        ekonId: loginForm.ekonId.trim().toUpperCase(),
        password: loginForm.password,
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

  const handleFirstTimeSetup = async () => {
    try {
      if (
        !setupForm.ekonId ||
        !setupForm.emailOrPhone ||
        !setupForm.password ||
        !setupForm.confirmPassword
      ) {
        alert("Please complete all first-time setup fields.");
        return;
      }

      if (setupForm.password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }

      if (setupForm.password !== setupForm.confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      setIsSettingPassword(true);

      const emailOrPhone = setupForm.emailOrPhone.trim();
      const payload = {
        ekonId: setupForm.ekonId.trim().toUpperCase(),
        password: setupForm.password,
      };

      if (emailOrPhone.includes("@")) {
        payload.email = emailOrPhone.toLowerCase();
      } else {
        payload.phone = emailOrPhone;
      }

      const res = await api.post("/api/customer-auth/setup-password", payload);

      alert(
        res?.data?.message ||
          "Password set successfully. You can now log in."
      );

      setLoginForm((prev) => ({
        ...prev,
        ekonId: setupForm.ekonId.trim().toUpperCase(),
        password: "",
      }));

      setSetupForm({
        ekonId: "",
        emailOrPhone: "",
        password: "",
        confirmPassword: "",
      });

      setShowSetupSection(false);
      setShowSetupPassword(false);
      setShowSetupConfirmPassword(false);
    } catch (error) {
      console.error("First-time password setup error:", error);
      alert(
        error?.response?.data?.message ||
          "Could not set password. Please check your details and try again."
      );
    } finally {
      setIsSettingPassword(false);
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
                value={loginForm.ekonId}
                onChange={handleLoginChange}
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
                  value={loginForm.password}
                  onChange={handleLoginChange}
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

            <button
              type="button"
              onClick={() => setShowSetupSection((prev) => !prev)}
              className="ek-login-secondary-button"
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #d4af37",
                backgroundColor: showSetupSection ? "#fef7e0" : "white",
                color: "#8a6d1d",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {showSetupSection
                ? "Hide First-Time Setup"
                : "First time here? Set your password"}
            </button>

            {showSetupSection && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "8px",
                    color: "#0B3D91",
                    fontSize: "18px",
                  }}
                >
                  Existing Customer First-Time Setup
                </h3>

                <p
                  style={{
                    marginTop: 0,
                    marginBottom: "14px",
                    color: "#475569",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  If you already have an Eltham Konnect account but have never
                  logged into the portal before, use your EKON ID and the email
                  address or phone number on your account to create your portal
                  password.
                </p>

                <div className="ek-login-form-group">
                  <label className="ek-login-label">EKON ID</label>
                  <input
                    type="text"
                    name="ekonId"
                    placeholder="Enter your EKON ID"
                    value={setupForm.ekonId}
                    onChange={handleSetupChange}
                    className="ek-login-input"
                  />
                </div>

                <div className="ek-login-form-group">
                  <label className="ek-login-label">Email Address or Phone Number</label>
                  <input
                    type="text"
                    name="emailOrPhone"
                    placeholder="Enter your email or phone number"
                    value={setupForm.emailOrPhone}
                    onChange={handleSetupChange}
                    className="ek-login-input"
                  />
                </div>

                <div className="ek-login-form-group">
                  <label className="ek-login-label">Create Password</label>
                  <div className="ek-login-password-wrap">
                    <input
                      type={showSetupPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a password"
                      value={setupForm.password}
                      onChange={handleSetupChange}
                      className="ek-login-input ek-login-password-input"
                    />
                    <button
                      type="button"
                      className="ek-login-password-toggle"
                      onClick={() => setShowSetupPassword((prev) => !prev)}
                    >
                      {showSetupPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="ek-login-form-group">
                  <label className="ek-login-label">Confirm Password</label>
                  <div className="ek-login-password-wrap">
                    <input
                      type={showSetupConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={setupForm.confirmPassword}
                      onChange={handleSetupChange}
                      className="ek-login-input ek-login-password-input"
                    />
                    <button
                      type="button"
                      className="ek-login-password-toggle"
                      onClick={() => setShowSetupConfirmPassword((prev) => !prev)}
                    >
                      {showSetupConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleFirstTimeSetup}
                  disabled={isSettingPassword}
                  className="ek-login-button"
                  style={{ marginTop: "4px" }}
                >
                  {isSettingPassword ? "Setting Password..." : "Set Password"}
                </button>
              </div>
            )}

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