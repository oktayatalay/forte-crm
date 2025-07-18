"use client";

import React from "react";
import { usePathname } from "next/navigation";
import CorporateLayout from "@/components/layouts/corporate-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't apply corporate layout to admin pages
  const isAdminPage = pathname.startsWith('/admin');
  
  
  if (isAdminPage) {
    return <>{children}</>;
  }
  
  return (
    <CorporateLayout>
      {children}
    </CorporateLayout>
  );
}