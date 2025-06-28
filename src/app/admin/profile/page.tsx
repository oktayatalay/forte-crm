'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Save, Shield, Mail, Calendar, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AdminProfile {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'superadmin';
  is_active: number;
  created_at: string;
  last_login: string | null;
}

export default function AdminProfile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'admin' as 'admin' | 'superadmin'
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    try {
      const response = await fetch('/api/admin/verify-session.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        localStorage.removeItem('admin_token');
        router.push('/admin');
        return;
      }

      const data = await response.json();
      setProfile(data.admin);
      setFormData({
        email: data.admin.email,
        full_name: data.admin.full_name,
        role: data.admin.role
      });
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('admin_token');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/profile.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Profil güncellendi');
        // Update local storage
        const updatedAdmin = { ...profile, ...formData };
        localStorage.setItem('admin_user', JSON.stringify(updatedAdmin));
        setProfile(updatedAdmin as AdminProfile);
      } else {
        toast.error(data.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Bağlantı hatası');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setSaving(true);

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/change-password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Şifre güncellendi');
        setShowPasswordForm(false);
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        toast.error(data.error || 'Şifre güncellenemedi');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Bağlantı hatası');
    } finally {
      setSaving(false);
    }
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
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = '/admin/dashboard'}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Geri
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Profil Ayarları</h1>
                <p className="text-sm text-gray-500 mt-1">Hesap bilgilerinizi yönetin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Profile Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Profil Bilgileri
              </h3>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {profile?.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{profile?.full_name}</h3>
                    <p className="text-gray-600">{profile?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">
                        {profile?.role === 'superadmin' ? 'Süper Admin' : 'Admin'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label htmlFor="full_name">Ad Soyad</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-posta Adresi</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Rol</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'superadmin' })} disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="superadmin">Süper Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Rol değişikliği için sistem yöneticisi ile iletişime geçin</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => window.location.href = '/admin/dashboard'}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Hesap Bilgileri
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hesap Oluşturma</p>
                    <p className="text-sm text-gray-600">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('tr-TR') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Son Giriş</p>
                    <p className="text-sm text-gray-600">
                      {profile?.last_login ? new Date(profile.last_login).toLocaleDateString('tr-TR') : 'İlk giriş'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Şifre Değiştir
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'İptal' : 'Şifre Değiştir'}
                </Button>
              </div>
            </div>
            
            {showPasswordForm && (
              <div className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="current_password">Mevcut Şifre</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="new_password">Yeni Şifre</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm_password">Yeni Şifre (Tekrar)</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          current_password: '',
                          new_password: '',
                          confirm_password: ''
                        });
                      }}
                    >
                      İptal
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={saving}
                    >
                      {saving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}