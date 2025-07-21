'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Building, Calendar, Settings, Save, RotateCcw } from 'lucide-react';
import UserPhotoUpload from '@/components/ui/user-photo-upload';
import { getApiUrl } from '@/lib/config';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '@/styles/phone-input.css';

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
    parent_id: number | null;
    parent_name: string | null;
    grandparent_id: number | null;
    grandparent_name: string | null;
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
        const response = await fetch(getApiUrl('/api/endpoints/verify_session.php'), {
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
        const response = await fetch(getApiUrl('/api/endpoints/get_offices.php'));
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
        const response = await fetch(getApiUrl('/api/endpoints/get_departments.php'));
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

  const formatDepartmentSelectDisplay = (department: {
    id: number;
    name: string;
    description: string;
    parent_id: number | null;
    parent_name: string | null;
    grandparent_id: number | null;
    grandparent_name: string | null;
  }): string => {
    // Format department for selectbox display with hierarchy
    if (department.grandparent_id) {
      // Level 3 department
      return `${department.parent_name} / ${department.name}`;
    } else if (department.parent_id) {
      // Level 2 department  
      return `${department.parent_name} / ${department.name}`;
    } else {
      // Level 1 department
      return department.name;
    }
  };

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
      const response = await fetch(getApiUrl('/api/endpoints/update_profile.php'), {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Profil Düzenle</h1>
          <p className="text-sm text-muted-foreground">
            Mail imzası ve diğer özelliklerde kullanılacak bilgilerinizi güncelleyin
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Mail className="w-3 h-3 mr-1" />
            {user?.email}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil Fotoğrafı
            </CardTitle>
            <CardDescription>
              Fotoğrafınız mail imzası ve diğer yerlerde kullanılacak
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <UserPhotoUpload
              currentImage={user?.user_image}
              onImageUpdate={async (imageData) => {
                try {
                  const token = localStorage.getItem('session_token');
                  const response = await fetch(getApiUrl('/api/endpoints/update_user_photo.php'), {
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
                    toast.success('Profil fotoğrafı güncellendi');
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
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Kişisel Bilgiler
            </CardTitle>
            <CardDescription>
              Profil bilgilerinizi güncelleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Adresi
              </Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">Email adresi değiştirilemez</p>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Örn: Oktay Atalay"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Unvan / Pozisyon</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Örn: Yazılım Geliştirici"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Departman
                </Label>
                <Select 
                  value={formData.department_id?.toString() || undefined} 
                  onValueChange={(value) => handleInputChange('department_id', value === "none" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Departman seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Departman seçiniz</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {formatDepartmentSelectDisplay(dept)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Cinsiyet</Label>
                <Select 
                  value={formData.gender || undefined} 
                  onValueChange={(value) => handleInputChange('gender', value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cinsiyet seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Belirtmek istemiyorum</SelectItem>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Kadın</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                İletişim Bilgileri
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile1">Cep Telefonu 1</Label>
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="TR"
                    value={formData.mobile_phone_1}
                    onChange={(value) => handleInputChange('mobile_phone_1', value || '')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="555 123 45 67"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile2">Cep Telefonu 2 (Opsiyonel)</Label>
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="TR"
                    value={formData.mobile_phone_2}
                    onChange={(value) => handleInputChange('mobile_phone_2', value || '')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="555 987 65 43"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Yaşadığı Şehir
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Örn: İstanbul"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Doğum Tarihi
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Tam adres bilgisi..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Office Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-lg font-medium flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Çalıştığınız Ofisler
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Seçtiğiniz ofisler mail imzanızda görünecek
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offices.map(office => (
                  <Card key={office.code} className="p-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={office.code}
                        checked={formData.offices.includes(office.code)}
                        onChange={(e) => handleOfficeChange(office.code, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mt-1"
                      />
                      <Label htmlFor={office.code} className="flex-1 cursor-pointer">
                        <div className="font-medium">{office.name}</div>
                        <div className="text-sm text-muted-foreground">{office.address}</div>
                        <div className="text-xs text-muted-foreground">{office.phone}</div>
                      </Label>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Sıfırla
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Kullanım Alanları</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Ad Soyad:</strong> Mail imzası ve avatar&apos;da görünür</li>
                <li>• <strong>Unvan:</strong> Mail imzasında görünür</li>
                <li>• <strong>Telefon:</strong> Mail imzası ve out-of-office mesajlarında kullanılır</li>
                <li>• <strong>Ofis bilgileri:</strong> Mail imzasında iletişim detayları olarak görünür</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}