"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function VisitorsPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] px-4">
      <Card className="border-dashed w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-center text-sm text-muted-foreground">
            Visitantes — próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
