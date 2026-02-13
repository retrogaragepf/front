const USERS_KEY = "retrogarage_users";
const PRODUCTS_KEY = "retrogarage_products";

export const getUsersFromStorage = () => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUsersToStorage = (users: any[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getProductsFromStorage = () => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProductsToStorage = (products: any[]) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};
