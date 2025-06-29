'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface DashboardStats {
  total_users: number;
  total_admins: number;
  total_departments: number;
  recent_logins: number;
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifySession();
    loadDashboardStats();
  }, []);

  const verifySession = async () => {
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
      window.location.href = '/admin';
      return;
    }

    try {
      const response = await fetch('/api/admin/verify-session.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAdmin(data.admin);
      } else {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin';
      }
    } catch {
      toast.error('Session doğrulama hatası');
      window.location.href = '/admin';
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    const token = localStorage.getItem('admin_token');
    
    try {
      const response = await fetch('/api/admin/dashboard-stats.php', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch {
      console.error('İstatistikler yüklenemedi');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Forte Panel yönetim merkezi</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {admin?.full_name} ({admin?.role})
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Hoş geldiniz, {admin?.full_name}!
            </h2>
            <p className="text-gray-600">
              Forte Panel yönetim paneline hoş geldiniz. Sistem istatistikleri ve yönetim araçları aşağıda bulunmaktadır.
            </p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_users}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Admin</CardTitle>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_admins}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Departmanlar</CardTitle>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_departments}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Son 24 Saat Giriş</CardTitle>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recent_logins}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* User Management */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V9a3 3 0 00-6 0v2m0 0V9a3 3 0 016 0v2m-3 7h3m-3 0h-3m3 0v-3m0 3v3" />
                  </svg>
                  Kullanıcı Yönetimi
                </CardTitle>
                <CardDescription>
                  Tüm kullanıcıları görüntüle, düzenle ve yönet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = '/admin/users'}
                >
                  👥 Kullanıcıları Yönet
                </Button>
              </CardContent>
            </Card>

            {/* Admin Management (Superadmin only) */}
            {admin?.role === 'superadmin' && (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin Yönetimi
                  </CardTitle>
                  <CardDescription>
                    Admin kullanıcıları ekle, düzenle ve yönet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = '/admin/admins'}
                  >
                    🛡️ Adminleri Yönet
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Department Management */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Departman Yönetimi
                </CardTitle>
                <CardDescription>
                  Departmanları ekle, düzenle ve yönet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/admin/departments'}
                >
                  🏢 Departmanları Yönet
                </Button>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Sistem Ayarları
                </CardTitle>
                <CardDescription>
                  Şirket bilgileri ve sistem ayarları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/admin/settings'}
                >
                  ⚙️ Ayarları Yönet
                </Button>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil Ayarları
                </CardTitle>
                <CardDescription>
                  Şifrenizi ve profil bilgilerinizi güncelleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/admin/profile'}
                >
                  👤 Profili Düzenle
                </Button>
              </CardContent>
            </Card>

            {/* User Photos */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Kullanıcı Fotoğrafları
                </CardTitle>
                <CardDescription>
                  Kullanıcı profil fotoğraflarını departmanlara göre yönet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => window.location.href = '/admin/user-photos'}
                >
                  📷 Fotoğrafları Yönet
                </Button>
              </CardContent>
            </Card>

            {/* Welcome Mailings */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Welcome Mailings
                </CardTitle>
                <CardDescription>
                  Yeni kullanıcılar için hoş geldin e-postalarını yönet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => window.location.href = '/admin/welcome-mailings'}
                >
                  📧 Mailings Yönet
                </Button>
              </CardContent>
            </Card>

            {/* Back to User Panel */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kullanıcı Paneli
                </CardTitle>
                <CardDescription>
                  Normal kullanıcı paneline dön
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  🏠 Kullanıcı Paneline Dön
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}