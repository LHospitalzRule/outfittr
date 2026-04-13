import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OutfitManagerPage from "./pages/OutfitManagerPage";
import { getAccessToken } from "./utils/session";

function ProtectedRoute({ children }: { children: ReactElement }) {
  if (!getAccessToken()) {
    return <Navigate replace to="/" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/outfits"
          element={
            <ProtectedRoute>
              <OutfitManagerPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
