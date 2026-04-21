import { useEffect, useState, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OutfitManagerPage from "./pages/OutfitManagerPage";
import VerifyPage from "./pages/VerifyPage";
import { buildApiPath } from "./utils/api";
import { clearSession, getAccessToken } from "./utils/session";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const [status, setStatus] = useState<"checking" | "allowed" | "blocked">("checking");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setStatus("blocked");
      return;
    }

    let isMounted = true;

    async function verifySession() {
      try {
        const response = await fetch(buildApiPath("api/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const body = await response.json().catch(() => ({}));

        if (!isMounted) {
          return;
        }

        if (response.ok && body.verified === true) {
          setStatus("allowed");
          return;
        }
      } catch (error) {
        console.error("ProtectedRoute verification failed:", error);
      }

      clearSession();
      if (isMounted) {
        setStatus("blocked");
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Verifying...</div>;
  }

  if (status === "blocked") {
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
        <Route path="/verify" element={<VerifyPage />} />
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
