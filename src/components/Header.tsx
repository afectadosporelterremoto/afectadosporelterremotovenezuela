"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldAlert, PhoneCall } from "lucide-react";
import Logo from "./Logo";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Buscar Persona", href: "/buscar" },
    { name: "Registrar Afectado", href: "/registrar-afectado" },
    { name: "Desaparecidos", href: "/desaparecidos" },
    { name: "Rescatados", href: "/rescatados" },
    { name: "Hospitalizados", href: "/hospitalizados" },
    { name: "Historias", href: "/historias" },
    { name: "Emergencias", href: "/emergencias" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex shrink-0">
            <Logo variant="full" height={38} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-[#0B1F3A]/5 text-[#0B1F3A] font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#0B1F3A]"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Admin and Quick Emergency Actions */}
          <div className="hidden lg:flex lg:items-center lg:space-x-3">
            <Link
              href="/emergencias"
              className="flex items-center space-x-1.5 rounded-full bg-[#C0392B] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#A93226] transition-colors"
            >
              <PhoneCall size={14} />
              <span>Llamar Emergencia</span>
            </Link>
            
            <Link
              href="/admin"
              className="flex items-center space-x-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ShieldAlert size={14} className="text-[#F2C94C]" />
              <span>Admin</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-hidden"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Abrir menú</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? "block" : "hidden"} lg:hidden border-t border-gray-100 bg-white`} id="mobile-menu">
        <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-[#0B1F3A]/5 text-[#0B1F3A] font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-[#0B1F3A]"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="border-t border-gray-100 mt-4 pt-4 flex flex-col space-y-2 px-3 pb-2">
            <Link
              href="/emergencias"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center space-x-2 rounded-md bg-[#C0392B] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#A93226] transition-colors"
            >
              <PhoneCall size={16} />
              <span>Llamar Emergencia (V-911)</span>
            </Link>
            
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center space-x-2 rounded-md border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ShieldAlert size={16} className="text-[#C0392B]" />
              <span>Panel de Administración</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
