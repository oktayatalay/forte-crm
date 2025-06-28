'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: ''
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

      fetchSettings();
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('admin_token');
      router.push('/admin');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchSettings = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/settings.php', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
        
        // Populate form data
        const settingsMap: { [key: string]: string } = {};
        data.settings.forEach((setting: SystemSetting) => {
          settingsMap[setting.setting_key] = setting.setting_value;
        });
        
        setFormData({
          company_name: settingsMap.company_name || '',
          company_address: settingsMap.company_address || '',
          company_phone: settingsMap.company_phone || '',
          company_email: settingsMap.company_email || '',
          company_website: settingsMap.company_website || ''
        });
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
      toast.error('Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/settings.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Sistem ayarları güncellendi');
        fetchSettings();
      } else {
        toast.error(data.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Save error:', error);
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
                <h1 className="text-2xl font-semibold text-gray-900">Sistem Ayarları</h1>
                <p className="text-sm text-gray-500 mt-1">Şirket bilgilerini ve sistem ayarlarını yönetin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Şirket Bilgileri
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Sistem genelinde kullanılacak şirket bilgilerini düzenleyin
              </p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label htmlFor="company_name">Şirket Adı</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Forte Tourism"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="company_address">Şirket Adresi</Label>
                    <Textarea
                      id="company_address"
                      value={formData.company_address}
                      onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                      placeholder="İstanbul, Türkiye"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_phone">Şirket Telefonu</Label>
                      <Input
                        id="company_phone"
                        value={formData.company_phone}
                        onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                        placeholder="+90 212 XXX XX XX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="company_email">Şirket E-posta</Label>
                      <Input
                        id="company_email"
                        type="email"
                        value={formData.company_email}
                        onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                        placeholder="info@fortetourism.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company_website">Şirket Web Sitesi</Label>
                    <Input
                      id="company_website"
                      type="url"
                      value={formData.company_website}
                      onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                      placeholder="https://www.fortemeetingsevents.com/"
                    />
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

          {/* Settings History */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Ayar Geçmişi
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{setting.description}</p>
                      <p className="text-xs text-gray-500">{setting.setting_key}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900 max-w-xs truncate">{setting.setting_value}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(setting.updated_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}