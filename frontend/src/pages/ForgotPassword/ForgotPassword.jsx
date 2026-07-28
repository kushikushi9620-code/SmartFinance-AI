import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // STEP 1 - Send OTP
  const sendOTP = async () => {
    if (!email) {
      alert("Please enter your registered email");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "https://smartfinance-backend-kushi.onrender.com/forgot-password",
        {
          email: email,
        }
      );

      alert(response.data.message);

      setStep(2);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Unable to connect to the backend server.");
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 - Verify OTP
  const verifyOTP = async () => {
    if (!otp) {
      alert("Please enter the OTP");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "https://smartfinance-backend-kushi.onrender.com/verify-otp",
        {
          email: email,
          otp: otp,
        }
      );

      alert(response.data.message);

      setStep(3);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Unable to connect to the backend server.");
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 - Reset Password
  const resetPassword = async () => {
    if (!newPassword) {
      alert("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must contain at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "https://smartfinance-backend-kushi.onrender.com/reset-password",
        {
          email: email,
          new_password: newPassword,
        }
      );

      alert(response.data.message);

      navigate("/");
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Unable to connect to the backend server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-box">

        <h1>🔐 Forgot Password</h1>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <p>
              Enter your registered email address to receive an OTP.
            </p>

            <input
              type="email"
              placeholder="Registered Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button onClick={sendOTP} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <p>
              Enter the OTP sent to <b>{email}</b>
            </p>

            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button onClick={verifyOTP} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <p>Enter your new password.</p>

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button onClick={resetPassword} disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </>
        )}

        <p
          className="back-login"
          onClick={() => navigate("/")}
        >
          ← Back to Login
        </p>

      </div>
    </div>
  );
}

export default ForgotPassword;