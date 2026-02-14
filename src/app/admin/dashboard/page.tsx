"use client";

import { useState } from "react";
import AdminLayout from "@/src/components/admin/AdminLayout";
import UsersSection from "@/src/components/admin/UsersSection";
import ProductRequestsSection from "@/src/components/admin/ProductRequestsSection";

export default function AdminDashboard() {
const [section, setSection] = useState<"users" | "products">("users");


  return (
    <AdminLayout section={section} setSection={setSection}>
      {section === "users" ? (
        <UsersSection />
      ) : (
        <ProductRequestsSection />
      )}
    </AdminLayout>
  );
}

