import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AuthSprayLayer from "../components/AuthSprayLayer";
import { buildApiPath } from "../utils/api";
import {
  decodeToken,
  storeAccessToken,
  storeUser,
  getAccessToken,
} from "../utils/session";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  if (getAccessToken()) {
    return <Navigate replace to="/outfits" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(buildApiPath("api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!result.accessToken) {
        setError(result.error || "Unable to sign in.");
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

      navigate("/outfits");
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
          <h2 className="graffiti-title bubble-title" aria-label="OUTFITTR">
            <span className="bubble-title-line">
              <span className="bubble-char">O</span>
              <span className="bubble-char">U</span>
              <span className="bubble-char">T</span>
              <span className="bubble-char">F</span>
              <span className="bubble-char">I</span>
              <span className="bubble-char">T</span>
              <span className="bubble-char">T</span>
              <span className="bubble-char">R</span>
            </span>
          </h2>
          <p className="card-copy bubble-copy" aria-label="Sign in to search your wardrobe and add the next piece to your collection.">
            <span className="copy-word">Sign</span>
            <span className="copy-word">in</span>
            <span className="copy-word">to</span>
            <span className="copy-word">search</span>
            <span className="copy-word">your</span>
            <span className="copy-word">wardrobe</span>
            <span className="copy-word">and</span>
            <span className="copy-word">add</span>
            <span className="copy-word">the</span>
            <span className="copy-word">next</span>
            <span className="copy-word">piece</span>
            <span className="copy-word">to</span>
            <span className="copy-word">your</span>
            <span className="copy-word">collection</span>
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

            {error ? <p className="form-feedback error-text">{error}</p> : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "ENTERING..." : "ENTER"}
            </button>
          </form>

          <p className="link-text">
            New here?{" "}
            <span className="doodle-link" onClick={() => navigate("/register")}>
              SIGN UP
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
