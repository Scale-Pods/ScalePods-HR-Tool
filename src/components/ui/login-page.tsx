import { useState } from "react";
import { supabase } from "@/supabase";

type Page = "login" | "forgot";

export function LoginPage() {
  const [page, setPage] = useState<Page>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Try info@scalepods.co / ScalePods@123");
      } else {
        setError(signInError.message);
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("Check your email for a password reset link.");
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">
          <img
            src="https://www.scalepods.co/_next/image?url=%2Fscalepods-navbar-logo.png&w=256&q=75&dpl=dpl_DX4go8Z4Sy3vBkyqLBb8kxYXVNrc"
            alt="ScalePods"
          />
        </div>

        {page === "login" && (
          <form onSubmit={handleLogin} className="login-form">
            <h1 className="login-title">Sign In</h1>
            <p className="login-subtitle">Access your hiring dashboard</p>

            <div className="login-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              className="login-link-btn"
              onClick={() => {
                setPage("forgot");
                setError("");
                setMessage("");
              }}
            >
              Forgot password?
            </button>

            <div className="login-hint">
              Demo: info@scalepods.co / ScalePods@123
            </div>
          </form>
        )}

        {page === "forgot" && (
          <form onSubmit={handleForgotPassword} className="login-form">
            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">
              Enter your email and we'll send you a reset link.
            </p>

            <div className="login-field">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && <div className="login-error">{error}</div>}
            {message && <div className="login-success">{message}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              type="button"
              className="login-link-btn"
              onClick={() => {
                setPage("login");
                setError("");
                setMessage("");
              }}
            >
              Back to Sign In
            </button>
          </form>
        )}

        <div className="login-footer">
          &copy; {new Date().getFullYear()} ScalePods. All rights reserved.
        </div>
      </div>
    </div>
  );
}
