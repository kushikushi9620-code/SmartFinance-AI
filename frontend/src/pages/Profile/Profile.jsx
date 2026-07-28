import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  // Get currently logged-in user's details
  const userId = localStorage.getItem("user_id");
  const name = localStorage.getItem("user_name");
  const email = localStorage.getItem("user_email");

  // Change password form
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Handle password input
  const handleChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  // Change Password
  const handleChangePassword = async () => {
    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      alert("Please fill all password fields");
      return;
    }

    // Check minimum password length
    if (passwords.newPassword.length < 6) {
      alert("New password must contain at least 6 characters");
      return;
    }

    // Check new password and confirm password
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }

    // Current and new password should not be same
    if (passwords.currentPassword === passwords.newPassword) {
      alert("New password must be different from current password");
      return;
    }

    try {
      const response = await axios.put(
        "https://smartfinance-backend-kushi.onrender.com/change-password",
        {
          user_id: userId,
          current_password: passwords.currentPassword,
          new_password: passwords.newPassword,
        }
      );

      alert(response.data.message);

      // Clear password fields
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Close change password form
      setShowChangePassword(false);
    } catch (error) {
      console.log("Change password error:", error);

      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Unable to connect to backend server");
      }
    }
  };

  // Cancel Change Password
  const handleCancel = () => {
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowChangePassword(false);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");

    navigate("/");
  };

  return (
    <div className="profile-container">
      <div className="profile-card">

        <h1>👤 User Profile</h1>

        <h3>Name</h3>
        <p>{name || "User"}</p>

        <h3>Email</h3>
        <p>{email || "Email not available"}</p>

        {/* Change Password Button */}
        {!showChangePassword && (
          <button
            onClick={() => setShowChangePassword(true)}
            style={{ marginBottom: "12px" }}
          >
            🔐 Change Password
          </button>
        )}

        {/* Change Password Form */}
        {showChangePassword && (
          <div className="change-password-section">

            <h3>🔐 Change Password</h3>

            <input
              type="password"
              name="currentPassword"
              placeholder="Current Password"
              value={passwords.currentPassword}
              onChange={handleChange}
            />

            <br />
            <br />

            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={passwords.newPassword}
              onChange={handleChange}
            />

            <br />
            <br />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={passwords.confirmPassword}
              onChange={handleChange}
            />

            <br />
            <br />

            <button onClick={handleChangePassword}>
              Update Password
            </button>

            <button
              onClick={handleCancel}
              style={{ marginTop: "10px" }}
            >
              Cancel
            </button>

          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{ marginTop: "12px" }}
        >
          Logout
        </button>

      </div>
    </div>
  );
}

export default Profile;