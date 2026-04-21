import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildApiPath } from "../utils/api";

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    const verificationToken = token;

    async function verify() {
      try {
        const url = buildApiPath(`api/verify?token=${encodeURIComponent(verificationToken)}`);
        const res = await fetch(url, { method: "GET" });
        const body = await res.json();
        if (res.ok && !body.error) {
          setStatus("success");
          setMessage(body.message || "Your account has been verified. You can now sign in.");
          window.setTimeout(() => {
            navigate("/");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(body.error || "Verification failed");
        }
      } catch (e) {
        setStatus("error");
        setMessage("Unable to reach server.");
      }
    }

    verify();
  }, [navigate, searchParams]);

  return (
    <div className="auth-page">
      <div style={{ padding: 24, maxWidth: 640, margin: "40px auto", textAlign: "center" }}>
        {status === "pending" && <p>Verifying your account...</p>}
        {status === "success" && (
          <div>
            <h2>Verified</h2>
            <p>{message}</p>
            <p>Redirecting to sign in in 3 seconds...</p>
            <button onClick={() => navigate("/")}>Go to Sign In</button>
          </div>
        )}
        {status === "error" && (
          <div>
            <h2>Verification Error</h2>
            <p>{message}</p>
            <button onClick={() => navigate("/register")}>Back to Register</button>
            <button onClick={() => navigate("/")}>Go to Sign In</button>
          </div>
        )}
      </div>
    </div>
  );
}
