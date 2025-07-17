'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface User {
  id: number;
  email: string;
  name: string | null;
  title: string | null;
  mobile_phone_1: string | null;
  mobile_phone_2: string | null;
  offices: string[] | null;
}


export default function VCardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Email'den ad-soyad çıkarma fonksiyonu
  const extractNameFromEmail = (email: string): { firstName: string; lastName: string } => {
    if (!email.includes('@fortetourism.com')) {
      return { firstName: '', lastName: '' };
    }
    
    const localPart = email.split('@')[0];
    const parts = localPart.split('.');
    
    if (parts.length >= 2) {
      const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      return { firstName, lastName };
    }
    
    return { firstName: localPart, lastName: '' };
  };

  // URL slug oluşturma (Türkçe karakter desteği ile)
  const createSlug = (name: string): string => {
    const turkishToEnglish: { [key: string]: string } = {
      'ç': 'c', 'Ç': 'C',
      'ğ': 'g', 'Ğ': 'G', 
      'ı': 'i', 'I': 'I',
      'İ': 'I', 'i': 'i',
      'ö': 'o', 'Ö': 'O',
      'ş': 's', 'Ş': 'S',
      'ü': 'u', 'Ü': 'U'
    };
    
    return name
      .split('')
      .map(char => turkishToEnglish[char] || char)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  useEffect(() => {
    // Session kontrolü
    const verifySession = async () => {
      const token = localStorage.getItem('session_token');
      if (!token) {
        window.location.href = '/dashboard';
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
          const userData = data.user;
          
          // Eğer name yoksa email'den çıkar
          if (!userData.name) {
            const { firstName, lastName } = extractNameFromEmail(userData.email);
            if (firstName && lastName) {
              userData.name = `${firstName} ${lastName}`;
            }
          }
          
          setUser(userData);
        } else {
          window.location.href = '/dashboard';
        }
      } catch {
        window.location.href = '/dashboard';
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // QR kod oluştur (user değiştiğinde)
  useEffect(() => {
    if (user?.name) {
      const url = getVCardUrl();
      generateQRCode(url);
      
      // WhatsApp QR da oluştur
      if (user?.mobile_phone_1) {
        const whatsappUrl = getWhatsAppUrl();
        generateWhatsAppQRCode(whatsappUrl);
      }
    }
  }, [user]);

  // vCard generate etme
  const generateVCard = async () => {
    if (!user) return;
    
    setGenerating(true);
    
    try {
      const token = localStorage.getItem('session_token');
      
      const response = await fetch('/api/endpoints/generate_vcard.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('vCard başarıyla oluşturuldu!');
        // QR kodunu yenile
        window.location.reload();
      } else {
        toast.error(data.error || 'vCard oluşturulamadı');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setGenerating(false);
    }
  };

  // Avatar oluşturma
  const generateAvatar = () => {
    if (!user?.name) return '';
    
    const names = user.name.split(' ');
    const initials = names.length >= 2 
      ? names[0].charAt(0) + names[names.length - 1].charAt(0)
      : names[0].charAt(0);
    
    return initials.toUpperCase();
  };

  // vCard URL oluşturma
  const getVCardUrl = () => {
    if (!user?.name) return '';
    
    const slug = createSlug(user.name);
    return `https://corporate.forte.works/vcard/${slug}/`;
  };

  // WhatsApp URL oluşturma
  const getWhatsAppUrl = () => {
    if (!user?.mobile_phone_1) return '';
    
    // Telefon numarasını temizle (sadece rakamlar)
    const cleanPhone = user.mobile_phone_1.replace(/[^\d]/g, '');
    
    // Türkiye kodu ekle (eğer yoksa)
    let phoneNumber = cleanPhone;
    if (!phoneNumber.startsWith('90') && phoneNumber.startsWith('5')) {
      phoneNumber = '90' + phoneNumber;
    }
    
    return `https://wa.me/${phoneNumber}`;
  };

  // Dosya adı oluşturma
  const getVCardFileName = () => {
    if (!user?.name) return 'contact.vcf';
    
    const slug = createSlug(user.name);
    return `${slug}.vcf`;
  };

  // QR kod state'i
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [whatsappQRCodeDataURL, setWhatsappQRCodeDataURL] = useState<string>('');

  // QR kod oluşturma
  const generateQRCode = async (url: string) => {
    try {
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataURL(qrDataURL);
      return qrDataURL;
    } catch (error) {
      console.error('QR kod oluşturulamadı:', error);
      return '';
    }
  };

  // WhatsApp QR kod oluşturma
  const generateWhatsAppQRCode = async (url: string) => {
    try {
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#25D366', // WhatsApp green
          light: '#FFFFFF'
        }
      });
      setWhatsappQRCodeDataURL(qrDataURL);
      return qrDataURL;
    } catch (error) {
      console.error('WhatsApp QR kod oluşturulamadı:', error);
      return '';
    }
  };

  // QR PNG indirme
  const downloadQRPNG = async () => {
    if (!user?.name || !qrCodeDataURL) return;
    
    // DataURL'den blob oluştur
    const response = await fetch(qrCodeDataURL);
    const blob = await response.blob();
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${createSlug(user.name || 'contact')}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // QR SVG indirme
  const downloadQRSVG = async () => {
    if (!user?.name) return;
    
    try {
      const url = getVCardUrl();
      const svgString = await QRCode.toString(url, {
        type: 'svg',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${createSlug(user.name || 'contact')}-qr.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('QR SVG oluşturulamadı:', error);
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
              Dijital Kartvizit (vCard)
            </h1>
            <p className="text-muted-foreground mt-2">
              Profil bilgileriniz otomatik olarak vCard’ınızda kullanılır
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Kullanıcı hesabı</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        
        {/* Row 1: Bilgiler & Ayarlar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📇 Dijital Kartvizit Bilgileri</CardTitle>
            <CardDescription>
              Profil bilgileriniz otomatik olarak vCard&apos;ınızda kullanılır
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Temel Bilgiler */}
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {user?.name || 'Profilde güncelleyin'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Unvan</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {user?.title || 'Profilde güncelleyin'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {user?.email}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Telefon 1</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {user?.mobile_phone_1 || 'Profilde güncelleyin'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Telefon 2</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {user?.mobile_phone_2 || '-'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  https://www.fortemeetingsevents.com/
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-2">
                <Label>Avatar (Otomatik)</Label>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-red-700"
                  >
                    {generateAvatar()}
                  </div>
                  <span className="text-sm text-gray-600">
                    Mail Avatar sisteminden otomatik
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Şirket</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  Forte Tourism
                </div>
              </div>

            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button 
                onClick={() => window.location.href = '/dashboard/profile/'}
                variant="outline"
              >
                ⚙️ Profili Düzenle
              </Button>
              
              <Button 
                onClick={generateVCard}
                disabled={generating}
              >
                {generating ? '🔄 Oluşturuluyor...' : '📇 vCard\'ı Yenile'}
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Row 2: QR Kod, WhatsApp QR & Önizleme */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* QR Kod */}
          <Card>
            <CardHeader>
              <CardTitle>📱 QR Kod</CardTitle>
              <CardDescription>
                vCard sayfanıza yönlendiren QR kod
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              
              <div className="bg-white p-4 rounded-lg border inline-block">
                {user?.name && qrCodeDataURL ? (
                  <img 
                    src={qrCodeDataURL} 
                    alt="QR Code" 
                    className="w-48 h-48"
                  />
                ) : user?.name ? (
                  <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                      <div className="text-sm">QR kod oluşturuluyor...</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">❌</div>
                      <div className="text-sm">Profil tamamlanmamış</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">vCard URL:</p>
                <div className="text-xs bg-gray-50 p-2 rounded break-all">
                  <a 
                    href={getVCardUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {getVCardUrl()}
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Dosya Adı:</p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {getVCardFileName()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={!user?.name || !qrCodeDataURL}
                  onClick={downloadQRPNG}
                >
                  📥 QR PNG İndir
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={!user?.name || !qrCodeDataURL}
                  onClick={downloadQRSVG}
                >
                  📥 QR SVG İndir
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* WhatsApp QR Kod */}
          <Card>
            <CardHeader>
              <CardTitle>💬 WhatsApp QR</CardTitle>
              <CardDescription>
                WhatsApp iletişim için QR kod
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              
              <div className="bg-white p-4 rounded-lg border inline-block">
                {user?.mobile_phone_1 && whatsappQRCodeDataURL ? (
                  <img 
                    src={whatsappQRCodeDataURL} 
                    alt="WhatsApp QR Code" 
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-sm text-center">
                      {user?.mobile_phone_1 ? 'QR kod oluşturuluyor...' : 'Telefon numarası gerekli'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">WhatsApp URL:</p>
                <div className="text-xs bg-gray-50 p-2 rounded break-all">
                  {user?.mobile_phone_1 ? (
                    <a 
                      href={getWhatsAppUrl()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 hover:underline"
                    >
                      {getWhatsAppUrl()}
                    </a>
                  ) : (
                    <span className="text-gray-400">Telefon numarası gerekli</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={async () => {
                    if (!user?.mobile_phone_1 || !whatsappQRCodeDataURL) return;
                    
                    // PNG olarak indir
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      
                      canvas.toBlob((blob) => {
                        if (blob) {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `whatsapp-qr-${createSlug(user.name || 'contact')}.png`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                      });
                    };
                    
                    img.src = whatsappQRCodeDataURL;
                  }}
                  disabled={!user?.mobile_phone_1 || !whatsappQRCodeDataURL}
                >
                  📥 WhatsApp QR PNG İndir
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Mobil Önizleme */}
          <Card>
            <CardHeader>
              <CardTitle>📱 Mobil Önizleme</CardTitle>
              <CardDescription>
                vCard sayfanızın mobil görünümü
              </CardDescription>
            </CardHeader>
            <CardContent>
              
              <div className="bg-gray-800 rounded-2xl p-4 mx-auto w-[280px]">
                <div className="bg-white rounded-xl overflow-hidden h-[500px]">
                  
                  {user?.name ? (
                    <div className="h-full flex flex-col">
                      {/* Header */}
                      <div className="bg-red-600 text-white p-4 text-center">
                        <div 
                          className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold border-2 border-white bg-gradient-to-br from-red-700 to-red-800"
                        >
                          {generateAvatar()}
                        </div>
                        <h3 className="font-bold text-sm">{user.name}</h3>
                        <p className="text-xs opacity-90">{user.title || 'POSITION'}</p>
                      </div>
                      
                      {/* Body */}
                      <div className="flex-1 p-3 space-y-3 text-xs">
                        <div className="flex items-center space-x-2">
                          <span>📞</span>
                          <div>
                            <div className="font-medium">{user.mobile_phone_1 || '+90 XXX XXX XX XX'}</div>
                            <div className="text-gray-500">Mobile</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span>📧</span>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-gray-500">Email</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span>🏢</span>
                          <div>
                            <div className="font-medium">Forte Tourism</div>
                            <div className="text-gray-500">{user.title || 'POSITION'}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span>🌐</span>
                          <div>
                            <div className="font-medium">fortemeetingsevents.com</div>
                            <div className="text-gray-500">Website</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Download Button */}
                      <div className="p-3">
                        <div className="bg-red-600 text-white text-center py-2 rounded text-xs font-medium">
                          📥 Download vCard
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-2xl mb-2">📇</div>
                        <div className="text-xs">Profil bilgilerini tamamlayın</div>
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}