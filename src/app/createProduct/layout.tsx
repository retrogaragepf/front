import RequireAuth from "@/src/components/auth/RequireAuth";

export default function CreateProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
