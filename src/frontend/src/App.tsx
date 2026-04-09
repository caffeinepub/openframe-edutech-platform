import { Toaster } from "@/components/ui/sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { AppProvider } from "./context/AppContext";
import { TLProvider } from "./context/TLContext";
import { seedIfNeeded, seedSalaryData, seedTLData } from "./lib/storage";
import { routeTree } from "./routeTree";

// Seed data on startup
seedIfNeeded();
seedSalaryData();
seedTLData();

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AppProvider>
      <TLProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </TLProvider>
    </AppProvider>
  );
}
