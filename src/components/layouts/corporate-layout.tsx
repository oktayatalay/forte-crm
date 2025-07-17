"use client";

import React, { useState } from "react";
import { Bell, User, Settings, LogOut, Home, FileText, Mail, CreditCard, Users, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface CorporateLayoutProps {
  children: React.ReactNode;
}

// Navigation items for Forte Corporate
const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Ana sayfa ve genel bakış"
  },
  {
    title: "Mail İmzası",
    href: "/dashboard/mail-signature",
    icon: Mail,
    description: "HTML mail imzası oluştur"
  },
  {
    title: "Mail Avatar",
    href: "/dashboard/mail-avatar",
    icon: User,
    description: "SVG avatar oluştur"
  },
  {
    title: "Otomatik Yanıt",
    href: "/dashboard/auto-reply",
    icon: FileText,
    description: "Out of office mesajı"
  },
  {
    title: "Dijital Kartvizit",
    href: "/dashboard/vcard",
    icon: CreditCard,
    description: "vCard ve QR kod"
  },
  {
    title: "Ortak Hesaplar",
    href: "/dashboard/shared-accounts",
    icon: Users,
    description: "Şirket araçları"
  },
  {
    title: "Profil",
    href: "/dashboard/profile",
    icon: Settings,
    description: "Hesap ayarları"
  }
];

export default function CorporateLayout({ children }: CorporateLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-gray-50/40">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-bold">Forte Corporate</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isActive(item.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-1">
              <Badge variant="secondary">v1.0.0</Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Mobile Logo */}
            <div className="flex items-center lg:hidden">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="font-bold">Forte Corporate</span>
              </Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4 ml-auto">
              {/* Notifications */}
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Bildirimler</span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt="@user" />
                      <AvatarFallback>US</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Kullanıcı</p>
                      <p className="text-xs leading-none text-muted-foreground">user@forte.works</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Ayarlar</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t">
          <div className="flex flex-col items-center justify-between gap-4 py-10 px-4 sm:px-6 lg:px-8 md:h-24 md:flex-row md:py-0">
            <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                © 2024 Forte Tourism. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}