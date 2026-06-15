import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "@/supabase";
import { LoginPage } from "@/components/ui/login-page";

function AuthGate() {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    const app = document.querySelector(".app-layout");

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      const hasSession = !!s;
      setSession(hasSession);
      if (hasSession && app) app.classList.add("app-layout-visible");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasSession = !!session;
      setSession(hasSession);
      if (hasSession && app) {
        app.classList.add("app-layout-visible");
      } else if (app) {
        app.classList.remove("app-layout-visible");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === null) {
    return (
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-logo">
            <img
              src="https://www.scalepods.co/_next/image?url=%2Fscalepods-navbar-logo.png&w=256&q=75&dpl=dpl_DX4go8Z4Sy3vBkyqLBb8kxYXVNrc"
              alt="ScalePods"
            />
          </div>
          <div className="login-loader" />
        </div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return <LoginPage />;
}

createRoot(document.getElementById("react-root")!).render(
  <StrictMode>
    <AuthGate />
  </StrictMode>
);
