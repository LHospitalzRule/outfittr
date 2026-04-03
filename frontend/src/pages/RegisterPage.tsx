import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    console.log("Register:", { firstName, lastName, email, password });
  };

  return (
    <>
      <div className="graffiti-wrapper" />

      <div className="login-container">
        <div className="login-card">
          <h2 className="graffiti-title">JOIN THE CREW</h2>

          <form onSubmit={handleSubmit}>
            <input
              placeholder="FIRST NAME"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <input
              placeholder="LAST NAME"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

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

            <input
              type="password"
              placeholder="CONFIRM"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button type="submit">SIGN UP</button>
          </form>

          <p className="link-text">
            Already in?{" "}
            <span onClick={() => navigate("/")}>LOGIN</span>
          </p>
        </div>
      </div>
    </>
  );
}