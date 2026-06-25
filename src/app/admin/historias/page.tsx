import React from "react";
import { createClient } from "@/utils/supabase/server";
import AdminStoriesList from "@/components/AdminStoriesList";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Moderar Historias | Terremoto Venezuela",
};

export default async function AdminStoriesPage() {
  let stories: any[] = [];
  let errorMsg = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) errorMsg = error.message;
    else if (data) stories = data;
  } catch (err: any) {
    errorMsg = err.message;
  }

  // Mocks de demostración
  const mockStories = [
    {
      id: "demo-story-1",
      title: "Cumaná unida frente a la catástrofe",
      content: "Vivimos momentos de terror cuando la tierra empezó a temblar. El edificio vecino colapsó, pero gracias a los vecinos y bomberos pudimos evacuar a tiempo a todos los abuelitos del piso 3. Hoy necesitamos alimentos y mantas en el refugio del gimnasio. La solidaridad es lo único que nos mantiene en pie.",
      author_name: "Yulimar Ramos",
      is_anonymous: false,
      state: "Sucre",
      city: "Cumaná",
      photo_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop",
      status: "approved",
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-story-3",
      title: "Alerta de derrumbe en la autopista",
      content: "Señores, por favor no transiten por la autopista Caracas-La Guaira, hay un derrumbe grande a la altura del km 12. Tuvimos que devolvernos.",
      author_name: "Usuario Anónimo",
      is_anonymous: true,
      state: "Vargas (La Guaira)",
      city: "La Guaira",
      photo_url: null,
      status: "pending",
      created_at: new Date().toISOString(),
    },
  ];

  const usingMock = stories.length === 0 && errorMsg;
  const activeStories = usingMock ? mockStories : stories;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Moderación de Testimonios e Historias</h1>
        <p className="text-xs text-gray-500">
          Apruebe o rechace testimonios e historias enviadas por el público antes de su publicación en el blog público.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start space-x-2 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Modo Demostración Activo:</p>
            <p className="text-xs">Los datos a continuación son ficticios para permitir la previsualización del panel ({errorMsg}).</p>
          </div>
        </div>
      )}

      <AdminStoriesList initialStories={activeStories} />
    </div>
  );
}
