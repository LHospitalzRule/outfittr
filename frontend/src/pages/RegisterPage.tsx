import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthSprayLayer from "../components/AuthSprayLayer";
import { buildApiPath } from "../utils/api";
import {
  decodeToken,
  storeAccessToken,
  storeUser,
} from "../utils/session";

const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character.";

function isPasswordValid(password: string) {
  return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(
    password || "",
  );
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!isPasswordValid(password)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

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
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (result.accessToken) {
        const payload = decodeToken(result.accessToken);

        storeAccessToken(result.accessToken);
        storeUser({
          id: payload.userId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: email.trim(),
        });

        navigate("/outfits");
        return;
      }

      if (!response.ok || result.error) {
        setError(result.error || "Unable to create account.");
        return;
      }

      setSuccessMessage(
        result.message || "Check your email for a verification link before signing in."
      );
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

            <p className="form-feedback">
              {PASSWORD_REQUIREMENTS_MESSAGE}
            </p>

            <input
              type="password"
              placeholder="CONFIRM"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error ? <p className="form-feedback error-text">{error}</p> : null}
            {successMessage ? (
              <p className="form-feedback">{successMessage}</p>
            ) : null}

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
