import React from "react";
import StoryForm from "@/components/StoryForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Compartir Testimonio | Terremoto Venezuela",
  description: "Formulario para enviar tu historia o solicitudes de asistencia colectivas de tu comunidad afectada.",
};

export default function NewStoryPage() {
  return (
    <div className="py-8 px-4 md:py-12 max-w-4xl mx-auto w-full space-y-6">
      <Link
        href="/historias"
        className="inline-flex items-center space-x-1 text-sm font-semibold text-gray-600 hover:text-[#0B1F3A]"
      >
        <ArrowLeft size={16} />
        <span>Volver a testimonios</span>
      </Link>

      <StoryForm />
    </div>
  );
}
