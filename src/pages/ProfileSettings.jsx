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
      console.error("Error loading customer profile:", error);
      alert(error?.response?.data?.message || "Failed to load profile.");
    }
  };

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
      });
    }

    loadCustomerProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData({
      ...passwordData,
      [name]: value,
    });
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

      alert("Profile updated successfully");
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to update profile");
    }
  };

  const changePassword = async () => {
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

    try {
      await api.put(`/api/customers/${customer.ekonId}/reset-password`, {
        password: passwordData.newPassword,
      });

      alert("Password updated successfully");

      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <div>
      <h1>Profile Settings</h1>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Account Information</h2>

        <p><strong>EKON ID:</strong> {customer?.ekonId || ""}</p>
        <p><strong>Status:</strong> {customer?.status || ""}</p>
        <p><strong>Branch:</strong> {customer?.branch || ""}</p>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Your Mailbox Address</h2>

        <div style={{ lineHeight: "1.8" }}>
          <div><strong>1. Name:</strong> {customer?.name || ""} EKON</div>
          <div><strong>2. Address Line 1:</strong> 1447 Banks Road</div>
          <div><strong>3. Address Line 2:</strong> {customer?.ekonId || ""}</div>
          <div><strong>4. City:</strong> Margate</div>
          <div><strong>5. State:</strong> Florida</div>
          <div><strong>6. ZIP:</strong> 33063</div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Edit Profile</h2>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
        />

        <button
          onClick={saveProfile}
          style={{
            backgroundColor: "#0B3D91",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Save Changes
        </button>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Change Password</h2>

        <input
          type="password"
          name="newPassword"
          placeholder="New Password"
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
        />

        <button
          onClick={changePassword}
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Update Password
        </button>
      </div>
    </div>
  );
}

export default ProfileSettings;