import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OutfitManagerPage from "./pages/OutfitManagerPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/outfits" element={<OutfitManagerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;