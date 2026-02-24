"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/src/components/admin/AdminLayout";
import UsersSection from "@/src/components/admin/UsersSection";
import ProductRequestsSection from "@/src/components/admin/ProductRequestsSection";
import AdminChatsSection from "@/src/components/admin/AdminChatsSection";
import AdminSalesSection from "@/src/components/admin/AdminSalesSection";

export default function AdminDashboard(): ReactElement {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section") as
    | "users"
    | "products"
    | "chats"
    | "sales"
    | null;
  const autoOpenPending = searchParams.get("openChat") === "1";
  const initialSection =
    sectionParam === "users" ||
    sectionParam === "products" ||
    sectionParam === "chats" ||
    sectionParam === "sales"
      ? sectionParam
      : "users";

  const [section, setSection] = useState<
    "users" | "products" | "chats" | "sales"
  >(
    initialSection,
  );

  useEffect(() => {
    if (!sectionParam) return;
    const rafId = window.requestAnimationFrame(() => {
      setSection(sectionParam);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [sectionParam]);


  return (
    <AdminLayout section={section} setSection={setSection}>
      {section === "users" && <UsersSection />}
      {section === "products" && <ProductRequestsSection />}
      {section === "chats" && <AdminChatsSection autoOpenPending={autoOpenPending} />}
      {section === "sales" && <AdminSalesSection />}
    </AdminLayout>
  );
}
