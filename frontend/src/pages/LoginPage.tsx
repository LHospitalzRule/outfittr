import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login:", { email, password });
  };

  return (
    <>
      <div className="graffiti-wrapper" />

      <div className="login-container">
        <div className="login-card">
          <h2 className="graffiti-title">OUTFITTR</h2>

          <form onSubmit={handleSubmit}>
            <input
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">ENTER</button>
          </form>

          <p className="link-text">
            New here?{" "}
            <span onClick={() => navigate("/register")}>SIGN UP</span>
          </p>
        </div>
      </div>
    </>
  );
}