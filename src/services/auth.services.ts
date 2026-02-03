import { ILoginFormValues } from "@/src/components/loginform/loginSchema";
import { IRegisterFormValues } from "@/src/components/registerform/registerSchema";
import { showToast } from "nextjs-toast-notify";

const APIURL = process.env.NEXT_PUBLIC_API_URL;

export const registerUser = async (userData: IRegisterFormValues) => {
  try {
    const responseRegister = await fetch(`${APIURL}/users/register`, {
      method: "POST",
      headers: {
        "content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    if (responseRegister.ok) {
      return responseRegister.json();
    } else {
      showToast.error("¡Nuevo Registro Fallido, Usuario Ya Existe!", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      throw new Error("Nuevo Registro Fallido, Usuario Ya Existe");
    }
  } catch (error) {
    throw new Error(error as string);
  }
};

export const loginUser = async (userData: ILoginFormValues) => {
  try {
    const responseRegister = await fetch(`${APIURL}/users/login`, {
      method: "POST",
      headers: {
        "content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    if (responseRegister.ok) {
      return responseRegister.json();
    } else {
      showToast.error("¡Datos incorrectos!", {
        duration: 4000,
        progress: true,
        position: "top-center",
        transition: "popUp",
        icon: "",
        sound: true,
      });
      throw new Error("Logueo Fallido");
    }
  } catch (error) {
    throw new Error(error as string);
  }
};
