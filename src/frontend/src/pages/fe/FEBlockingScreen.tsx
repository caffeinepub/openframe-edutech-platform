import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * FEBlockingScreen — legacy route kept for backward compatibility.
 * The hard-blocking flow has been removed. This screen now immediately
 * redirects FEs to the dashboard, where a soft amber notice is shown
 * if they are not yet assigned to a Team Leader.
 */
export default function FEBlockingScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/fe/dashboard", replace: true });
  }, [navigate]);

  return null;
}
