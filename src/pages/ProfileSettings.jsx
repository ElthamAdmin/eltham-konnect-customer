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
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadCustomerProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const saveProfile = async () => {
    await api.put(`/api/customers/${customer.ekonId}`, formData);
    alert("Profile updated");
  };

  const changePassword = async () => {
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
  };

  return (
    <div>
      <h1>Profile Settings</h1>

      {/* INFO */}
      <div className="card">
        <h2>Account Information</h2>
        <p><strong>EKON ID:</strong> {customer?.ekonId}</p>
        <p><strong>Status:</strong> {customer?.status}</p>
        <p><strong>Branch:</strong> {customer?.branch}</p>
      </div>

      {/* ADDRESS */}
      <div className="card">
        <h2>Mailbox Address</h2>
        <div className="address">
          <div>{customer?.name} EKON</div>
          <div>1447 Banks Road</div>
          <div>{customer?.ekonId}</div>
          <div>Margate, Florida 33063</div>
        </div>
      </div>

      {/* EDIT */}
      <div className="card">
        <h2>Edit Profile</h2>

        <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
        <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
        <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />

        <button onClick={saveProfile}>Save</button>
      </div>

      {/* PASSWORD */}
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

        <button onClick={changePassword}>Update Password</button>
      </div>

      {/* CSS */}
      <style>{`
        .card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #ddd;
          margin-bottom: 20px;
          display: grid;
          gap: 10px;
        }

        input {
          padding: 10px;
          width: 100%;
        }

        button {
          background: #0B3D91;
          color: white;
          padding: 10px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .address {
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 20px;
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