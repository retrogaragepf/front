export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  banned: boolean;
};

let mockUsers: AdminUser[] = [
  {
    id: "1",
    name: "Martina Alvarez",
    email: "martina@mail.com",
    role: "admin",
    banned: false,
  },
  {
    id: "2",
    name: "Juan Pérez",
    email: "juan@mail.com",
    role: "user",
    banned: false,
  },
  {
    id: "3",
    name: "Lucía Gómez",
    email: "lucia@mail.com",
    role: "user",
    banned: true,
  },
];

export const getAllUsers = (): AdminUser[] => {
  return [...mockUsers];
};

export const banUser = (id: string): void => {
  mockUsers = mockUsers.map((user) =>
    user.id === id ? { ...user, banned: true } : user
  );
};

export const unbanUser = (id: string): void => {
  mockUsers = mockUsers.map((user) =>
    user.id === id ? { ...user, banned: false } : user
  );
};
