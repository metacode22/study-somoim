"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StackProvider } from "@teamsparta/stack-core";
import { SessionProvider } from "next-auth/react";
import { ReactNode, useState } from "react";
import { Toaster } from "@teamsparta/stack-toast";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StackProvider theme="sccLight">
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </StackProvider>
    </QueryClientProvider>
  );
}
