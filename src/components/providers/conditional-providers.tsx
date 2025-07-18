"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';

interface ConditionalProvidersProps {
  children: React.ReactNode;
}

export function ConditionalProviders({ children }: ConditionalProvidersProps) {
  const pathname = usePathname();
  
  // Don't use SidebarProvider for admin pages
  const isAdminPage = pathname.startsWith('/admin');
  
  return (
    <ThemeProvider>
      {isAdminPage ? (
        children
      ) : (
        <SidebarProvider>
          {children}
        </SidebarProvider>
      )}
    </ThemeProvider>
  );
}