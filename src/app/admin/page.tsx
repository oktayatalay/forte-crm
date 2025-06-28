'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.admin));
        toast.success('Giriş başarılı!');
        window.location.href = '/admin/dashboard';
      } else {
        toast.error(data.error || 'Giriş başarısız');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/forgot-password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!');
        setShowForgotPassword(false);
        setResetEmail('');
      } else {
        toast.error(data.error || 'Şifre sıfırlama başarısız');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        
        {!showForgotPassword ? (
          // Login Form
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Panel
              </h1>
              <p className="text-gray-600 mt-2">
                Forte Panel yönetici girişi
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta Adresi</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@fortetourism.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>

                <div className="text-center">
                  <a
                    href="/admin/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Şifremi unuttum
                  </a>
                </div>
            </form>
          </div>
        ) : (
          // Forgot Password Form
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Şifre Sıfırlama
              </h1>
              <p className="text-gray-600 mt-2">
                E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz
              </p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">E-posta Adresi</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="admin@fortetourism.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    ← Giriş sayfasına dön
                  </button>
                </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Forte Tourism. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
}