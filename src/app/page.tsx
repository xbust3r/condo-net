"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Building2 } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/select-condo");
      } else {
        router.replace("/login");
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
      <Building2 className="h-10 w-10 animate-pulse text-primary" />
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
