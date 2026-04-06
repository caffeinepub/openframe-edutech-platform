import { Toaster } from "@/components/ui/sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { AppProvider } from "./context/AppContext";
import { seedIfNeeded } from "./lib/storage";
import { routeTree } from "./routeTree";

// Seed data on startup
seedIfNeeded();

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </AppProvider>
  );
}
