import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [login, setLogin] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setLogin({
      ...login,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async () => {
    if (!login.email || !login.password) {
      alert("Please enter Email and Password");
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/login",
        {
          email: login.email,
          password: login.password,
        }
      );

      // Save logged-in user details
      localStorage.setItem("user_id", response.data.user_id);
      localStorage.setItem("user_name", response.data.name);
      localStorage.setItem("user_email", response.data.email);

      alert(response.data.message);

      navigate("/dashboard");

    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Unable to connect to the backend server.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">

        <h1>💰 SmartFinance AI</h1>
        <p>Manage your finances smarter with AI</p>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={login.email}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={login.password}
          onChange={handleChange}
        />

        {/* Forgot Password */}
        <p
          style={{
            textAlign: "right",
            color: "#2563eb",
            cursor: "pointer",
            marginTop: "8px",
            marginBottom: "15px",
          }}
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password?
        </p>

        <button onClick={handleLogin}>
          Login
        </button>

        <p className="signup-text">
          Don't have an account?{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>

      </div>
    </div>
  );
}

export default Login;