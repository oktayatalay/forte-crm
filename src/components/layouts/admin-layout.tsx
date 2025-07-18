"use client";

import React from "react";
import { Shield, Users, Settings, LogOut, BarChart3, Building, UserCheck, Camera, Mail, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Navigation items for Admin Panel
const navigationItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: BarChart3,
    description: "Genel bakış ve istatistikler"
  },
  {
    title: "Kullanıcı Yönetimi",
    href: "/admin/users",
    icon: Users,
    description: "Forte Corporate kullanıcıları"
  },
  {
    title: "Admin Yönetimi",
    href: "/admin/admins",
    icon: UserCheck,
    description: "Admin panel yetkileri"
  },
  {
    title: "Departmanlar",
    href: "/admin/departments",
    icon: Building,
    description: "Hiyerarşik departman yapısı"
  },
  {
    title: "Kullanıcı Fotoğrafları",
    href: "/admin/user-photos",
    icon: Camera,
    description: "Profil fotoğrafları"
  },
  {
    title: "Welcome Mailings",
    href: "/admin/welcome-mailings",
    icon: Mail,
    description: "Hoşgeldin mail tasarımları"
  },
  {
    title: "Profil",
    href: "/admin/profile",
    icon: Settings,
    description: "Admin hesap ayarları"
  },
  {
    title: "Sistem Ayarları",
    href: "/admin/settings",
    icon: Settings,
    description: "Genel sistem ayarları"
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  
  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    // Redirect to login
    window.location.href = '/admin';
  };

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    for (let i = 0; i < segments.length; i++) {
      const href = '/' + segments.slice(0, i + 1).join('/');
      const title = segments[i] === 'admin' ? 'Admin Panel' : 
                   segments[i] === 'users' ? 'Kullanıcı Yönetimi' :
                   segments[i] === 'departments' ? 'Departmanlar' :
                   segments[i] === 'settings' ? 'Sistem Ayarları' :
                   segments[i].charAt(0).toUpperCase() + segments[i].slice(1);
      
      breadcrumbs.push({ href, title });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50/40">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="w-full flex h-16 items-center px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="mr-4 hidden md:flex">
            <Link href="/admin/dashboard" className="mr-6 flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="hidden font-bold sm:inline-block">Forte Admin</span>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2 md:hidden">
                <Search className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <div className="h-6 w-6 rounded bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-white" />
                  </div>
                  Forte Admin
                </Link>
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${
                      isActive(item.href) ? "bg-muted text-foreground" : ""
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Breadcrumbs */}
          <div className="flex-1 mx-4">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4 ml-auto">
            {/* Admin Status Badge */}
            <Badge variant="destructive" className="hidden md:flex">
              <Shield className="mr-1 h-3 w-3" />
              Admin Panel
            </Badge>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/admin.png" alt="@admin" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin</p>
                    <p className="text-xs leading-none text-muted-foreground">admin@forte.works</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Sistem Ayarları</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Layout Container */}
      <div className="flex">
        {/* Sidebar - Desktop */}
        <div className="hidden md:block w-64 border-r bg-gray-100/40 min-h-screen">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex-1 overflow-auto py-2">
              <nav className="grid items-start px-4 text-sm font-medium">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
                      isActive(item.href) ? "bg-gray-100 text-gray-900" : ""
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      <span className="text-xs text-gray-400">{item.description}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="border-t bg-white">
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
              <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  © 2024 Forte Tourism - Admin Panel. Tüm hakları saklıdır.
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <Badge variant="outline">Admin v1.0.0</Badge>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}