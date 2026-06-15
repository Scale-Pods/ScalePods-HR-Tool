import { useState, useEffect } from "react";
import { supabase } from "@/supabase";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email;

    if (userEmail) {
      await supabase.rpc("sync_password_hash", {
        p_email: userEmail,
        p_password: password,
      });
    }

    setLoading(false);
    setMessage("Password reset successfully! Redirecting to login...");
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
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

        {!ready ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>
              Verifying your reset link...
            </p>
            <div className="login-loader" />
          </div>
        ) : message ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "#6ee7b7", fontSize: "14px", fontWeight: 600 }}>
              {message}
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="login-form">
            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">
              Enter your new password below.
            </p>

            <div className="login-field">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoFocus
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
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
