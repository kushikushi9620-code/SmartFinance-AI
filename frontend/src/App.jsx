import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import Expenses from "./pages/Expenses/Expenses";
import Analytics from "./pages/Analytics/Analytics";
import AIAdvisor from "./pages/AIAdvisor/AIAdvisor";
import Profile from "./pages/Profile/Profile";
import BudgetPlanner from "./pages/BudgetPlanner/BudgetPlanner";
import Goals from "./pages/Goals/Goals";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/aiadvisor" element={<AIAdvisor />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/budget" element={<BudgetPlanner />} />
      <Route path="/goals" element={<Goals />} />
    </Routes>
  );
}

export default App;