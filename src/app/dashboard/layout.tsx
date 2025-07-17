import React from "react";
import CorporateLayout from "@/components/layouts/corporate-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CorporateLayout>
      {children}
    </CorporateLayout>
  );
}