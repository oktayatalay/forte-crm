'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  name: string | null;
  title: string | null;
  mobile_phone_1: string | null;
  mobile_phone_2: string | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session kontrolü yap
    const verifySession = async () => {
      const token = localStorage.getItem('session_token');
      
      if (!token) {
        window.location.href = '../';
        return;
      }

      try {
        const response = await fetch('../api/endpoints/verify_session.php', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
        } else {
          localStorage.removeItem('session_token');
          localStorage.removeItem('user');
          window.location.href = '../';
        }
      } catch {
        toast.error('Session doğrulama hatası');
        window.location.href = '../';
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
    window.location.href = '../';
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Forte Panel</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Hoş geldiniz{user?.name ? `, ${user.name}` : ''}!
          </h2>
          <p className="text-gray-600">
            Forte Panel&apos;e hoş geldiniz. Aşağıdaki araçları kullanabilirsiniz.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mail Avatar Generator */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mail Avatar
              </CardTitle>
              <CardDescription>
                SVG formatında mail avatarı oluşturun ve indirin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => window.location.href = '/dashboard/mail-avatar/'}
              >
                🎨 Avatar Oluştur
              </Button>
            </CardContent>
          </Card>

          {/* Email Signature Generator */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Mail İmzası
              </CardTitle>
              <CardDescription>
                HTML formatında Outlook mail imzası oluşturun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/dashboard/mail-signature/'}
              >
                📧 İmza Oluştur
              </Button>
            </CardContent>
          </Card>

          {/* Out of Office Generator */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Otomatik Yanıt
              </CardTitle>
              <CardDescription>
                Out of office email metni oluşturun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/dashboard/auto-reply/'}
              >
                🏖️ Otomatik Yanıt Oluştur
              </Button>
            </CardContent>
          </Card>

          {/* vCard Viewer */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 2v20M14 2v20M4 7h16M4 17h16" />
                </svg>
                Dijital Kartvizit
              </CardTitle>
              <CardDescription>
                vCard&apos;ınızı görüntüleyin ve QR kod indirin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/dashboard/vcard/'}
              >
                📇 vCard&apos;ınızı Görüntüleyin
              </Button>
            </CardContent>
          </Card>

          {/* Shared Credentials */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Ortak Hesaplar
              </CardTitle>
              <CardDescription>
                WeTransfer, SmallPDF gibi ortak hesap bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Yakında Gelecek
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Info Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>
                Kişisel bilgilerinizi güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Ad Soyad:</strong> {user?.name || 'Henüz girilmemiş'}</p>
                <p><strong>Unvan:</strong> {user?.title || 'Henüz girilmemiş'}</p>
                <p><strong>Telefon 1:</strong> {user?.mobile_phone_1 || 'Henüz girilmemiş'}</p>
                <p><strong>Telefon 2:</strong> {user?.mobile_phone_2 || 'Henüz girilmemiş'}</p>
              </div>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => window.location.href = '/dashboard/profile/'}
              >
                ✏️ Düzenle
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}