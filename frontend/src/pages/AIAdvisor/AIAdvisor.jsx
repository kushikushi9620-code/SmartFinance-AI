import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./AIAdvisor.css";

function AIAdvisor() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  // Ask AI Chatbot
  const askAI = async () => {
    if (!question.trim()) {
      alert("Please enter your question.");
      return;
    }

    setLoading(true);
    setAnswer("");

    try {
      const response = await axios.post(
        "https://smartfinance-backend-kushi.onrender.com/chat",
        {
          message: question.trim(),
        }
      );

      setAnswer(response.data.reply);
    } catch (error) {
      setAnswer("❌ Unable to connect to AI.");
    } finally {
      setLoading(false);
    }
  };

  // Analyze Expenses
  const analyzeExpenses = async () => {
    setLoading(true);
    setAnalysis("");

    try {
      const user_id = localStorage.getItem("user_id");

      const response = await axios.post(
        `https://smartfinance-backend-kushi.onrender.com/ai-insights/${user_id}`
      );

      setAnalysis(response.data.reply);
    } catch (error) {
      setAnalysis("❌ Unable to analyze expenses.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-container">
      <h1>🤖 AI Financial Advisor</h1>

      <textarea
        placeholder="Ask your financial question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <button onClick={askAI} disabled={loading}>
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      <div className="answer-box">
        <h3>AI Response</h3>
        <ReactMarkdown>
          {answer || "Ask a financial question to get advice."}
        </ReactMarkdown>
      </div>

      <hr />

      <button onClick={analyzeExpenses} disabled={loading}>
        {loading ? "Analyzing..." : "📊 Analyze My Expenses"}
      </button>

      <div className="answer-box">
        <h3>Expense Analysis</h3>
        <ReactMarkdown>
          {analysis ||
            "Click 'Analyze My Expenses' to receive personalized financial insights."}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default AIAdvisor;