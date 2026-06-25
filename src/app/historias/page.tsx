import React from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { BookOpen, Calendar, MapPin, PlusCircle, AlertCircle, Quote } from "lucide-react";

export const metadata = {
  title: "Historias y Testimonios de Afectados | Terremoto Venezuela",
  description: "Testimonios de sobrevivientes y solicitudes de ayuda colectivas de las comunidades afectadas por el terremoto.",
};

export default async function StoriesPage() {
  let stories: any[] = [];
  let dbError = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) dbError = error.message;
    else if (data) stories = data;
  } catch (err: any) {
    dbError = err.message;
  }

  // Mocks de fallback
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
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-story-2",
      title: "Necesidad de agua potable en El Limón",
      content: "La tubería principal de agua se fracturó por el terremoto y llevamos tres días sin servicio. Las cisternas no están llegando por los derrumbes en la vía. Pedimos a Protección Civil o cualquier ente privado que nos colabore. Somos más de 50 familias en el callejón Carabobo.",
      author_name: "Vecino Afectado",
      is_anonymous: true,
      state: "Aragua",
      city: "Maracay",
      photo_url: null,
      created_at: new Date().toISOString(),
    },
  ];

  const usingMock = stories.length === 0 && dbError;
  const activeList = usingMock ? mockStories : stories;

  return (
    <div className="py-8 px-4 md:py-12 max-w-5xl mx-auto w-full space-y-8 flex-1 flex flex-col">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="text-purple-600" />
            <span>Historias y Testimonios</span>
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl">
            Relatos en primera persona, testimonios de superación o reportes de necesidades colectivas de comunidades afectadas. Todos los envíos son moderados por seguridad.
          </p>
        </div>

        <Link
          href="/historias/nueva"
          className="inline-flex items-center space-x-1.5 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 transition-colors shadow-xs shrink-0 self-start sm:self-center"
        >
          <PlusCircle size={16} />
          <span>Contar mi historia</span>
        </Link>
      </div>

      {dbError && !usingMock && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start space-x-2 text-sm text-blue-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-blue-500 mt-0.5" />
          <div>
            <p className="font-semibold">Nota de demostración:</p>
            <p className="text-xs">Mostrando testimonios de ejemplo debido a fallos o falta de conexión activa a Supabase.</p>
          </div>
        </div>
      )}

      {activeList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center flex-1 flex flex-col items-center justify-center">
          <BookOpen className="h-10 w-10 text-gray-400 mb-2" />
          <h3 className="text-base font-bold text-gray-700">No hay testimonios aprobados aún</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            Si fuiste afectado o tienes un mensaje solidario que quieras dar a conocer, haz clic en el botón superior para agregar tu historia.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeList.map((story) => (
            <article key={story.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row gap-6 relative overflow-hidden">
              <Quote className="absolute top-4 right-4 h-16 w-16 text-gray-50 pointer-events-none" />
              
              {story.photo_url && (
                <div className="w-full md:w-48 h-48 md:h-auto shrink-0 rounded-lg overflow-hidden border border-gray-150 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={story.photo_url} alt={story.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">{story.title}</h2>
                  
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-[#0B1F3A]">Autor: {story.is_anonymous ? "Anónimo" : story.author_name}</span>
                    {story.city && (
                      <span className="flex items-center space-x-0.5">
                        <MapPin size={12} className="text-[#C0392B]" />
                        <span>{story.city}{story.state ? `, ${story.state}` : ""}</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {story.content}
                </p>

                <div className="flex items-center space-x-1 text-[10px] text-gray-400 border-t border-gray-100 pt-3">
                  <Calendar size={12} />
                  <span>Publicado: {new Date(story.created_at).toLocaleDateString("es-VE")}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
