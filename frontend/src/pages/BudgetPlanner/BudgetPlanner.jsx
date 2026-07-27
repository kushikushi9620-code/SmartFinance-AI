import { useEffect, useState } from "react";
import axios from "axios";

function BudgetPlanner() {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState(0);
  const [savings, setSavings] = useState(0);
  const [savingsPercentage, setSavingsPercentage] = useState(0);
  const [status, setStatus] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("user_id");

  // Get logged-in user's expenses automatically
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const response = await axios.get(
          `https://smartfinance-ai-ycjp.onrender.com/expenses/${userId}`
        );

        const total = response.data.reduce(
          (sum, item) => sum + Number(item.amount),
          0
        );

        setExpenses(total);
      } catch (error) {
        console.log("Error loading expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadExpenses();
    } else {
      setLoading(false);
    }
  }, [userId]);

  // Calculate budget and save income
  const calculateBudget = async () => {
    if (!income || Number(income) <= 0) {
      alert("Please enter a valid monthly income");
      return;
    }

    try {
      // Save user's income in database
      await axios.post(
        "https://smartfinance-ai-ycjp.onrender.com/save-income",
        {
          user_id: userId,
          income: Number(income),
        }
      );

      const incomeAmount = Number(income);
      const save = incomeAmount - expenses;
      const percentage = (save / incomeAmount) * 100;

      setSavings(save);
      setSavingsPercentage(percentage);

      // Budget status and recommendation
      if (save < 0) {
        setStatus("🔴 Over Budget");

        setSuggestion(
          "Your expenses are higher than your income. Try reducing unnecessary expenses."
        );
      } else if (percentage >= 20) {
        setStatus("🟢 Good Budget");

        setSuggestion(
          "Great! You are saving at least 20% of your income. Continue maintaining this spending pattern."
        );
      } else if (percentage >= 10) {
        setStatus("🟡 Moderate Budget");

        setSuggestion(
          "Your budget is manageable, but try to increase your savings to at least 20% of your income."
        );
      } else {
        setStatus("🟠 Low Savings");

        setSuggestion(
          "Your savings are low. Try reducing non-essential spending to improve your financial health."
        );
      }
    } catch (error) {
      console.log("Error saving income:", error);
      alert("Failed to save income");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Budget Planner</h1>

      <input
        type="number"
        placeholder="Monthly Income"
        value={income}
        onChange={(e) => setIncome(e.target.value)}
      />

      <br />
      <br />

      <h3>Total Expenses</h3>

      {loading ? (
        <p>Loading expenses...</p>
      ) : (
        <p>₹{expenses.toFixed(2)}</p>
      )}

      <br />

      <button
        onClick={calculateBudget}
        disabled={loading}
      >
        Calculate Budget
      </button>

      <hr />

      {status && (
        <>
          <h2>Savings: ₹{savings.toFixed(2)}</h2>

          <h3>
            Savings Percentage: {savingsPercentage.toFixed(1)}%
          </h3>

          <h2>{status}</h2>

          <h3>Recommendation</h3>

          <p>{suggestion}</p>
        </>
      )}
    </div>
  );
}

export default BudgetPlanner;