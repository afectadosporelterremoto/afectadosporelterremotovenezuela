import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { 
  Users, 
  UserMinus, 
  HeartHandshake, 
  BookOpen, 
  Phone, 
  LogOut, 
  ShieldAlert,
  ArrowLeft,
  Building
} from "lucide-react";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Panel de Administración | Terremoto Venezuela",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  let userEmail = "admin@afectadosporelterremotovenezuela.com";
  let isDemoMode = false;

  try {
    const supabase = await createClient();
    
    // Si la URL es la de placeholder, entramos en modo demo para permitir testing
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (url.includes("placeholder.supabase.co")) {
      isDemoMode = true;
    } else {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        redirect("/login");
      }
      
      userEmail = user.email || userEmail;

      // Verificar que esté en la tabla admin_users
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (adminError || !adminUser || adminUser.role !== "admin") {
        // Cerrar sesión si el usuario no es admin
        await supabase.auth.signOut();
        redirect("/login?error=unauthorized");
      }
    }
  } catch (err) {
    console.error("Excepción en admin layout auth check, usando modo demo:", err);
    isDemoMode = true;
  }

  // Acción para cerrar sesión
  async function logout() {
    "use server";
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (e) {
      // Ignorar error al cerrar sesión
    }
    redirect("/login");
  }

  const sidebarLinks = [
    { name: "Registros de Afectados", href: "/admin/afectados", icon: Users },
    { name: "Casos de Desaparecidos", href: "/admin/desaparecidos", icon: UserMinus },
    { name: "Hospitalizados", href: "/admin/hospitalizados", icon: Building },
    { name: "Personas Rescatadas", href: "/admin/rescatados", icon: HeartHandshake },
    { name: "Moderación de Historias", href: "/admin/historias", icon: BookOpen },
    { name: "Números de Emergencia", href: "/admin/emergencias", icon: Phone },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar de navegación */}
      <aside className="w-full md:w-64 bg-[#0B1F3A] text-white flex flex-col border-r border-[#0B1F3A]/20">
        {/* Cabecera Sidebar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="bg-white rounded-lg p-1.5 inline-block">
            <Logo variant="icon" height={32} />
          </Link>
          <span className="text-xs font-bold text-[#F2C94C] tracking-wide uppercase">Admin Panel</span>
        </div>

        {/* Info del usuario */}
        <div className="px-4 py-3 bg-[#0B1F3A]/45 border-b border-white/5 space-y-1">
          <span className="block text-[10px] text-gray-400 font-bold uppercase">Usuario activo</span>
          <span className="block text-xs font-mono text-gray-200 truncate">{userEmail}</span>
          {isDemoMode && (
            <span className="inline-block rounded-sm bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-[#F2C94C] uppercase mt-1">
              Modo de Simulación
            </span>
          )}
        </div>

        {/* Links */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center space-x-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Icon size={16} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <Link
            href="/"
            className="flex items-center space-x-2 rounded-lg px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Volver a la Web Pública</span>
          </Link>
          
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center space-x-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Área de contenido */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Cabecera móvil y barra superior */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between md:justify-end shrink-0">
          <div className="md:hidden">
            <Logo variant="full" height={30} />
          </div>
          <div className="hidden md:flex items-center space-x-2 text-xs font-semibold text-gray-500">
            <ShieldAlert size={14} className="text-[#C0392B]" />
            <span>Área Administrativa Encriptada</span>
          </div>
        </header>

        {/* Contenido dinámico */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
