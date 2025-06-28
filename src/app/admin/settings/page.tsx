'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save, Building2, MapPin, Eye, EyeOff, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
}

interface Office {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOfficeDialogOpen, setIsOfficeDialogOpen] = useState(false);
  const [isEditOfficeDialogOpen, setIsEditOfficeDialogOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: ''
  });

  const [officeFormData, setOfficeFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    is_active: 1,
    sort_order: 0
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
      fetchOffices();
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

  const fetchOffices = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/offices.php', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOffices(data.offices);
      }
    } catch (error) {
      console.error('Fetch offices error:', error);
      toast.error('Ofisler yüklenemedi');
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

  const handleOfficeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem('admin_token');
    try {
      const url = '/api/admin/offices.php';
      const method = editingOffice ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingOffice ? { ...officeFormData, id: editingOffice.id } : officeFormData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingOffice ? 'Ofis güncellendi' : 'Ofis eklendi');
        fetchOffices();
        setIsOfficeDialogOpen(false);
        setIsEditOfficeDialogOpen(false);
        setEditingOffice(null);
        setOfficeFormData({
          code: '',
          name: '',
          address: '',
          phone: '',
          is_active: 1,
          sort_order: 0
        });
      } else {
        toast.error(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Office submit error:', error);
      toast.error('Bağlantı hatası');
    } finally {
      setSaving(false);
    }
  };

  const handleEditOffice = (office: Office) => {
    setEditingOffice(office);
    setOfficeFormData({
      code: office.code,
      name: office.name,
      address: office.address,
      phone: office.phone,
      is_active: office.is_active,
      sort_order: office.sort_order
    });
    setIsEditOfficeDialogOpen(true);
  };

  const handleDeleteOffice = async (officeId: number) => {
    if (!confirm('Bu ofisi silmek istediğinizden emin misiniz?')) {
      return;
    }

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/offices.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: officeId })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Ofis silindi');
        fetchOffices();
      } else {
        toast.error(data.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Delete office error:', error);
      toast.error('Bağlantı hatası');
    }
  };

  const toggleOfficeStatus = async (office: Office) => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/offices.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: office.id,
          code: office.code,
          name: office.name,
          address: office.address,
          phone: office.phone,
          is_active: office.is_active === 1 ? 0 : 1,
          sort_order: office.sort_order
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Ofis ${office.is_active === 1 ? 'pasifleştirildi' : 'aktifleştirildi'}`);
        fetchOffices();
      }
    } catch (error) {
      console.error('Toggle office status error:', error);
      toast.error('Durum güncellenemedi');
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

          {/* Office Management */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Ofis Yönetimi
                </h3>
                <Button 
                  onClick={() => setIsOfficeDialogOpen(true)} 
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Ofis
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {offices.map((office) => (
                  <div key={office.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {office.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium">{office.name}</h3>
                          <p className="text-sm text-gray-600">{office.address || 'Adres bulunmuyor'}</p>
                          <p className="text-xs text-blue-600">{office.phone}</p>
                          <p className="text-xs text-gray-500">Kod: {office.code}</p>
                        </div>
                        <Badge variant={office.is_active === 1 ? 'default' : 'destructive'}>
                          {office.is_active === 1 ? 'Aktif' : 'Pasif'}
                        </Badge>
                        <Badge variant="outline">
                          Sıra: {office.sort_order}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOfficeStatus(office)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                      >
                        {office.is_active === 1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOffice(office)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOffice(office.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
                {offices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Henüz ofis eklenmemiş</p>
                    <Button 
                      onClick={() => setIsOfficeDialogOpen(true)} 
                      variant="outline" 
                      className="mt-4"
                    >
                      İlk ofisi ekle
                    </Button>
                  </div>
                )}
              </div>
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

      {/* Add Office Dialog */}
      <Dialog open={isOfficeDialogOpen} onOpenChange={setIsOfficeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Ofis Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOfficeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="office_code">Ofis Kodu *</Label>
                  <Input
                    id="office_code"
                    value={officeFormData.code}
                    onChange={(e) => setOfficeFormData({ ...officeFormData, code: e.target.value })}
                    placeholder="İstanbul"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="office_name">Ofis Adı *</Label>
                  <Input
                    id="office_name"
                    value={officeFormData.name}
                    onChange={(e) => setOfficeFormData({ ...officeFormData, name: e.target.value })}
                    placeholder="İstanbul"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="office_address">Adres</Label>
                <Textarea
                  id="office_address"
                  value={officeFormData.address}
                  onChange={(e) => setOfficeFormData({ ...officeFormData, address: e.target.value })}
                  placeholder="Tam adres bilgisi"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="office_phone">Telefon</Label>
                  <Input
                    id="office_phone"
                    value={officeFormData.phone}
                    onChange={(e) => setOfficeFormData({ ...officeFormData, phone: e.target.value })}
                    placeholder="+90 212 XXX XX XX"
                  />
                </div>
                <div>
                  <Label htmlFor="office_sort_order">Sıralama</Label>
                  <Input
                    id="office_sort_order"
                    type="number"
                    value={officeFormData.sort_order}
                    onChange={(e) => setOfficeFormData({ ...officeFormData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="office_status">Durum</Label>
                <Select 
                  value={officeFormData.is_active.toString()} 
                  onValueChange={(value) => setOfficeFormData({ ...officeFormData, is_active: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Aktif</SelectItem>
                    <SelectItem value="0">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsOfficeDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? 'Ekleniyor...' : 'Ofis Ekle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Office Dialog */}
      <Dialog open={isEditOfficeDialogOpen} onOpenChange={setIsEditOfficeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ofis Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOfficeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_office_code">Ofis Kodu *</Label>
                  <Input
                    id="edit_office_code"
                    value={officeFormData.code}
                    onChange={(e) => setOfficeFormData({ ...officeFormData, code: e.target.value })}
                    placeholder="İstanbul"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_office_name">Ofis Adı *</Label>
                  <Input
                    id="edit_office_name"
                    value={officeFormData.name}
                    onChange={(e) => setOfficeFormData({ ...officeFormData, name: e.target.value })}
                    placeholder="İstanbul"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_office_address">Adres</Label>
                <Textarea
                  id="edit_office_address"
                  value={officeFormData.address}
                  onChange={(e) => setOfficeFormData({ ...officeFormData, address: e.target.value })}
                  placeholder="Tam adres bilgisi"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_office_phone">Telefon</Label>
                  <Input
                    id="edit_office_phone"
                    value={officeFormData.phone}
                    onChange={(e) => setOfficeFormData({ ...officeFormData, phone: e.target.value })}
                    placeholder="+90 212 XXX XX XX"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_office_sort_order">Sıralama</Label>
                  <Input
                    id="edit_office_sort_order"
                    type="number"
                    value={officeFormData.sort_order}
                    onChange={(e) => setOfficeFormData({ ...officeFormData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_office_status">Durum</Label>
                <Select 
                  value={officeFormData.is_active.toString()} 
                  onValueChange={(value) => setOfficeFormData({ ...officeFormData, is_active: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Aktif</SelectItem>
                    <SelectItem value="0">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOfficeDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? 'Güncelleniyor...' : 'Ofis Güncelle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}