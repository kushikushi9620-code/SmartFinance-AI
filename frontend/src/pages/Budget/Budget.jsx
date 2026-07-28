import { useState, useEffect } from "react";
import axios from "axios";
import "./Budget.css";

function Budget() {
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState(0);
  const [calculated, setCalculated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get logged-in user's ID
  const userId = localStorage.getItem("user_id");

  // Automatically get this user's expenses
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const response = await axios.get(
          `https://smartfinance-backend-kushi.onrender.com/expenses/${userId}`
        );

        const totalExpense = response.data.reduce(
          (total, item) => total + Number(item.amount),
          0
        );

        setExpense(totalExpense);
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

  const balance =
    (Number(income) || 0) - (Number(expense) || 0);

  const savingsPercentage =
    Number(income) > 0
      ? (balance / Number(income)) * 100
      : 0;

  let status = "";
  let suggestion = "";

  if (calculated) {
    if (balance < 0) {
      status = "🔴 Over Budget";
      suggestion =
        "Your expenses are higher than your income. Try reducing unnecessary expenses.";
    } else if (savingsPercentage >= 20) {
      status = "🟢 Good Budget";
      suggestion =
        "Great! You are saving at least 20% of your income. Continue maintaining this spending pattern.";
    } else if (savingsPercentage >= 10) {
      status = "🟡 Moderate Budget";
      suggestion =
        "Your budget is manageable, but try to increase your savings to at least 20% of your income.";
    } else {
      status = "🟠 Low Savings";
      suggestion =
        "Your savings are low. Consider reducing non-essential spending to improve your financial health.";
    }
  }

  const calculateBudget = () => {
    if (!income) {
      alert("Please enter your monthly income");
      return;
    }

    if (Number(income) <= 0) {
      alert("Please enter a valid monthly income");
      return;
    }

    setCalculated(true);
  };

  return (
    <div className="budget-container">
      <h1>Budget Planner</h1>

      <div className="budget-card">

        <input
          type="number"
          placeholder="Monthly Income"
          value={income}
          onChange={(e) => {
            setIncome(e.target.value);
            setCalculated(false);
          }}
        />

        <div className="expense-display">
          <h3>Your Total Expenses</h3>

          {loading ? (
            <p>Loading expenses...</p>
          ) : (
            <p>₹ {Number(expense).toFixed(2)}</p>
          )}
        </div>

        <button
          onClick={calculateBudget}
          disabled={loading}
        >
          Calculate Budget
        </button>

        {calculated && (
          <div className="result">

            <h3>Monthly Income</h3>
            <p>₹ {Number(income).toFixed(2)}</p>

            <h3>Total Expenses</h3>
            <p>₹ {Number(expense).toFixed(2)}</p>

            <h3>Remaining Balance</h3>
            <p className="balance">
              ₹ {balance.toFixed(2)}
            </p>

            <h3>Savings Percentage</h3>
            <p>{savingsPercentage.toFixed(1)}%</p>

            <h3>Budget Status</h3>
            <p>{status}</p>

            <h3>Recommendation</h3>
            <p>{suggestion}</p>

          </div>
        )}

      </div>
    </div>
  );
}

export default Budget;