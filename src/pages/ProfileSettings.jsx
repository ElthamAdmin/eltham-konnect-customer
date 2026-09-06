import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import api from "../api";

function ProfileSettings() {
  const readSavedCustomer = () => {
    try {
      const saved = localStorage.getItem("ek_customer_data");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Could not read saved customer profile:", error);
      return null;
    }
  };

  const [customer, setCustomer] = useState(readSavedCustomer);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    marketingOptIn: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState({
    type: "",
    text: "",
  });

  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateProfileState = (profile) => {
    setCustomer(profile);
    localStorage.setItem("ek_customer_data", JSON.stringify(profile));

    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      marketingOptIn:
        profile?.marketingOptIn !== undefined
          ? Boolean(profile.marketingOptIn)
          : true,
    });
  };

  const loadCustomerProfile = async () => {
    try {
      setLoading(true);
      setProfileMessage({ type: "", text: "" });

      const res = await api.get("/api/customer-auth/me");
      const profile = res.data?.data;

      if (!profile) {
        throw new Error("The customer profile response was empty.");
      }

      updateProfileState(profile);
    } catch (error) {
      console.error("Profile loading failed:", error);

      setProfileMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Your profile could not be loaded. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerProfile();
  }, []);

  const handleProfileChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (profileMessage.text) {
      setProfileMessage({ type: "", text: "" });
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((currentPasswordData) => ({
      ...currentPasswordData,
      [name]: value,
    }));

    if (passwordMessage.text) {
      setPasswordMessage({ type: "", text: "" });
    }
  };

  const saveProfile = async (event) => {
    event?.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();

    if (!name) {
      setProfileMessage({
        type: "error",
        text: "Please enter your full name.",
      });
      return;
    }

    if (!email) {
      setProfileMessage({
        type: "error",
        text: "Please enter your email address.",
      });
      return;
    }

    if (!phone) {
      setProfileMessage({
        type: "error",
        text: "Please enter your phone number.",
      });
      return;
    }

    try {
      setSavingProfile(true);
      setProfileMessage({ type: "", text: "" });

      const res = await api.put("/api/customer-auth/me", {
        name,
        email,
        phone,
        marketingOptIn: Boolean(formData.marketingOptIn),
      });

      const updatedProfile = res.data?.data;

      if (!updatedProfile) {
        throw new Error("The updated customer profile was not returned.");
      }

      updateProfileState(updatedProfile);

      setProfileMessage({
        type: "success",
        text: res.data?.message || "Your profile was updated successfully.",
      });
    } catch (error) {
      console.error("Profile update failed:", error);

      setProfileMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Your profile could not be updated. Please try again.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event?.preventDefault();

    const currentPassword = passwordData.currentPassword;
    const newPassword = passwordData.newPassword;
    const confirmPassword = passwordData.confirmPassword;

    if (!currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Please enter your current password.",
      });
      return;
    }

    if (!newPassword) {
      setPasswordMessage({
        type: "error",
        text: "Please enter a new password.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Your new password must contain at least 6 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "The new password and confirmation do not match.",
      });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage({
        type: "error",
        text: "Your new password must be different from your current password.",
      });
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordMessage({ type: "", text: "" });

      const res = await api.put("/api/customer-auth/change-password", {
        currentPassword,
        newPassword,
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setPasswordMessage({
        type: "success",
        text: res.data?.message || "Your password was updated successfully.",
      });
    } catch (error) {
      console.error("Password update failed:", error);

      setPasswordMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Your password could not be updated. Please try again.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const renderMessage = (message) => {
    if (!message?.text) {
      return null;
    }

    const isSuccess = message.type === "success";

    return (
      <div
        className={`profile-message ${
          isSuccess ? "profile-message-success" : "profile-message-error"
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

  if (loading) {
    return (
      <div className="profile-loading">
        <RefreshCw className="profile-spinner" size={24} aria-hidden="true" />
        <span>Loading your profile settings...</span>

        <style>{`
          .profile-loading {
            min-height: 260px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            color: #64748b;
            font-weight: 800;
          }

          .profile-spinner {
            color: #0b3d91;
            animation: profile-spin 0.8s linear infinite;
          }

          @keyframes profile-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="profile-settings-page">
      <header className="profile-page-header">
        <div>
          <div className="profile-title-row">
            <User size={35} strokeWidth={2.3} aria-hidden="true" />
            <h1>Profile Settings</h1>
          </div>

          <p>
            Manage your account information, communication preferences, and
            password.
          </p>
        </div>

        <button
          type="button"
          className="profile-refresh-button"
          onClick={loadCustomerProfile}
          disabled={loading}
        >
          <RefreshCw size={18} aria-hidden="true" />
          Refresh
        </button>
      </header>

      {profileMessage.type === "error" && !customer ? (
        <section className="profile-card">
          {renderMessage(profileMessage)}

          <button
            type="button"
            className="profile-primary-button profile-retry-button"
            onClick={loadCustomerProfile}
          >
            <RefreshCw size={18} aria-hidden="true" />
            Try Again
          </button>
        </section>
      ) : (
        <>
          <section className="profile-summary-grid">
            <article className="profile-summary-card">
              <div className="profile-summary-icon profile-blue-icon">
                <ShieldCheck size={23} aria-hidden="true" />
              </div>

              <div>
                <span>EKON ID</span>
                <strong>{customer?.ekonId || "Not available"}</strong>
              </div>
            </article>

            <article className="profile-summary-card">
              <div className="profile-summary-icon profile-green-icon">
                <CheckCircle2 size={23} aria-hidden="true" />
              </div>

              <div>
                <span>Account Status</span>
                <strong>{customer?.status || "Not available"}</strong>
              </div>
            </article>

            <article className="profile-summary-card">
              <div className="profile-summary-icon profile-orange-icon">
                <Building2 size={23} aria-hidden="true" />
              </div>

              <div>
                <span>Home Branch</span>
                <strong>{customer?.branch || "Not assigned"}</strong>
              </div>
            </article>
          </section>

          <section className="profile-card warehouse-address-card">
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <MapPin size={24} aria-hidden="true" />
              </div>

              <div>
                <h2>Your Official EKON Warehouse Address</h2>
                <p>
                  Use this exact address when shipping packages to the EKON
                  warehouse.
                </p>
              </div>
            </div>

            <div className="warehouse-address-grid">
              <div className="warehouse-field">
                <span>1. Name</span>
                <strong>
                  {customer?.name ? `${customer.name} EKON` : "EKON Customer"}
                </strong>
              </div>

              <div className="warehouse-field">
                <span>2. Address Line 1</span>
                <strong>2099 NW 141st St</strong>
              </div>

              <div className="warehouse-field">
                <span>3. Address Line 2</span>
                <strong>Unit 8 {customer?.ekonId || ""}</strong>
              </div>

              <div className="warehouse-field">
                <span>4. City</span>
                <strong>Opa-Locka</strong>
              </div>

              <div className="warehouse-field">
                <span>5. State</span>
                <strong>Florida</strong>
              </div>

              <div className="warehouse-field">
                <span>6. ZIP</span>
                <strong>33054</strong>
              </div>

              <div className="warehouse-field">
                <span>7. Country</span>
                <strong>USA</strong>
              </div>
            </div>

            <div className="warehouse-note">
              Include your EKON ID exactly as shown in Address Line 2 so your
              packages can be assigned correctly.
            </div>
          </section>

          <form className="profile-card" onSubmit={saveProfile}>
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <User size={24} aria-hidden="true" />
              </div>

              <div>
                <h2>Personal Information</h2>
                <p>Keep your contact details accurate and up to date.</p>
              </div>
            </div>

            {renderMessage(profileMessage)}

            <div className="profile-form-grid">
              <label className="profile-field profile-full-field">
                <span>Full Name</span>

                <div className="profile-input-wrapper">
                  <User size={18} aria-hidden="true" />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={savingProfile}
                    required
                  />
                </div>
              </label>

              <label className="profile-field">
                <span>Email Address</span>

                <div className="profile-input-wrapper">
                  <Mail size={18} aria-hidden="true" />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    disabled={savingProfile}
                    required
                  />
                </div>
              </label>

              <label className="profile-field">
                <span>Phone Number</span>

                <div className="profile-input-wrapper">
                  <Phone size={18} aria-hidden="true" />

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    disabled={savingProfile}
                    required
                  />
                </div>
              </label>
            </div>

            <div className="marketing-preference-box">
              <div className="marketing-preference-content">
                <div className="marketing-icon">
                  <Megaphone size={22} aria-hidden="true" />
                </div>

                <div>
                  <strong>Promotions and Marketing Updates</strong>
                  <p>
                    Receive special offers, service announcements, and
                    promotional updates from Eltham Konnect.
                  </p>
                </div>
              </div>

              <label className="profile-switch">
                <input
                  type="checkbox"
                  name="marketingOptIn"
                  checked={Boolean(formData.marketingOptIn)}
                  onChange={handleProfileChange}
                  disabled={savingProfile}
                />

                <span className="profile-switch-track">
                  <span className="profile-switch-thumb" />
                </span>

                <strong>
                  {formData.marketingOptIn ? "Subscribed" : "Unsubscribed"}
                </strong>
              </label>
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="profile-primary-button"
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <RefreshCw
                    className="profile-spinner"
                    size={18}
                    aria-hidden="true"
                  />
                ) : (
                  <Save size={18} aria-hidden="true" />
                )}

                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>

          <form className="profile-card" onSubmit={changePassword}>
            <div className="profile-section-heading">
              <div className="profile-section-icon">
                <LockKeyhole size={24} aria-hidden="true" />
              </div>

              <div>
                <h2>Change Password</h2>
                <p>
                  Confirm your current password before choosing a new password.
                </p>
              </div>
            </div>

            {renderMessage(passwordMessage)}

            <div className="profile-password-grid">
              <label className="profile-field profile-full-field">
                <span>Current Password</span>

                <div className="profile-input-wrapper">
                  <LockKeyhole size={18} aria-hidden="true" />

                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    disabled={changingPassword}
                  />

                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() =>
                      setShowCurrentPassword((currentValue) => !currentValue)
                    }
                    aria-label={
                      showCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={19} aria-hidden="true" />
                    ) : (
                      <Eye size={19} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </label>

              <label className="profile-field">
                <span>New Password</span>

                <div className="profile-input-wrapper">
                  <LockKeyhole size={18} aria-hidden="true" />

                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    disabled={changingPassword}
                  />

                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() =>
                      setShowNewPassword((currentValue) => !currentValue)
                    }
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff size={19} aria-hidden="true" />
                    ) : (
                      <Eye size={19} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </label>

              <label className="profile-field">
                <span>Confirm New Password</span>

                <div className="profile-input-wrapper">
                  <LockKeyhole size={18} aria-hidden="true" />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter the new password again"
                    autoComplete="new-password"
                    disabled={changingPassword}
                  />

                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((currentValue) => !currentValue)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmed password"
                        : "Show confirmed password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} aria-hidden="true" />
                    ) : (
                      <Eye size={19} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </label>
            </div>

            <div className="password-security-note">
              <ShieldCheck size={20} aria-hidden="true" />

              <span>
                Use at least 6 characters and avoid reusing your current
                password.
              </span>
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="profile-password-button"
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <RefreshCw
                    className="profile-spinner"
                    size={18}
                    aria-hidden="true"
                  />
                ) : (
                  <LockKeyhole size={18} aria-hidden="true" />
                )}

                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </>
      )}

      <style>{`
        .profile-settings-page {
          color: #0f172a;
          padding-bottom: 28px;
        }

        .profile-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .profile-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #0b3d91;
        }

        .profile-title-row h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(29px, 4vw, 38px);
          line-height: 1.1;
        }

        .profile-page-header p {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 16px;
        }

        .profile-refresh-button,
        .profile-primary-button,
        .profile-password-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 0;
          border-radius: 11px;
          padding: 12px 19px;
          color: #ffffff;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            opacity 0.18s ease,
            box-shadow 0.18s ease;
        }

        .profile-refresh-button {
          min-width: 120px;
          background: #16a34a;
        }

        .profile-primary-button {
          min-width: 170px;
          background: #0b3d91;
        }

        .profile-password-button {
          min-width: 190px;
          background: #16a34a;
        }

        .profile-refresh-button:hover:not(:disabled),
        .profile-primary-button:hover:not(:disabled),
        .profile-password-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
        }

        .profile-refresh-button:disabled,
        .profile-primary-button:disabled,
        .profile-password-button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .profile-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .profile-summary-card {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: 96px;
          padding: 17px;
          background: #ffffff;
          border: 1px solid #dbe3ef;
          border-radius: 17px;
        }

        .profile-summary-icon {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          display: grid;
          place-items: center;
          border-radius: 13px;
        }

        .profile-blue-icon {
          color: #0b3d91;
          background: #eef4ff;
        }

        .profile-green-icon {
          color: #16a34a;
          background: #ecfdf3;
        }

        .profile-orange-icon {
          color: #f15a24;
          background: #fff7ed;
        }

        .profile-summary-card span,
        .warehouse-field span {
          display: block;
          margin-bottom: 5px;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .profile-summary-card strong {
          display: block;
          overflow-wrap: anywhere;
          color: #0f172a;
          font-size: 17px;
        }

        .profile-card {
          margin-bottom: 22px;
          padding: 22px;
          background: #ffffff;
          border: 1px solid #dbe3ef;
          border-radius: 18px;
        }

        .warehouse-address-card {
          border-color: #bfdbfe;
          background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
        }

        .profile-section-heading {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          margin-bottom: 20px;
        }

        .profile-section-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          color: #ffffff;
          background: #0b3d91;
        }

        .profile-section-heading h2 {
          margin: 0;
          color: #0f172a;
          font-size: 24px;
          line-height: 1.2;
        }

        .profile-section-heading p {
          margin: 5px 0 0;
          color: #64748b;
          line-height: 1.5;
        }

        .warehouse-address-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 11px;
        }

        .warehouse-field {
          min-width: 0;
          padding: 14px;
          border: 1px solid #dbe3ef;
          border-radius: 12px;
          background: #ffffff;
        }

        .warehouse-field strong {
          display: block;
          overflow-wrap: anywhere;
          color: #0f172a;
          font-size: 16px;
        }

        .warehouse-note {
          margin-top: 14px;
          padding: 12px 14px;
          border-left: 4px solid #f15a24;
          border-radius: 0 9px 9px 0;
          color: #9a3412;
          background: #fff7ed;
          line-height: 1.5;
        }

        .profile-form-grid,
        .profile-password-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .profile-full-field {
          grid-column: 1 / -1;
        }

        .profile-field {
          min-width: 0;
          display: grid;
          gap: 7px;
        }

        .profile-field > span {
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
        }

        .profile-input-wrapper {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          border: 1px solid #cbd5e1;
          border-radius: 11px;
          color: #64748b;
          background: #ffffff;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .profile-input-wrapper:focus-within {
          border-color: #0b3d91;
          box-shadow: 0 0 0 3px rgba(11, 61, 145, 0.1);
          color: #0b3d91;
        }

        .profile-input-wrapper input {
          min-width: 0;
          width: 100%;
          border: 0;
          outline: 0;
          padding: 13px 0;
          color: #0f172a;
          background: transparent;
          font: inherit;
        }

        .profile-input-wrapper input::placeholder {
          color: #94a3b8;
        }

        .profile-input-wrapper input:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .profile-password-toggle {
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          padding: 7px;
          border: 0;
          border-radius: 7px;
          color: #64748b;
          background: transparent;
          cursor: pointer;
        }

        .profile-password-toggle:hover {
          color: #0b3d91;
          background: #eef4ff;
        }

        .marketing-preference-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          margin-top: 19px;
          padding: 16px;
          border: 1px solid #dbe3ef;
          border-radius: 13px;
          background: #f8fafc;
        }

        .marketing-preference-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .marketing-icon {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          color: #f15a24;
          background: #fff7ed;
        }

        .marketing-preference-content strong {
          color: #0f172a;
        }

        .marketing-preference-content p {
          margin: 5px 0 0;
          color: #64748b;
          line-height: 1.45;
        }

        .profile-switch {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 9px;
          color: #334155;
          cursor: pointer;
        }

        .profile-switch input {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          opacity: 0;
        }

        .profile-switch-track {
          width: 48px;
          height: 26px;
          display: flex;
          align-items: center;
          padding: 3px;
          border-radius: 999px;
          background: #cbd5e1;
          transition: background 0.2s ease;
        }

        .profile-switch-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.22);
          transition: transform 0.2s ease;
        }

        .profile-switch input:checked + .profile-switch-track {
          background: #16a34a;
        }

        .profile-switch input:checked + .profile-switch-track .profile-switch-thumb {
          transform: translateX(22px);
        }

        .profile-switch input:focus-visible + .profile-switch-track {
          outline: 3px solid rgba(11, 61, 145, 0.2);
        }

        .profile-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 19px;
        }

        .profile-message {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 17px;
          padding: 12px 14px;
          border: 1px solid;
          border-radius: 11px;
          font-weight: 700;
          line-height: 1.45;
        }

        .profile-message-success {
          color: #166534;
          border-color: #86efac;
          background: #f0fdf4;
        }

        .profile-message-error {
          color: #b91c1c;
          border-color: #fca5a5;
          background: #fef2f2;
        }

        .password-security-note {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 10px;
          color: #475569;
          background: #f8fafc;
          line-height: 1.45;
        }

        .password-security-note svg {
          flex: 0 0 auto;
          color: #0b3d91;
        }

        .profile-retry-button {
          margin-top: 4px;
        }

        .profile-spinner {
          animation: profile-spin 0.8s linear infinite;
        }

        @keyframes profile-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .profile-summary-grid {
            grid-template-columns: 1fr;
          }

          .warehouse-address-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .profile-page-header {
            align-items: stretch;
            flex-direction: column;
          }

          .profile-refresh-button {
            align-self: flex-start;
          }

          .profile-form-grid,
          .profile-password-grid {
            grid-template-columns: 1fr;
          }

          .profile-full-field {
            grid-column: auto;
          }

          .marketing-preference-box {
            align-items: flex-start;
            flex-direction: column;
          }

          .profile-actions {
            justify-content: stretch;
          }

          .profile-primary-button,
          .profile-password-button {
            width: 100%;
          }
        }

        @media (max-width: 500px) {
          .profile-title-row {
            align-items: flex-start;
          }

          .profile-title-row h1 {
            font-size: 28px;
          }

          .profile-refresh-button {
            width: 100%;
          }

          .profile-card {
            padding: 16px;
            border-radius: 15px;
          }

          .profile-section-heading h2 {
            font-size: 21px;
          }

          .warehouse-address-grid {
            grid-template-columns: 1fr;
          }

          .profile-summary-card {
            min-height: 84px;
          }

          .profile-switch {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}

export default ProfileSettings;