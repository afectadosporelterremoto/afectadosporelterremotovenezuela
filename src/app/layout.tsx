import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WelcomeModal from "@/components/WelcomeModal";

// Cargar fuente Inter para estética premium
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Afectados por el Terremoto Venezuela | Plataforma Humanitaria",
  description:
    "Registro oficial y de búsqueda de personas afectadas, desaparecidas y rescatadas tras el terremoto en Venezuela. Centralización de contactos de emergencia, soporte de localización e historias de sobrevivientes.",
  keywords: [
    "terremoto Venezuela",
    "afectados terremoto",
    "desaparecidos Venezuela",
    "rescatados Venezuela",
    "búsqueda de familiares",
    "números de emergencia Venezuela",
  ],
  authors: [{ name: "Iniciativa Ciudadana Humanitaria" }],
  openGraph: {
    title: "Afectados por el Terremoto Venezuela | Plataforma Humanitaria",
    description: "Ayuda a localizar familiares, registrar personas afectadas o rescatadas y consultar números de emergencia.",
    type: "website",
    locale: "es_VE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <WelcomeModal />
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
