import React from "react";
import AffectedPersonForm from "@/components/AffectedPersonForm";

export const metadata = {
  title: "Registrar Persona Afectada | Afectados por el Terremoto Venezuela",
  description: "Formulario oficial para registrar a personas damnificadas, heridas o que requieren ayuda tras el terremoto en Venezuela.",
};

export default function RegisterAffectedPage() {
  return (
    <div className="py-10 px-4 md:py-16">
      <div className="max-w-4xl mx-auto space-y-6">
        <AffectedPersonForm />
      </div>
    </div>
  );
}
