'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  name: string | null;
  title: string | null;
  mobile_phone_1: string | null;
  mobile_phone_2: string | null;
  offices: string[] | null;
}

interface Office {
  code: string;
  name: string;
  address: string;
  phone: string;
}

interface Colleague {
  id: number;
  name: string;
  email: string;
  mobile_phone_1: string | null;
  offices: string[];
}

export default function AutoReplyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState<Office[]>([]);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  
  const [formData, setFormData] = useState({
    endDate: '',
    reason: '',
    emailAccess: '',
    contactPerson: 'me', // 'me', 'colleague', 'custom', 'office'
    colleagueId: '',
    customPersonName: '',
    customPersonContact: '',
    contactMethod: 'phone', // 'phone', 'email'
    userPhone: '',
    userEmail: '',
    language: 'both', // 'both', 'tr', 'en'
    customMessage: ''
  });

  const reasons = [
    { tr: 'iş seyahati', en: 'business trip' },
    { tr: 'toplantı', en: 'meeting' },
    { tr: 'yıllık izin', en: 'annual leave' },
    { tr: 'hastalık izni', en: 'sick leave' },
    { tr: 'resmi tatil', en: 'national holiday' }
  ];

  const accessConditions = [
    { tr: 'olmayacak', en: 'no access' },
    { tr: 'kısıtlı olacak', en: 'limited access' }
  ];

  // Türkçe ek ekleme fonksiyonu (büyük/küçük ünlü uyumu)
  const addTurkishSuffix = (name: string): string => {
    if (!name) return '';
    
    const lastChar = name.toLowerCase().slice(-1);
    const lastThreeChars = name.toLowerCase().slice(-3);
    
    // Büyük ünlüler: a, ı, o, u
    const bigVowels = ['a', 'ı', 'o', 'u'];
    // Küçük ünlüler: e, i, ö, ü
    const smallVowels = ['e', 'i', 'ö', 'ü'];
    
    // Son harfi kontrol et
    if (bigVowels.includes(lastChar)) {
      return name + "'ya";
    } else if (smallVowels.includes(lastChar)) {
      return name + "'ye";
    }
    
    // Son 3 harfte büyük ünlü var mı?
    const hasBigVowelInLast3 = lastThreeChars.split('').some(char => bigVowels.includes(char));
    if (hasBigVowelInLast3) {
      return name + "'a";
    } else {
      return name + "'e";
    }
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
          setUser(data.user);
        } else {
          window.location.href = '/dashboard';
        }
      } catch {
        window.location.href = '/dashboard';
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

    // İş arkadaşlarını yükle (aynı ofiste çalışanlar)
    const loadColleagues = async () => {
      // Bu endpoint'i oluşturmamız gerekecek
      try {
        const response = await fetch('/api/endpoints/get_colleagues.php');
        const data = await response.json();
        
        if (response.ok && data.success) {
          setColleagues(data.colleagues);
        }
      } catch (error) {
        console.error('İş arkadaşları yüklenemedi:', error);
      }
    };

    verifySession();
    loadOffices();
    loadColleagues();
  }, []);

  const generateAutoReplyText = () => {
    if (!formData.endDate || !formData.reason || !formData.emailAccess) {
      return 'Lütfen tüm gerekli alanları doldurun...';
    }

    const endDate = new Date(formData.endDate);
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const dateEn = endDate.toLocaleDateString('en-US', dateOptions);
    const dateTr = endDate.toLocaleDateString('tr-TR', dateOptions);

    const reason = reasons.find(r => r.tr === formData.reason);
    const access = accessConditions.find(a => a.tr === formData.emailAccess);

    let contactInfo = '';
    let contactInfoTr = '';

    // Kişi bilgilerini hazırla
    if (formData.contactPerson === 'me') {
      contactInfo = 'me';
      contactInfoTr = 'bana';
      
      if (formData.contactMethod === 'phone' && formData.userPhone) {
        contactInfo += ` from my mobile: ${formData.userPhone}`;
        contactInfoTr += ` ${formData.userPhone} numarasından`;
      } else if (formData.contactMethod === 'email' && formData.userEmail) {
        contactInfo += ` at ${formData.userEmail}`;
        contactInfoTr += ` ${formData.userEmail} adresinden`;
      }
    } else if (formData.contactPerson === 'colleague' && formData.colleagueId) {
      const colleague = colleagues.find(c => c.id.toString() === formData.colleagueId);
      if (colleague) {
        contactInfo = colleague.name;
        contactInfoTr = addTurkishSuffix(colleague.name);
        
        if (formData.contactMethod === 'phone' && colleague.mobile_phone_1) {
          contactInfo += ` from ${colleague.mobile_phone_1}`;
          contactInfoTr += ` ${colleague.mobile_phone_1} numarasından`;
        } else if (formData.contactMethod === 'email') {
          contactInfo += ` at ${colleague.email}`;
          contactInfoTr += ` ${colleague.email} adresinden`;
        }
      }
    } else if (formData.contactPerson === 'custom' && formData.customPersonName) {
      contactInfo = formData.customPersonName;
      contactInfoTr = addTurkishSuffix(formData.customPersonName);
      
      if (formData.customPersonContact) {
        if (formData.customPersonContact.includes('@')) {
          contactInfo += ` at ${formData.customPersonContact}`;
          contactInfoTr += ` ${formData.customPersonContact} adresinden`;
        } else {
          contactInfo += ` from ${formData.customPersonContact}`;
          contactInfoTr += ` ${formData.customPersonContact} numarasından`;
        }
      }
    } else if (formData.contactPerson === 'office') {
      // Ofis telefonu bilgisi
      if (user?.offices && user.offices.length > 0) {
        const userOffice = offices.find(o => user.offices?.includes(o.code));
        if (userOffice) {
          contactInfo = `our ${userOffice.name} office from ${userOffice.phone}`;
          contactInfoTr = `${userOffice.name} ofisimizden ${userOffice.phone} numarasından`;
        }
      }
    }

    let message = '';

    // İngilizce kısım
    if (formData.language === 'both' || formData.language === 'en') {
      message += `Thank you for your message.

I'm currently out of office until **${dateEn}** with **${access?.en || 'no access'}** to my e-mail due to **${reason?.en || 'unavailability'}**.

For urgent matters, please contact **${contactInfo}**.

Best Regards`;
    }

    // Ayırıcı
    if (formData.language === 'both') {
      message += '\n\n---\n\n';
    }

    // Türkçe kısım
    if (formData.language === 'both' || formData.language === 'tr') {
      message += `Mesajınız için teşekkürler.

**${dateTr}** tarihine kadar **${reason?.tr || 'müsaitlik durumu'}** nedeniyle e-maillerime erişimim **${access?.tr || 'olmayacak'}**.

Acil durumlarda **${contactInfoTr}** ulaşabilirsiniz.

İyi çalışmalar`;
    }

    // Custom mesaj ekleme
    if (formData.customMessage.trim()) {
      message += '\n\n' + formData.customMessage;
    }

    return message;
  };

  // Markdown'ı HTML'e çeviren basit fonksiyon
  const markdownToHtml = (text: string): string => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const copyToClipboard = async () => {
    const text = generateAutoReplyText();
    const htmlText = markdownToHtml(text).replace(/\n/g, '<br>');
    const plainText = text.replace(/\*\*(.*?)\*\*/g, '$1');
    
    try {
      // HTML + Plain text formatında kopyala (Outlook için)
      const item = new ClipboardItem({
        'text/html': new Blob([htmlText], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([item]);
      toast.success('Otomatik yanıt metni kopyalandı! (Bold formatıyla)');
    } catch {
      // Fallback: HTML'i geçici div'e koyup seç ve kopyala
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlText;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      document.body.appendChild(tempDiv);
      
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      document.execCommand('copy');
      document.body.removeChild(tempDiv);
      selection?.removeAllRanges();
      
      toast.success('Otomatik yanıt metni kopyalandı! (Bold formatıyla)');
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/dashboard/'}
              >
                ← Geri
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Otomatik Yanıt Generator</h1>
            </div>
            <span className="text-sm text-gray-600">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Row 1: Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🏖️ Otomatik Yanıt Ayarları</CardTitle>
            <CardDescription>
              Out of office email metninizi oluşturun
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Bitiş Tarihi */}
              <div className="space-y-2">
                <Label htmlFor="endDate">Bitiş Tarihi / End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              {/* Sebep */}
              <div className="space-y-2">
                <Label htmlFor="reason">Sebep / Reason</Label>
                <select 
                  id="reason"
                  className="w-full p-2 border rounded-md"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                >
                  <option value="">Seçiniz / Please Select</option>
                  {reasons.map((reason, index) => (
                    <option key={index} value={reason.tr}>
                      {reason.tr} / {reason.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email Erişimi */}
              <div className="space-y-2">
                <Label htmlFor="emailAccess">Email Erişimi / Email Access</Label>
                <select 
                  id="emailAccess"
                  className="w-full p-2 border rounded-md"
                  value={formData.emailAccess}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailAccess: e.target.value }))}
                >
                  <option value="">Seçiniz / Please Select</option>
                  {accessConditions.map((condition, index) => (
                    <option key={index} value={condition.tr}>
                      Erişimim {condition.tr} / {condition.en}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* İletişim Kişisi */}
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Ulaşılacak Kişi / Contact Person</Label>
                <select 
                  id="contactPerson"
                  className="w-full p-2 border rounded-md"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                >
                  <option value="me">Ben / Me</option>
                  <option value="colleague">İş Arkadaşım (Listeden) / Colleague (From List)</option>
                  <option value="custom">İş Arkadaşım (Manuel) / Custom Contact</option>
                  <option value="office">Ofis Telefonu / Office Phone</option>
                </select>
              </div>

              {/* Dil Seçimi */}
              <div className="space-y-2">
                <Label htmlFor="language">Dil / Language</Label>
                <select 
                  id="language"
                  className="w-full p-2 border rounded-md"
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                >
                  <option value="both">Türkçe + İngilizce</option>
                  <option value="tr">Sadece Türkçe</option>
                  <option value="en">Sadece İngilizce</option>
                </select>
              </div>

            </div>

            {/* Koşullu alanlar */}
            {formData.contactPerson === 'me' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactMethod">İletişim Yöntemi / Contact Method</Label>
                  <select 
                    id="contactMethod"
                    className="w-full p-2 border rounded-md"
                    value={formData.contactMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactMethod: e.target.value }))}
                  >
                    <option value="phone">Telefon / Phone</option>
                    <option value="email">E-posta / Email</option>
                  </select>
                </div>
                
                {formData.contactMethod === 'phone' && (
                  <div className="space-y-2">
                    <Label htmlFor="userPhone">Telefon Numaram / My Phone</Label>
                    <Input
                      id="userPhone"
                      type="tel"
                      value={formData.userPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, userPhone: e.target.value }))}
                      placeholder="+90 555 123 45 67"
                    />
                  </div>
                )}
                
                {formData.contactMethod === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">E-posta Adresim / My Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={formData.userEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                      placeholder="benimadi@forte.works"
                    />
                  </div>
                )}
              </div>
            )}

            {formData.contactPerson === 'colleague' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="colleague">İş Arkadaşı / Colleague</Label>
                  <select 
                    id="colleague"
                    className="w-full p-2 border rounded-md"
                    value={formData.colleagueId}
                    onChange={(e) => setFormData(prev => ({ ...prev, colleagueId: e.target.value }))}
                  >
                    <option value="">Seçiniz / Please Select</option>
                    {colleagues.map((colleague) => (
                      <option key={colleague.id} value={colleague.id.toString()}>
                        {colleague.name} ({colleague.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                {formData.colleagueId && (
                  <div className="space-y-2">
                    <Label htmlFor="contactMethod">İletişim Yöntemi / Contact Method</Label>
                    <select 
                      id="contactMethod"
                      className="w-full p-2 border rounded-md"
                      value={formData.contactMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactMethod: e.target.value }))}
                    >
                      <option value="phone">Telefon / Phone</option>
                      <option value="email">E-posta / Email</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {formData.contactPerson === 'custom' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customPersonName">Kişi Adı / Person Name</Label>
                  <Input
                    id="customPersonName"
                    type="text"
                    value={formData.customPersonName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customPersonName: e.target.value }))}
                    placeholder="Oktay Atalay, İK Departmanı, vb."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customPersonContact">İletişim Bilgisi / Contact Info</Label>
                  <Input
                    id="customPersonContact"
                    type="text"
                    value={formData.customPersonContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, customPersonContact: e.target.value }))}
                    placeholder="oktay@forte.works veya +90 535 402 83 97"
                  />
                </div>
              </div>
            )}

            {/* Custom Mesaj */}
            <div className="space-y-2">
              <Label htmlFor="customMessage">Ek Mesaj / Additional Message (İsteğe Bağlı)</Label>
              <textarea 
                id="customMessage"
                className="w-full p-2 border rounded-md h-20"
                value={formData.customMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                placeholder="İsteğe bağlı ek mesaj..."
              />
            </div>

          </CardContent>
        </Card>

        {/* Row 2: Preview */}
        <Card>
          <CardHeader>
            <CardTitle>📧 Otomatik Yanıt Önizlemesi</CardTitle>
            <CardDescription>
              Email&apos;inizde bu metin gözükecek
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            <div className="border rounded-lg p-6 bg-white mb-4">
              <div 
                className="font-sans text-xs leading-relaxed whitespace-pre-wrap m-0"
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(generateAutoReplyText())
                }}
              />
            </div>

            <div className="space-y-3">
              <Button onClick={copyToClipboard} className="w-full md:w-auto">
                📋 Metni Kopyala (Bold Formatıyla)
              </Button>
              
              <div className="text-xs text-gray-600 space-y-1 pt-2 border-t">
                <p><strong>💡 Kullanım İpucu:</strong></p>
                <p>• Kopyalanan metin <strong>HTML formatında</strong> - email&apos;de <strong>bold</strong> görünür</p>
                <p>• Outlook: Direkt Ctrl+V ile yapıştırın (formatlar korunur)</p>
                <p>• Gmail: Compose ekranında direkt yapıştırın</p>
                <p>• Diğer email istemcileri: Rich Text formatı desteklenir</p>
              </div>
            </div>

          </CardContent>
        </Card>

      </main>
    </div>
  );
}