import { useQuery } from "@rocicorp/zero/react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { queries } from "../queries.ts";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function SpecialismDetail() {
  const { id } = useParams<{ id: string }>();
  const specialismeCd = id ?? "";

  const [specialisme, specialismeResult] = useQuery(
    specialismeCd ? queries.refSpecialisme.byCode(specialismeCd) : null
  );

  if (!specialisme && specialismeResult?.type !== "complete") {
    return null;
  }

  if (!specialisme) {
    return (
      <div className="container mx-auto p-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar overzicht
        </Link>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Specialisme niet gevonden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar overzicht
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {specialisme.specialismeCd} - {specialisme.omschrijving}
          </CardTitle>
          <CardDescription>
            Specialisme details
          </CardDescription>
        </CardHeader>
      </Card>

      <Separator />

      <div className="text-muted-foreground">
        <p>Specialisme code: {specialisme.specialismeCd}</p>
        <p>Omschrijving: {specialisme.omschrijving}</p>
        <p>Versie: {specialisme.versie}</p>
        <p>Peildatum: {specialisme.peildatum}</p>
      </div>
    </div>
  );
}

export default SpecialismDetail;
