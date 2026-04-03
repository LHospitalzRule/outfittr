import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";
import ItemPage from "./pages/ItemPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default = Login */}
        <Route path="/" element={<LoginPage />} />

        {/* Register page */}
        <Route path="/register" element={<Register />} />

        {/* After login */}
        <Route path="/dashboard" element={<ItemPage />} />
      </Routes>
    </Router>
  );
}

export default App;