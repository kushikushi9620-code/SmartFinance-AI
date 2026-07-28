import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    savings: 0,
  });

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const user_id = localStorage.getItem("user_id");

      const response = await axios.get(
        `https://smartfinance-backend-kushi.onrender.com/dashboard-summary/${user_id}`
      );

      setSummary(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Download PDF
  const downloadReport = () => {
    const user_id = localStorage.getItem("user_id");

    window.open(
      `https://smartfinance-backend-kushi.onrender.com/download-report/${user_id}`,
      "_blank"
    );
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");

    alert("Logged Out Successfully");

    navigate("/");
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>💰 SmartFinance AI</h2>

        <ul>
          <li onClick={() => navigate("/dashboard")}>
            🏠 Dashboard
          </li>

          <li onClick={() => navigate("/expenses")}>
            💳 Expenses
          </li>

          <li onClick={() => navigate("/analytics")}>
            📊 Analytics
          </li>

          <li onClick={() => navigate("/budget")}>
            🎯 Budget Planner
          </li>

          <li onClick={() => navigate("/goals")}>
            🎯 Financial Goals
          </li>

          <li onClick={() => navigate("/aiadvisor")}>
            🤖 AI Advisor
          </li>

          <li onClick={() => navigate("/profile")}>
            👤 Profile
          </li>

          <li onClick={logout}>
            🚪 Logout
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1>Welcome 👋</h1>
        <p>Manage your finances smarter with AI.</p>

        <div className="cards">
          <div className="card">
            <h3>Total Income</h3>
            <h2>Rs. {summary.income}</h2>
          </div>

          <div className="card">
            <h3>Total Expenses</h3>
            <h2>Rs. {summary.expenses}</h2>
          </div>

          <div className="card">
            <h3>Total Savings</h3>
            <h2>Rs. {summary.savings}</h2>
          </div>
        </div>

        <br />

        <button onClick={downloadReport}>
          📄 Download PDF Report
        </button>
      </div>
    </div>
  );
}

export default Dashboard;