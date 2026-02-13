import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /** EXTENSION DE SESSION PARA INCLUIR CAMPOS PERSONALIZADOS DE SER NECESARIO*/
  interface Session {
    accessToken?: string;
    idToken?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  /** EXTENSION DE LA INTERFAZ USER SI NECESITAS CAMPOS ADICIONALES*/
  interface User {
    id?: string;
    idToken?: string;
    // SE AGREGAN ACA LOS CAMPOS PERSONALIZADOS QUE SE QUIERAN USAR EN EL USUARIO
  }
}

declare module "next-auth/jwt" {
  /**  EXTENSION DEL JWT PARA INCLUIR CAMPOS PERSONALIZADOS */
  interface JWT {
    accessToken?: string;
    idToken?: string;
    userId?: string;
  }
}