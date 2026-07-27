import { useEffect, useState } from "react";
import axios from "axios";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie } from "react-chartjs-2";
import "./Analytics.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function Analytics() {

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          "#2563eb",
          "#16a34a",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#06b6d4",
          "#22c55e",
          "#f97316",
        ],
      },
    ],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {

      const user_id = localStorage.getItem("user_id");

      const response = await axios.get(
        `http://127.0.0.1:5000/analytics-data/${user_id}`
      );

      const labels = response.data.map(
        (item) => item.category
      );

      const values = response.data.map(
        (item) => item.amount
      );

      setChartData({
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              "#2563eb",
              "#16a34a",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#06b6d4",
              "#22c55e",
              "#f97316",
            ],
          },
        ],
      });

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="analytics">
      <h1>Expense Analytics</h1>

      <div className="chart">
        <Pie data={chartData} />
      </div>
    </div>
  );
}

export default Analytics;