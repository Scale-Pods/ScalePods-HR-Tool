import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DemoOne from "@/components/ui/demo";

createRoot(document.getElementById("react-root")!).render(
  <StrictMode>
    <DemoOne />
  </StrictMode>
);
