"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LeadRowActions({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Diesen Lead wirklich löschen?")) return;
    setPending(true);
    await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={pending}>
      Löschen
    </Button>
  );
}
