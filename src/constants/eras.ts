export type EraOption = {
  id: string; // UUID real en DB
  label: string;
};

export const ERA_OPTIONS: EraOption[] = [
  { id: "031a37a9-7314-4981-811b-5f7aae2f5bee", label: "60s" },
  { id: "8d77bf1f-28e5-403f-8566-1196a08cb18a", label: "70s" },
  { id: "a146863c-c3e7-4333-b319-fd8b2368f6a2", label: "80s" },
  { id: "baaf5667-6baa-47bf-b387-fa328f1b3661", label: "90s" },
  { id: "eac212b5-4235-479a-9e73-e43b716d2baf", label: "Y2K" },
];
