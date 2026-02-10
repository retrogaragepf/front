import type { Metadata } from "next";
import {
  Permanent_Marker,
  Special_Elite,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Providers from "./providers"; // ✅ AÑADE ESTO
//

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-handwritten",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Your Treasure Cart",
  description: "Checkout",
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
          ${permanentMarker.variable}
          ${specialElite.variable}
          ${spaceGrotesk.variable}
          antialiased
          min-h-screen
          flex
          flex-col
          bg-amber-200
          text-zinc-900
        `}
      >
        {/* ✅ TODO tu árbol ya tiene AuthContext disponible */}
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
