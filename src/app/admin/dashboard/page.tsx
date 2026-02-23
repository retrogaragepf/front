"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import AdminLayout from "@/src/components/admin/AdminLayout";
import UsersSection from "@/src/components/admin/UsersSection";
import ProductRequestsSection from "@/src/components/admin/ProductRequestsSection";
import AdminChatsSection from "@/src/components/admin/AdminChatsSection";
import AdminSalesSection from "@/src/components/admin/AdminSalesSection";

export default function AdminDashboard(): ReactElement {
  const [section, setSection] = useState<
    "users" | "products" | "chats" | "sales"
  >(
    "users",
  );


  return (
    <AdminLayout section={section} setSection={setSection}>
      {section === "users" && <UsersSection />}
      {section === "products" && <ProductRequestsSection />}
      {section === "chats" && <AdminChatsSection />}
      {section === "sales" && <AdminSalesSection />}
    </AdminLayout>
  );
}
