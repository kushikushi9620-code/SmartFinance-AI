import { useState, useEffect } from "react";
import axios from "axios";

function Goals() {
  const [goal, setGoal] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState(0);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const user_id = localStorage.getItem("user_id");

  // ---------------- LOAD CURRENT SAVINGS ----------------

  const loadSavings = async () => {
    try {
      const response = await axios.get(
        `https://smartfinance-ai-ycjp.onrender.com/dashboard-summary/${user_id}`
      );

      const currentSavings = Number(response.data.savings) || 0;

      // Don't use negative savings for goal progress
      setSaved(currentSavings > 0 ? currentSavings : 0);

    } catch (error) {
      console.log("Error loading savings:", error);
    }
  };

  // ---------------- LOAD SAVED GOALS ----------------

  const loadGoals = async () => {
    try {
      const response = await axios.get(
        `https://smartfinance-ai-ycjp.onrender.com/goals/${user_id}`
      );

      setGoals(response.data);

    } catch (error) {
      console.log("Error loading goals:", error);
    }
  };

  // ---------------- LOAD PAGE DATA ----------------

  useEffect(() => {
    const loadData = async () => {
      if (!user_id) {
        setLoading(false);
        return;
      }

      await Promise.all([
        loadSavings(),
        loadGoals()
      ]);

      setLoading(false);
    };

    loadData();
  }, [user_id]);

  // ---------------- CURRENT GOAL PROGRESS ----------------

  const targetAmount = Number(target) || 0;

  const amountForGoal =
    targetAmount > 0
      ? Math.min(saved, targetAmount)
      : 0;

  const progress =
    targetAmount > 0
      ? Math.min((amountForGoal / targetAmount) * 100, 100)
      : 0;

  const remaining =
    targetAmount > 0
      ? Math.max(targetAmount - amountForGoal, 0)
      : 0;

  // ---------------- SAVE GOAL ----------------

  const saveGoal = async () => {
    if (!goal.trim() || !target) {
      alert("Please enter Goal Name and Target Amount");
      return;
    }

    if (Number(target) <= 0) {
      alert("Please enter a valid Target Amount");
      return;
    }

    try {
      const response = await axios.post(
        "https://smartfinance-ai-ycjp.onrender.com/add-goal",
        {
          user_id: Number(user_id),
          goal: goal.trim(),
          target: Number(target),
          saved: amountForGoal,
        }
      );

      alert(response.data.message);

      setGoal("");
      setTarget("");

      await loadGoals();

    } catch (error) {
      console.log("Error saving goal:", error);

      if (error.response) {
        alert(error.response.data.message || "Failed to save goal");
      } else {
        alert("Failed to save goal");
      }
    }
  };

  return (
    <div style={{ padding: "30px" }}>

      <h1>🎯 Financial Goals</h1>

      {/* GOAL NAME */}

      <input
        type="text"
        placeholder="Goal Name"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />

      <br />
      <br />

      {/* TARGET AMOUNT */}

      <input
        type="number"
        placeholder="Target Amount"
        value={target}
        min="1"
        onChange={(e) => setTarget(e.target.value)}
      />

      <br />
      <br />

      {/* AUTOMATIC SAVINGS */}

      <h3>Available Savings</h3>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <p>₹{saved.toFixed(2)}</p>
      )}

      <br />

      <button
        onClick={saveGoal}
        disabled={loading}
      >
        Save Goal
      </button>

      <hr />

      {/* CURRENT GOAL PREVIEW */}

      {goal && targetAmount > 0 && (
        <>
          <h2>{goal}</h2>

          <p>
            🎯 Target: ₹{targetAmount.toFixed(2)}
          </p>

          <p>
            💰 Saved: ₹{amountForGoal.toFixed(2)}
          </p>

          <p>
            📈 Progress: {progress.toFixed(1)}%
          </p>

          <p>
            Remaining: ₹{remaining.toFixed(2)}
          </p>

          <hr />
        </>
      )}

      {/* SAVED GOALS */}

      <h2>Saved Goals</h2>

      {goals.length === 0 ? (
        <p>No financial goals added yet.</p>
      ) : (
        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th>Goal</th>
              <th>Target</th>
              <th>Saved</th>
              <th>Remaining</th>
              <th>Progress</th>
            </tr>
          </thead>

          <tbody>
            {goals.map((item) => {
              const itemTarget = Number(item.target) || 0;
              const itemSaved = Number(item.saved) || 0;

              const itemProgress =
                itemTarget > 0
                  ? Math.min(
                      (itemSaved / itemTarget) * 100,
                      100
                    )
                  : 0;

              const itemRemaining = Math.max(
                itemTarget - itemSaved,
                0
              );

              return (
                <tr key={item.id}>
                  <td>{item.goal}</td>

                  <td>
                    ₹{itemTarget.toFixed(2)}
                  </td>

                  <td>
                    ₹{itemSaved.toFixed(2)}
                  </td>

                  <td>
                    ₹{itemRemaining.toFixed(2)}
                  </td>

                  <td>
                    {itemProgress.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

    </div>
  );
}

export default Goals;