import {
  getUsersFromStorage,
  saveUsersToStorage,
  getProductsFromStorage,
  saveProductsToStorage,
} from "../lib/mock-db";

export const getAllUsers = () => {
  return getUsersFromStorage();
};

export const banUser = (userId: string) => {
  const users = getUsersFromStorage();
  const products = getProductsFromStorage();

  const updatedUsers = users.map((u: any) =>
    u.id === userId ? { ...u, isBanned: true } : u
  );

  const updatedProducts = products.map((p: any) =>
    p.ownerId === userId ? { ...p, status: "rejected" } : p
  );

  saveUsersToStorage(updatedUsers);
  saveProductsToStorage(updatedProducts);
};

export const unbanUser = (userId: string) => {
  const users = getUsersFromStorage();

  const updatedUsers = users.map((u: any) =>
    u.id === userId ? { ...u, isBanned: false } : u
  );

  saveUsersToStorage(updatedUsers);
};
