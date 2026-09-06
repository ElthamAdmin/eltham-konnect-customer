import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BellRing,
  Box,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Gift,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Mail,
  PackageCheck,
  Plane,
  ShieldCheck,
  ShoppingCart,
  UserPlus,
  Waves,
} from "lucide-react";
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
  const [showSetupConfirmPassword, setShowSetupConfirmPassword] =
    useState(false);

  const [showSetupSection, setShowSetupSection] = useState(false);

  const [loginMessage, setLoginMessage] = useState({
    type: "",
    text: "",
  });

  const [setupMessage, setSetupMessage] = useState({
    type: "",
    text: "",
  });

  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setLoginForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (loginMessage.text) {
      setLoginMessage({ type: "", text: "" });
    }
  };

  const handleSetupChange = (event) => {
    const { name, value } = event.target;

    setSetupForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (setupMessage.text) {
      setSetupMessage({ type: "", text: "" });
    }
  };

  const handleLogin = async (event) => {
    event?.preventDefault();

    const ekonId = loginForm.ekonId.trim().toUpperCase();

    if (!ekonId || !loginForm.password) {
      setLoginMessage({
        type: "error",
        text: "Please enter your EKON ID and password.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setLoginMessage({ type: "", text: "" });

      const res = await api.post("/api/customer-auth/login", {
        ekonId,
        password: loginForm.password,
      });

      if (!res.data?.token || !res.data?.data) {
        throw new Error("The login response was incomplete.");
      }

      localStorage.setItem("ek_customer_token", res.data.token);
      localStorage.setItem(
        "ek_customer_data",
        JSON.stringify(res.data.data)
      );

      navigate("/");
    } catch (error) {
      console.error("Customer login error:", error);

      setLoginMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Customer login failed. Please check your details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFirstTimeSetup = async (event) => {
    event?.preventDefault();

    const ekonId = setupForm.ekonId.trim().toUpperCase();
    const emailOrPhone = setupForm.emailOrPhone.trim();

    if (
      !ekonId ||
      !emailOrPhone ||
      !setupForm.password ||
      !setupForm.confirmPassword
    ) {
      setSetupMessage({
        type: "error",
        text: "Please complete all first-time setup fields.",
      });
      return;
    }

    if (setupForm.password.length < 6) {
      setSetupMessage({
        type: "error",
        text: "Your password must contain at least 6 characters.",
      });
      return;
    }

    if (setupForm.password !== setupForm.confirmPassword) {
      setSetupMessage({
        type: "error",
        text: "The password and confirmation do not match.",
      });
      return;
    }

    try {
      setIsSettingPassword(true);
      setSetupMessage({ type: "", text: "" });

      const payload = {
        ekonId,
        password: setupForm.password,
      };

      if (emailOrPhone.includes("@")) {
        payload.email = emailOrPhone.toLowerCase();
      } else {
        payload.phone = emailOrPhone;
      }

      const res = await api.post(
        "/api/customer-auth/setup-password",
        payload
      );

      setLoginForm({
        ekonId,
        password: "",
      });

      setSetupForm({
        ekonId: "",
        emailOrPhone: "",
        password: "",
        confirmPassword: "",
      });

      setShowSetupPassword(false);
      setShowSetupConfirmPassword(false);

      setSetupMessage({
        type: "success",
        text:
          res.data?.message ||
          "Your password was created successfully. You can now log in.",
      });
    } catch (error) {
      console.error("First-time password setup error:", error);

      setSetupMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Your password could not be created. Please check your details.",
      });
    } finally {
      setIsSettingPassword(false);
    }
  };

  const toggleSetupSection = () => {
    setShowSetupSection((currentValue) => !currentValue);
    setSetupMessage({ type: "", text: "" });
  };

  const renderMessage = (message) => {
    if (!message?.text) {
      return null;
    }

    const isSuccess = message.type === "success";

    return (
      <div
        className={`ek-login-message ${
          isSuccess
            ? "ek-login-message-success"
            : "ek-login-message-error"
        }`}
        role={isSuccess ? "status" : "alert"}
      >
        {isSuccess ? (
          <CheckCircle2 size={19} aria-hidden="true" />
        ) : (
          <AlertCircle size={19} aria-hidden="true" />
        )}

        <span>{message.text}</span>
      </div>
    );
  };

  return (
    <main className="ek-login-page">
      <header className="ek-login-mobile-header">
        <Link to="/login" className="ek-login-mobile-brand-wrap">
          <img
            src="/ek-logo.png"
            alt="Eltham Konnect"
            className="ek-login-mobile-logo"
          />

          <span className="ek-login-mobile-brand">
            <strong>Eltham Konnect</strong>
            <small>Your Konnection, Our Priority</small>
          </span>
        </Link>

        <Link
          to="/amazon-associate-links"
          className="ek-login-mobile-marketplace"
        >
          <ShoppingCart size={17} aria-hidden="true" />
          Marketplace
        </Link>
      </header>

      <div className="ek-login-shell">
        <section className="ek-login-brand-panel">
          <div className="ek-login-brand-content">
            <Link to="/login" className="ek-login-brand-top">
              <img
                src="/ek-logo.png"
                alt="Eltham Konnect"
                className="ek-login-logo"
              />

              <span className="ek-login-brand-text">
                <strong className="ek-login-brand-name">
                  Eltham Konnect
                </strong>

                <small className="ek-login-brand-tag">
                  Your Konnection, Our Priority
                </small>
              </span>
            </Link>

            <div className="ek-login-hero-copy-wrap">
              <span className="ek-login-hero-badge">
                <ShieldCheck size={16} aria-hidden="true" />
                Secure Customer Portal
              </span>

              <h1 className="ek-login-hero-title">
                Your shipments, invoices, and rewards in one place.
              </h1>

              <p className="ek-login-hero-copy">
                Track packages, receive pickup updates, upload invoices, and
                manage your Eltham Konnect account wherever you are.
              </p>
            </div>

            <div className="ek-login-banner-image-wrap">
              <img
                src="/login-shipping-banner.png"
                alt="Air and sea shipping services from Eltham Konnect"
                className="ek-login-banner-image"
              />

              <div className="ek-login-image-labels">
                <span>
                  <Plane size={16} aria-hidden="true" />
                  Air Freight
                </span>

                <span>
                  <Waves size={16} aria-hidden="true" />
                  Sea Shipping
                </span>

                <span>
                  <PackageCheck size={16} aria-hidden="true" />
                  Jamaica Pickup
                </span>
              </div>
            </div>

            <div className="ek-login-feature-grid">
              <article className="ek-login-feature-item">
                <div className="ek-login-feature-icon">
                  <Box size={20} aria-hidden="true" />
                </div>

                <div>
                  <strong>Track Packages</strong>
                  <p>Follow your shipments and pickup readiness.</p>
                </div>
              </article>

              <article className="ek-login-feature-item">
                <div className="ek-login-feature-icon">
                  <FileText size={20} aria-hidden="true" />
                </div>

                <div>
                  <strong>View Invoices</strong>
                  <p>Review balances, charges, and payments.</p>
                </div>
              </article>

              <article className="ek-login-feature-item">
  <div className="ek-login-feature-icon">
    <BellRing size={20} aria-hidden="true" />
  </div>

  <div>
    <strong>Pickup Alerts</strong>
    <p>Stay informed as your packages move.</p>
  </div>
</article>

              <article className="ek-login-feature-item">
                <div className="ek-login-feature-icon">
                  <Gift size={20} aria-hidden="true" />
                </div>

                <div>
                  <strong>EK Rewards</strong>
                  <p>Monitor points earned from qualifying activity.</p>
                </div>
              </article>
            </div>

            <Link
              to="/amazon-associate-links"
              className="ek-login-amazon-banner"
            >
              <span className="ek-login-amazon-icon">
                <ShoppingCart size={21} aria-hidden="true" />
              </span>

              <span>
                <strong>Explore the EK Marketplace</strong>
                <small>
                  Browse selected products and Amazon Associate finds.
                </small>
              </span>

              <span className="ek-login-amazon-action">Browse</span>
            </Link>
          </div>
        </section>

        <section className="ek-login-form-panel">
          <div className="ek-login-form-container">
            <div className="ek-login-mobile-intro">
              <span className="ek-login-mobile-intro-icon">
                <Plane size={22} aria-hidden="true" />
              </span>

              <div>
                <strong>Shipping made simple</strong>
                <p>Track packages and manage your EKON account anywhere.</p>
              </div>
            </div>

            <div className="ek-login-form-card">
              <div className="ek-login-form-header">
                <img
                  src="/ek-logo.png"
                  alt="Eltham Konnect"
                  className="ek-login-form-logo"
                />

                <div>
                  <span className="ek-login-form-eyebrow">
                    CUSTOMER PORTAL
                  </span>

                  <h2 className="ek-login-form-title">Welcome back</h2>

                  <p className="ek-login-form-subtitle">
                    Sign in with your EKON ID and password.
                  </p>
                </div>
              </div>

              {renderMessage(loginMessage)}

              <form className="ek-login-main-form" onSubmit={handleLogin}>
                <label className="ek-login-form-group">
                  <span className="ek-login-label">EKON ID</span>

                  <div className="ek-login-input-wrap">
                    <Box size={19} aria-hidden="true" />

                    <input
                      type="text"
                      name="ekonId"
                      placeholder="Example: EKON00000"
                      value={loginForm.ekonId}
                      onChange={handleLoginChange}
                      className="ek-login-input"
                      autoFocus
                      autoComplete="username"
                      disabled={isSubmitting}
                    />
                  </div>
                </label>

                <label className="ek-login-form-group">
                  <span className="ek-login-label">Password</span>

                  <div className="ek-login-input-wrap">
                    <LockKeyhole size={19} aria-hidden="true" />

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      className="ek-login-input"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                    />

                    <button
                      type="button"
                      className="ek-login-password-toggle"
                      onClick={() =>
                        setShowPassword((currentValue) => !currentValue)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={19} aria-hidden="true" />
                      ) : (
                        <Eye size={19} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ek-login-button"
                >
                  {isSubmitting ? (
                    <LoaderCircle
                      className="ek-login-spinner"
                      size={19}
                      aria-hidden="true"
                    />
                  ) : (
                    <LogIn size={19} aria-hidden="true" />
                  )}

                  {isSubmitting ? "Signing In..." : "Sign In"}
                </button>
              </form>

              <div className="ek-login-divider">
                <span>New to the portal?</span>
              </div>

              <button
                type="button"
                onClick={toggleSetupSection}
                className="ek-login-secondary-button"
                aria-expanded={showSetupSection}
              >
                <LockKeyhole size={18} aria-hidden="true" />

                {showSetupSection
                  ? "Close First-Time Setup"
                  : "Set Up My First Password"}
              </button>

              {showSetupSection && (
                <form
                  className="ek-login-setup-card"
                  onSubmit={handleFirstTimeSetup}
                >
                  <div className="ek-login-setup-heading">
                    <span className="ek-login-setup-icon">
                      <UserPlus size={21} aria-hidden="true" />
                    </span>

                    <div>
                      <h3>Existing Customer Setup</h3>
                      <p>
                        Use the contact information already registered on your
                        Eltham Konnect account.
                      </p>
                    </div>
                  </div>

                  {renderMessage(setupMessage)}

                  <label className="ek-login-form-group">
                    <span className="ek-login-label">EKON ID</span>

                    <div className="ek-login-input-wrap">
                      <Box size={19} aria-hidden="true" />

                      <input
                        type="text"
                        name="ekonId"
                        placeholder="Enter your EKON ID"
                        value={setupForm.ekonId}
                        onChange={handleSetupChange}
                        className="ek-login-input"
                        autoComplete="username"
                        disabled={isSettingPassword}
                      />
                    </div>
                  </label>

                  <label className="ek-login-form-group">
                    <span className="ek-login-label">
                      Email Address or Phone Number
                    </span>

                    <div className="ek-login-input-wrap">
                      <Mail size={19} aria-hidden="true" />

                      <input
                        type="text"
                        name="emailOrPhone"
                        placeholder="Enter your registered email or phone"
                        value={setupForm.emailOrPhone}
                        onChange={handleSetupChange}
                        className="ek-login-input"
                        autoComplete="email"
                        disabled={isSettingPassword}
                      />
                    </div>
                  </label>

                  <label className="ek-login-form-group">
                    <span className="ek-login-label">Create Password</span>

                    <div className="ek-login-input-wrap">
                      <LockKeyhole size={19} aria-hidden="true" />

                      <input
                        type={showSetupPassword ? "text" : "password"}
                        name="password"
                        placeholder="At least 6 characters"
                        value={setupForm.password}
                        onChange={handleSetupChange}
                        className="ek-login-input"
                        autoComplete="new-password"
                        disabled={isSettingPassword}
                      />

                      <button
                        type="button"
                        className="ek-login-password-toggle"
                        onClick={() =>
                          setShowSetupPassword(
                            (currentValue) => !currentValue
                          )
                        }
                        aria-label={
                          showSetupPassword
                            ? "Hide new password"
                            : "Show new password"
                        }
                      >
                        {showSetupPassword ? (
                          <EyeOff size={19} aria-hidden="true" />
                        ) : (
                          <Eye size={19} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </label>

                  <label className="ek-login-form-group">
                    <span className="ek-login-label">Confirm Password</span>

                    <div className="ek-login-input-wrap">
                      <LockKeyhole size={19} aria-hidden="true" />

                      <input
                        type={
                          showSetupConfirmPassword ? "text" : "password"
                        }
                        name="confirmPassword"
                        placeholder="Enter the password again"
                        value={setupForm.confirmPassword}
                        onChange={handleSetupChange}
                        className="ek-login-input"
                        autoComplete="new-password"
                        disabled={isSettingPassword}
                      />

                      <button
                        type="button"
                        className="ek-login-password-toggle"
                        onClick={() =>
                          setShowSetupConfirmPassword(
                            (currentValue) => !currentValue
                          )
                        }
                        aria-label={
                          showSetupConfirmPassword
                            ? "Hide confirmed password"
                            : "Show confirmed password"
                        }
                      >
                        {showSetupConfirmPassword ? (
                          <EyeOff size={19} aria-hidden="true" />
                        ) : (
                          <Eye size={19} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={isSettingPassword}
                    className="ek-login-setup-button"
                  >
                    {isSettingPassword ? (
                      <LoaderCircle
                        className="ek-login-spinner"
                        size={19}
                        aria-hidden="true"
                      />
                    ) : (
                      <ShieldCheck size={19} aria-hidden="true" />
                    )}

                    {isSettingPassword
                      ? "Creating Password..."
                      : "Create Portal Password"}
                  </button>
                </form>
              )}

              {!showSetupSection && (
                <div className="ek-login-security-note">
                  <ShieldCheck size={19} aria-hidden="true" />

                  <span>
                    Secure access to packages, invoices, rewards, and support.
                  </span>
                </div>
              )}

              <p className="ek-login-footer-text">
                Don’t have an Eltham Konnect account?
                <Link to="/signup">Create an account</Link>
              </p>
            </div>

            <p className="ek-login-form-footer">
              © {new Date().getFullYear()} Eltham Konnect. Your Konnection, Our
              Priority.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default CustomerLogin;