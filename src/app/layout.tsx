import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "RetroGarage™",
  description: "E-commerce de tecnología retro y coleccionables",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`
          retro-view
          antialiased
          min-h-screen
          flex
          flex-col
          bg-amber-100
          text-zinc-900
        `}
      >
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
