export type EraOption = {
  id: string; // UUID real en DB
  label: string;
};

export const ERA_OPTIONS: EraOption[] = [
  { id: "20c5b4a5-09e4-4cb0-8d01-b0f2e0f23a32", label: "60s" },
  { id: "04c1436a-dc8b-4918-bd49-7782ea4c5edd", label: "70s" },
  { id: "cbdb3da7-9aec-4623-a77b-c1bc36dc6f26", label: "80s" },
  { id: "eea7396d-e9cd-49b1-83c3-47cc2570972d", label: "90s" },
  { id: "b35f5c8e-ae6f-4d94-ab3a-ae405df237fa", label: "Y2K" },
];
