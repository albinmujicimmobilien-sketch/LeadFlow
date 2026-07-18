import { LeadForm } from "@/components/lead-form";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function NewLeadPage() {
  return (
    <Card>
      <CardHeader>
        <h1 className="text-lg font-semibold">Neuer Lead</h1>
        <p className="text-sm text-neutral-500">Erfasse einen Immobilien-Eigentümer manuell.</p>
      </CardHeader>
      <CardContent>
        <LeadForm />
      </CardContent>
    </Card>
  );
}
