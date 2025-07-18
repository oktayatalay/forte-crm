"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AdminLayout from "@/components/layouts/admin-layout";

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't use admin layout for login and forgot password pages
  const isAuthPage = pathname === '/admin' || pathname === '/admin/' || 
                     pathname === '/admin/forgot-password' || pathname === '/admin/forgot-password/' ||
                     pathname === '/admin/reset-password' || pathname === '/admin/reset-password/';
  
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}