import { useEffect, useState } from "react";
import axios from "axios";
import "./Expenses.css";

function Expenses() {
  const [expense, setExpense] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
  });

  const [expenses, setExpenses] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("user_id");

  // ---------------- HANDLE INPUT ----------------

  const handleChange = (e) => {
    setExpense({
      ...expense,
      [e.target.name]: e.target.value,
    });
  };

  // ---------------- LOAD EXPENSES ----------------

  const loadExpenses = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `https://smartfinance-backend-kushi.onrender.com/expenses/${userId}`
      );

      setExpenses(response.data);
    } catch (error) {
      console.log("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [userId]);

  // ---------------- SEARCH EXPENSES ----------------

  const searchExpenses = async () => {
    if (!search.trim()) {
      loadExpenses();
      return;
    }

    try {
      const response = await axios.get(
        `https://smartfinance-backene-kushi.onrender.com/search-expenses/${userId}/${encodeURIComponent(
          search.trim()
        )}`
      );

      setExpenses(response.data);
    } catch (error) {
      console.log("Search error:", error);
      alert("Search Failed");
    }
  };

  // ---------------- SHOW ALL ----------------

  const showAllExpenses = () => {
    setSearch("");
    loadExpenses();
  };

  // ---------------- ADD EXPENSE ----------------

  const addExpense = async () => {
    if (
      !expense.title.trim() ||
      !expense.amount ||
      !expense.category.trim() ||
      !expense.date
    ) {
      alert("Please fill all fields");
      return;
    }

    if (Number(expense.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const response = await axios.post(
        "https://smartfinance-backend-kushi.onrender.com/add-expense",
        {
          user_id: Number(userId),
          title: expense.title.trim(),
          amount: Number(expense.amount),
          category: expense.category.trim(),
          date: expense.date,
        }
      );

      alert(response.data.message);

      clearForm();

      loadExpenses();
    } catch (error) {
      console.log("Add expense error:", error);

      if (error.response) {
        alert(error.response.data.message || "Error adding expense");
      } else {
        alert("Error adding expense");
      }
    }
  };

  // ---------------- EDIT EXPENSE ----------------

  const editExpense = (item) => {
    setExpense({
      title: item.title,
      amount: item.amount,
      category: item.category,
      date: item.date,
    });

    setEditId(item.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ---------------- UPDATE EXPENSE ----------------

  const updateExpense = async () => {
    if (
      !expense.title.trim() ||
      !expense.amount ||
      !expense.category.trim() ||
      !expense.date
    ) {
      alert("Please fill all fields");
      return;
    }

    if (Number(expense.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const response = await axios.put(
        `https://smartfinance-backend-kushi.onrender.com/update-expense/${editId}`,
        {
          title: expense.title.trim(),
          amount: Number(expense.amount),
          category: expense.category.trim(),
          date: expense.date,
        }
      );

      alert(response.data.message);

      clearForm();

      loadExpenses();
    } catch (error) {
      console.log("Update error:", error);

      if (error.response) {
        alert(error.response.data.message || "Update Failed");
      } else {
        alert("Update Failed");
      }
    }
  };

  // ---------------- DELETE EXPENSE ----------------

  const deleteExpense = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await axios.delete(
        `https://smartfinance-backend-kushi.onrender.com/delete-expense/${id}`
      );

      alert(response.data.message);

      loadExpenses();
    } catch (error) {
      console.log("Delete error:", error);

      if (error.response) {
        alert(error.response.data.message || "Delete Failed");
      } else {
        alert("Delete Failed");
      }
    }
  };

  // ---------------- CLEAR FORM ----------------

  const clearForm = () => {
    setExpense({
      title: "",
      amount: "",
      category: "",
      date: "",
    });

    setEditId(null);
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Expenses</h1>

      <input
        type="text"
        name="title"
        placeholder="Title"
        value={expense.title}
        onChange={handleChange}
      />

      <br />
      <br />

      <input
        type="number"
        name="amount"
        placeholder="Amount"
        min="0.01"
        step="0.01"
        value={expense.amount}
        onChange={handleChange}
      />

      <br />
      <br />

      <input
        type="text"
        name="category"
        placeholder="Category"
        value={expense.category}
        onChange={handleChange}
      />

      <br />
      <br />

      <input
        type="date"
        name="date"
        value={expense.date}
        onChange={handleChange}
      />

      <br />
      <br />

      <button onClick={editId ? updateExpense : addExpense}>
        {editId ? "Update Expense" : "Add Expense"}
      </button>

      {editId && (
        <button
          onClick={clearForm}
          style={{ marginLeft: "10px" }}
        >
          Cancel Edit
        </button>
      )}

      <hr />

      <h2>Search Expenses</h2>

      <input
        type="text"
        placeholder="Search by Category"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            searchExpenses();
          }
        }}
      />

      <button
        onClick={searchExpenses}
        style={{ marginLeft: "10px" }}
      >
        Search
      </button>

      <button
        onClick={showAllExpenses}
        style={{ marginLeft: "10px" }}
      >
        Show All
      </button>

      <hr />

      <h2>Expense List</h2>

      {loading ? (
        <p>Loading expenses...</p>
      ) : expenses.length === 0 ? (
        <p>No expenses found.</p>
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
              <th>Title</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Date</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>

                <td>
                  ₹{Number(item.amount).toFixed(2)}
                </td>

                <td>{item.category}</td>

                <td>{item.date}</td>

                <td>
                  <button onClick={() => editExpense(item)}>
                    Edit
                  </button>
                </td>

                <td>
                  <button onClick={() => deleteExpense(item.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Expenses;