import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./Home.css";

function Home() {
  // Chatbot States
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  // Expense Tracker States
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [expenses, setExpenses] = useState([]);

  // ---------------- CHATBOT ----------------

  const handleSend = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setReply("");

    try {
      const response = await fetch("https://smartfinance-ai-ycjp.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      const data = await response.json();
      setReply(data.reply);
    } catch (error) {
      setReply("❌ Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- ADD EXPENSE ----------------

  const addExpense = async () => {
    if (!title || !amount || !category || !date) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await fetch("https://smartfinance-ai-ycjp.onrender.com/add-expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          amount,
          category,
          date,
        }),
      });

      const data = await response.json();

      alert(data.message);

      setTitle("");
      setAmount("");
      setCategory("");
      setDate("");

      fetchExpenses();

    } catch (error) {
      alert("Failed to add expense");
    }
  };

  // ---------------- VIEW EXPENSES ----------------

  const fetchExpenses = async () => {
    try {
      const response = await fetch("https://smartfinance-ai-ycjp.onrender.com/expenses");
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.log(error);
    }
  };

  // ---------------- DELETE EXPENSE ----------------

  const deleteExpense = async (id) => {
    try {
      const response = await fetch(
        `https://smartfinance-ai-ycjp.onrender.com/delete-expense/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      alert(data.message);

      fetchExpenses();

    } catch (error) {
      alert("Failed to delete expense");
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // ---------------- CLEAR CHAT ----------------

  const handleClear = () => {
    setMessage("");
    setReply("");
  };

  return (
    <div className="container">
      <h1>💰 SmartFinance AI</h1>

      <p>Your Personal AI Financial Advisor</p>

      {/* Chatbot */}

      <input
        type="text"
        placeholder="Ask your finance question..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSend();
          }
        }}
      />

      <div style={{ marginTop: "10px" }}>
        <button onClick={handleSend}>
          {loading ? "Thinking..." : "Send"}
        </button>

        <button
          onClick={handleClear}
          style={{ marginLeft: "10px" }}
        >
          Clear
        </button>
      </div>

      {reply && (
        <div className="response-box">
          <h3>🤖 AI Response</h3>
          <ReactMarkdown>{reply}</ReactMarkdown>
        </div>
      )}

      <hr />

      {/* Expense Tracker */}

      <h2>Add Expense</h2>

      <input
        type="text"
        placeholder="Expense Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <br />
      <br />

      <button onClick={addExpense}>
        Add Expense
      </button>

      <hr />

      <h2>Expense List</h2>

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
            <th>Title</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.title}</td>
                <td>₹{expense.amount}</td>
                <td>{expense.category}</td>
                <td>{expense.date}</td>
                <td>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: "pointer",
                      borderRadius: "5px",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No Expenses Found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Home;