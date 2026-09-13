import React, { useState } from "react";
import { BookOpen, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "./context/AuthContext";

export default function AuthScreen() {
  const { login, register, loading } = useAuth();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    try {
      if (mode === "register") {
        if (!name.trim()) {
          setError("Please enter your name.");
          return;
        }

        const data = await register(
          name.trim(),
          email.trim(),
          password
        );

        setMessage(
          data.message || "Registration successful. Please log in."
        );

        setMode("login");
        setName("");
        setPassword("");
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <BookOpen size={26} />
          </div>

          <div>
            <h1>NoteSpace</h1>
            <p>Your ideas, organized.</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h2>

          <p>
            {mode === "login"
              ? "Sign in to continue to your notes."
              : "Create an account to start using NoteSpace."}
          </p>
        </div>

        {error && (
          <div className="auth-message error">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-message success">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="auth-field">
              <span>Name</span>

              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {mode === "login" ? (
              <LogIn size={18} />
            ) : (
              <UserPlus size={18} />
            )}

            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              <span>Don't have an account?</span>

              <button
                type="button"
                onClick={() => switchMode("register")}
              >
                Create account
              </button>
            </>
          ) : (
            <>
              <span>Already have an account?</span>

              <button
                type="button"
                onClick={() => switchMode("login")}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
