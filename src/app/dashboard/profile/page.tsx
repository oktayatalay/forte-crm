'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import UserPhotoUpload from '@/components/ui/user-photo-upload';

interface User {
  id: number;
  email: string;
  name: string | null;
  title: string | null;
  mobile_phone_1: string | null;
  mobile_phone_2: string | null;
  offices: string | null;
  gender: string | null;
  birth_date: string | null;
  city: string | null;
  address: string | null;
  department_id: number | null;
  department_name: string | null;
  user_image: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    mobile_phone_1: '',
    mobile_phone_2: '',
    offices: [] as string[],
    gender: '',
    birth_date: '',
    city: '',
    address: '',
    department_id: null as number | null
  });

  const [offices, setOffices] = useState<Array<{
    code: string;
    name: string;
    address: string;
    phone: string;
  }>>([]);

  const [departments, setDepartments] = useState<Array<{
    id: number;
    name: string;
    description: string;
  }>>([]);

  useEffect(() => {
    // Session kontrolü
    const verifySession = async () => {
      const token = localStorage.getItem('session_token');
      if (!token) {
        window.location.href = '../';
        return;
      }

      try {
        const response = await fetch('/api/endpoints/verify_session.php', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUser(data.user);
          const userOffices = data.user.offices ? JSON.parse(data.user.offices) : [];
          setFormData({
            name: data.user.name || '',
            title: data.user.title || '',
            mobile_phone_1: data.user.mobile_phone_1 || '',
            mobile_phone_2: data.user.mobile_phone_2 || '',
            offices: userOffices,
            gender: data.user.gender || '',
            birth_date: data.user.birth_date || '',
            city: data.user.city || '',
            address: data.user.address || '',
            department_id: data.user.department_id
          });
        } else {
          window.location.href = '/dashboard';
        }
      } catch {
        window.location.href = '../';
      } finally {
        setLoading(false);
      }
    };

    // Ofisleri yükle
    const loadOffices = async () => {
      try {
        const response = await fetch('/api/endpoints/get_offices.php');
        const data = await response.json();
        
        if (response.ok && data.success) {
          setOffices(data.offices);
        }
      } catch (error) {
        console.error('Ofisler yüklenemedi:', error);
      }
    };

    // Departmanları yükle
    const loadDepartments = async () => {
      try {
        const response = await fetch('/api/endpoints/get_departments.php');
        const data = await response.json();
        
        if (response.ok && data.success) {
          setDepartments(data.departments);
        }
      } catch (error) {
        console.error('Departmanlar yüklenemedi:', error);
      }
    };

    verifySession();
    loadOffices();
    loadDepartments();
  }, []);

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOfficeChange = (officeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      offices: checked 
        ? [...prev.offices, officeId]
        : prev.offices.filter(id => id !== officeId)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('session_token');

    try {
      const response = await fetch('/api/endpoints/update_profile.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        // LocalStorage'daki user bilgilerini güncelle
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Güncelleme başarısız');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (user) {
      const userOffices = user.offices ? JSON.parse(user.offices) : [];
      setFormData({
        name: user.name || '',
        title: user.title || '',
        mobile_phone_1: user.mobile_phone_1 || '',
        mobile_phone_2: user.mobile_phone_2 || '',
        offices: userOffices,
        gender: user.gender || '',
        birth_date: user.birth_date || '',
        city: user.city || '',
        address: user.address || '',
        department_id: user.department_id
      });
      toast.info('Form sıfırlandı');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Profil Düzenle
            </h1>
            <p className="text-muted-foreground mt-2">
              Mail imzası ve diğer özelliklerde kullanılacak bilgilerinizi güncelleyin
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Kullanıcı hesabı</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Kişisel Bilgiler</CardTitle>
            <CardDescription>
              Mail imzası ve diğer özelliklerde kullanılacak bilgilerinizi güncelleyin
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            
            {/* Profile Photo */}
            <div className="space-y-2">
              <Label>Profil Fotoğrafı</Label>
              <UserPhotoUpload
                currentImage={user?.user_image}
                onImageUpdate={async (imageData) => {
                  try {
                    const token = localStorage.getItem('session_token');
                    const response = await fetch('/api/endpoints/update_user_photo.php', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ image_data: imageData }),
                    });

                    if (response.ok) {
                      setUser(prev => prev ? { ...prev, user_image: imageData } : null);
                      // LocalStorage'daki user bilgilerini güncelle
                      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                      localStorage.setItem('user', JSON.stringify({
                        ...currentUser,
                        user_image: imageData
                      }));
                    } else {
                      const data = await response.json();
                      toast.error(data.error || 'Fotoğraf güncellenemedi');
                    }
                  } catch {
                    toast.error('Bağlantı hatası');
                  }
                }}
                size="lg"
                className="flex flex-col items-center"
              />
              <p className="text-sm text-gray-500">
                Fotoğrafınız mail imzası ve diğer yerlerde kullanılacak
              </p>
            </div>
            
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Adresi</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-sm text-gray-500">Email adresi değiştirilemez</p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Örn: Oktay Atalay"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Unvan / Pozisyon</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Örn: Yazılım Geliştirici"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Departman</Label>
              <Select 
                value={formData.department_id?.toString() || ''} 
                onValueChange={(value) => handleInputChange('department_id', value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Departman seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Departman seçiniz</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Cinsiyet</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => handleInputChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cinsiyet seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Belirtmek istemiyorum</SelectItem>
                  <SelectItem value="male">Erkek</SelectItem>
                  <SelectItem value="female">Kadın</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label htmlFor="birth_date">Doğum Tarihi</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">Yaşadığı Şehir</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Örn: İstanbul"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Tam adres bilgisi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Mobile Phone 1 */}
            <div className="space-y-2">
              <Label htmlFor="mobile1">Cep Telefonu 1</Label>
              <Input
                id="mobile1"
                type="tel"
                value={formData.mobile_phone_1}
                onChange={(e) => handleInputChange('mobile_phone_1', e.target.value)}
                placeholder="Örn: +90 555 123 45 67"
              />
            </div>

            {/* Mobile Phone 2 */}
            <div className="space-y-2">
              <Label htmlFor="mobile2">Cep Telefonu 2 (Opsiyonel)</Label>
              <Input
                id="mobile2"
                type="tel"
                value={formData.mobile_phone_2}
                onChange={(e) => handleInputChange('mobile_phone_2', e.target.value)}
                placeholder="Örn: +90 555 987 65 43"
              />
            </div>

            {/* Offices */}
            <div className="space-y-2">
              <Label>Çalıştığınız Ofisler</Label>
              <div className="space-y-3">
                {offices.map(office => (
                  <div key={office.code} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={office.code}
                      checked={formData.offices.includes(office.code)}
                      onChange={(e) => handleOfficeChange(office.code, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <Label htmlFor={office.code} className="flex-1 cursor-pointer">
                      <div className="font-medium">{office.name}</div>
                      <div className="text-sm text-gray-500">{office.address}</div>
                      <div className="text-xs text-gray-400">{office.phone}</div>
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Seçtiğiniz ofisler mail imzanızda görünecek
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleReset}
                disabled={saving}
              >
                ↺ Sıfırla
              </Button>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Kullanım Alanları</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Ad Soyad:</strong> Mail imzası ve avatar&apos;da görünür</li>
                <li>• <strong>Unvan:</strong> Mail imzasında görünür</li>
                <li>• <strong>Telefon:</strong> Mail imzası ve out-of-office mesajlarında kullanılır</li>
              </ul>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}