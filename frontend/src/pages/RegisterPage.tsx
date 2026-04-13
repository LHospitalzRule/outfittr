import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AuthSprayLayer from "../components/AuthSprayLayer";
import { buildApiPath } from "../utils/api";
import {
  decodeToken,
  getAccessToken,
  storeAccessToken,
  storeUser,
} from "../utils/session";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  if (getAccessToken()) {
    return <Navigate replace to="/items" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiPath("api/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!result.accessToken) {
        setError(result.error || "Unable to create account.");
        return;
      }

      const payload = decodeToken(result.accessToken);

      storeAccessToken(result.accessToken);
      storeUser({
        id: payload.userId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: email.trim(),
      });

      navigate("/items");
    } catch (submitError) {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="graffiti-wrapper auth-backdrop">
        <AuthSprayLayer />
        <div className="paint-orb orb-one" />
        <div className="paint-orb orb-two" />
        <div className="spray-cluster spray-left">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="spray-cluster spray-right">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="login-container auth-container">
        <div className="login-card">
          <h2 className="graffiti-title bubble-title" aria-label="JOIN THE CREW">
            <span className="bubble-title-line">
              <span className="bubble-char">J</span>
              <span className="bubble-char">O</span>
              <span className="bubble-char">I</span>
              <span className="bubble-char">N</span>
              <span className="bubble-char bubble-char-space">T</span>
              <span className="bubble-char">H</span>
              <span className="bubble-char">E</span>
            </span>
            <span className="bubble-title-line">
              <span className="bubble-char">C</span>
              <span className="bubble-char">R</span>
              <span className="bubble-char">E</span>
              <span className="bubble-char">W</span>
            </span>
          </h2>
          <p className="card-copy bubble-copy" aria-label="Build a personal outfit board for demos, styling ideas, and managing your outfits.">
            <span className="copy-word">Build</span>
            <span className="copy-word">a</span>
            <span className="copy-word">personal</span>
            <span className="copy-word">outfit</span>
            <span className="copy-word">board</span>
            <span className="copy-word">for</span>
            <span className="copy-word">demos</span>
            <span className="copy-word">styling</span>
            <span className="copy-word">ideas</span>
            <span className="copy-word">and</span>
            <span className="copy-word">managing</span>
            <span className="copy-word">your</span>
            <span className="copy-word">outfits</span>
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="CONFIRM"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error ? <p className="form-feedback error-text">{error}</p> : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "CREATING..." : "SIGN UP"}
            </button>
          </form>

          <p className="link-text">
            Already in?{" "}
            <span className="doodle-link" onClick={() => navigate("/")}>
              LOGIN
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
