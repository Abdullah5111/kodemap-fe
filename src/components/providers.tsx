"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "./auth-provider";
import { ConfirmProvider } from "./ui/confirm";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
