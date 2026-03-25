import { useEffect, useState } from "react";
import api from "../api";

function ProfileSettings() {
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("ek_customer_data");
    return saved ? JSON.parse(saved) : null;
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    marketingOptIn: true,
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const loadCustomerProfile = async () => {
    try {
      const res = await api.get("/api/customer-auth/me");
      const profile = res.data.data;

      setCustomer(profile);
      localStorage.setItem("ek_customer_data", JSON.stringify(profile));

      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        marketingOptIn:
          profile.marketingOptIn !== undefined ? profile.marketingOptIn : true,
      });
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to load profile.");
    }
  };

  useEffect(() => {
    loadCustomerProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const saveProfile = async () => {
    try {
      if (!customer?.ekonId) {
        alert("Customer profile not loaded.");
        return;
      }

      await api.put(`/api/customers/${customer.ekonId}`, formData);

      const updatedCustomer = {
        ...customer,
        ...formData,
      };

      setCustomer(updatedCustomer);
      localStorage.setItem("ek_customer_data", JSON.stringify(updatedCustomer));

      alert("Profile updated");
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to update profile.");
    }
  };

  const changePassword = async () => {
    try {
      if (!customer?.ekonId) {
        alert("Customer profile not loaded.");
        return;
      }

      if (!passwordData.newPassword) {
        alert("Please enter a new password");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      await api.put(`/api/customers/${customer.ekonId}/reset-password`, {
        password: passwordData.newPassword,
      });

      alert("Password updated");

      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to update password.");
    }
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <h1 style={{ marginTop: 0, marginBottom: "18px", color: "#0f172a" }}>
        Profile Settings
      </h1>

      <div className="card">
        <h2>Account Information</h2>
        <p><strong>EKON ID:</strong> {customer?.ekonId}</p>
        <p><strong>Status:</strong> {customer?.status}</p>
        <p><strong>Branch:</strong> {customer?.branch}</p>
      </div>

      <div className="card">
        <h2>Your Mailbox Address</h2>
        <div className="address">
          <div><strong>1. Name:</strong> {customer?.name} EKON</div>
          <div><strong>2. Address Line 1:</strong> 1447 Banks Road</div>
          <div><strong>3. Address Line 2:</strong> {customer?.ekonId}</div>
          <div><strong>4. City:</strong> Margate</div>
          <div><strong>5. State:</strong> Florida</div>
          <div><strong>6. ZIP:</strong> 33063</div>
        </div>
      </div>

      <div className="card">
        <h2>Edit Profile</h2>

        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
        />

        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
        />

        <input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone"
        />

        <button onClick={saveProfile}>Save Changes</button>
      </div>

      <div className="card">
        <h2>Marketing Preferences</h2>

        <div className="preferenceBox">
          <div>
            <strong>Receive Promotions and Marketing Updates</strong>
            <p style={{ margin: "6px 0 0 0", color: "#475569" }}>
              Turn this off if you do not want promotional messages, offers, or
              marketing updates from Eltham Konnect.
            </p>
          </div>

          <label className="toggleRow">
            <input
              type="checkbox"
              name="marketingOptIn"
              checked={!!formData.marketingOptIn}
              onChange={handleChange}
            />
            <span>
              {formData.marketingOptIn ? "Subscribed" : "Unsubscribed"}
            </span>
          </label>
        </div>

        <button onClick={saveProfile}>
          Save Marketing Preference
        </button>
      </div>

      <div className="card">
        <h2>Change Password</h2>

        <input
          type="password"
          name="newPassword"
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          placeholder="New Password"
        />

        <input
          type="password"
          name="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          placeholder="Confirm Password"
        />

        <button className="greenButton" onClick={changePassword}>
          Update Password
        </button>
      </div>

      <style>{`
        .card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
          display: grid;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        h2 {
          margin-top: 0;
          margin-bottom: 6px;
          color: #0B3D91;
        }

        input {
          padding: 10px;
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          box-sizing: border-box;
        }

        button {
          background: #0B3D91;
          color: white;
          padding: 10px 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .greenButton {
          background: #16a34a;
        }

        .address {
          line-height: 1.8;
          color: #334155;
        }

        .preferenceBox {
          display: grid;
          gap: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          background: #f8fafc;
        }

        .toggleRow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: bold;
          color: #334155;
        }

        .toggleRow input {
          width: auto;
          transform: scale(1.2);
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 22px;
          }

          .card {
            padding: 15px;
          }

          button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default ProfileSettings;