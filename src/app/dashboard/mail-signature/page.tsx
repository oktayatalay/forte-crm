'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

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

export default function MailSignaturePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [offices, setOffices] = useState<Office[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

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
          setUser({
            ...data.user,
            offices: data.user.offices ? JSON.parse(data.user.offices) : []
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

    verifySession();
    loadOffices();
  }, []);

  const generateSignatureHTML = () => {
    if (!user) return '';

    const userOffices = user.offices || [];
    const selectedOffices = offices.filter(office => userOffices.includes(office.code));
    
    // İstanbul ofisi her zaman default
    const istanbulOffice = offices.find(office => office.code === 'istanbul');
    
    // Telefon numaraları
    const phoneNumbers = [];
    if (istanbulOffice) {
      phoneNumbers.push({ label: 'T:', phone: istanbulOffice.phone, isDefault: true });
    }
    
    // İstanbul dışındaki ofisler için T2, T3
    let phoneCounter = 2;
    selectedOffices.forEach(office => {
      if (office.code !== 'istanbul') {
        phoneNumbers.push({ label: `T${phoneCounter}:`, phone: office.phone, isDefault: false });
        phoneCounter++;
      }
    });

    return `
<table style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; border-collapse: collapse;">
  <tr>
    <td style="vertical-align: middle; padding-right: 20px; text-align: center;">
      <img src="https://mcusercontent.com/e2eb5d75756a2062106dcf373/images/9f3958ff-b80a-ae75-fc1d-b432570a5ea9.png" 
           alt="Forte Tourism Logo" 
           style="height: 80px; width: auto; display: block;" />
    </td>
    <td style="vertical-align: top; border-left: 2px solid #b80728; padding-left: 15px;">
      <!-- Ad Soyad -->
      <div style="font-family: Arial, sans-serif; font-size: 12pt; font-weight: bold; color: #C7162B; margin-bottom: 2px;">
        ${user.name || 'Ad Soyad'}
      </div>
      
      <!-- Title -->
      <div style="font-family: Arial, sans-serif; font-size: 10pt; color: #7F7F7F; text-transform: uppercase; margin-bottom: 2px;">
        ${user.title || 'UNVAN'}
      </div>
      
      <!-- İstanbul Ofis Adresi (Herkeste Default) -->
      ${istanbulOffice ? `
      <div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #7F7F7F; margin-bottom: 2px;">
        ${istanbulOffice.address}
      </div>` : ''}
      
      <!-- Diğer Seçili Ofis Adresleri -->
      ${selectedOffices.filter(office => office.code !== 'istanbul').map(office => `
      <div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #7F7F7F; margin-bottom: 2px;">
        ${office.address}
      </div>`).join('')}
      
      <!-- Telefon Numaraları -->
      ${phoneNumbers.map(phone => `
      <div style="margin-bottom: 2px;">
        <span style="font-family: Arial, sans-serif; font-size: 10pt; color: #c71628; font-weight: bold;">${phone.label}</span>
        <span style="font-family: Arial, sans-serif; font-size: 10pt; color: #7F7F7F;">${phone.phone}</span>
      </div>`).join('')}
      
      <!-- Mobil Numaralar -->
      ${user.mobile_phone_1 ? `
      <div style="margin-bottom: 2px;">
        <span style="font-family: Arial, sans-serif; font-size: 10pt; color: #c71628; font-weight: bold;">M:</span>
        <span style="font-family: Arial, sans-serif; font-size: 10pt; color: #7F7F7F;">${user.mobile_phone_1}</span>
      </div>` : ''}
      
      ${user.mobile_phone_2 ? `
      <div style="margin-bottom: 2px;">
        <span style="font-family: Arial, sans-serif; font-size: 10pt; color: #c71628; font-weight: bold;">M:</span>
        <span style="font-family: Arial, sans-serif; font-size: 10pt; color: #7F7F7F;">${user.mobile_phone_2}</span>
      </div>` : ''}
    </td>
  </tr>
</table>`;
  };

  useEffect(() => {
    const updatePreview = () => {
      if (previewRef.current) {
        const signatureHTML = generateSignatureHTML();
        previewRef.current.innerHTML = signatureHTML || '<p class="text-gray-500 italic">Profil bilgileri tamamlandığında önizleme görünecek</p>';
      }
    };

    if (!loading && offices.length > 0) {
      updatePreview();
    }
  }, [user, offices, loading]);

  const copyToClipboard = async () => {
    const signatureHTML = generateSignatureHTML();
    
    try {
      // Modern clipboard API ile HTML formatında kopyala
      const item = new ClipboardItem({
        'text/html': new Blob([signatureHTML], { type: 'text/html' }),
        'text/plain': new Blob([signatureHTML.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([item]);
      toast.success('İmza kopyalandı! Outlook\'ta Ctrl+V ile yapıştırabilirsiniz.');
    } catch {
      // Fallback: HTML'i geçici div'e koyup seç ve kopyala
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = signatureHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      document.execCommand('copy');
      document.body.removeChild(tempDiv);
      selection?.removeAllRanges();
      
      toast.success('İmza kopyalandı! Outlook\'ta Ctrl+V ile yapıştırabilirsiniz.');
    }
  };

  const downloadHTML = () => {
    const signatureHTML = generateSignatureHTML();
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email İmzası - ${user?.name || 'Forte Tourism'}</title>
</head>
<body>
${signatureHTML}
</body>
</html>`;
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_imza_${user?.name?.replace(/\s+/g, '_') || 'forte'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('İmza HTML dosyası indirildi!');
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
              <h1 className="text-xl font-semibold text-gray-900">Mail İmzası Generator</h1>
            </div>
            <span className="text-sm text-gray-600">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Check Profile Completeness */}
        {(!user?.name || !user?.title || (!user?.mobile_phone_1 && !user?.mobile_phone_2) || !user?.offices?.length) && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Profil bilgileriniz eksik
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>İmza oluşturmak için şu bilgileri tamamlamanız gerekiyor:</p>
                    <ul className="list-disc list-inside mt-1">
                      {!user?.name && <li>Ad Soyad</li>}
                      {!user?.title && <li>Unvan</li>}
                      {(!user?.mobile_phone_1 && !user?.mobile_phone_2) && <li>En az bir telefon numarası</li>}
                      {!user?.offices?.length && <li>Çalıştığınız ofisler</li>}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = '/dashboard/profile/'}
                    >
                      Profili Tamamla →
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Row 1: Info Panel - Full Width */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📧 Mail İmzası</CardTitle>
            <CardDescription>
              Outlook için HTML mail imzanız otomatik oluşturuldu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Current Data */}
            <div className="space-y-3">
              <h4 className="font-medium">Kullanılan Bilgiler:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <p><strong>Ad Soyad:</strong> {user?.name || '❌ Eksik'}</p>
                <p><strong>Unvan:</strong> {user?.title || '❌ Eksik'}</p>
                <p><strong>Telefon 1:</strong> {user?.mobile_phone_1 || '❌ Eksik'}</p>
                <p><strong>Telefon 2:</strong> {user?.mobile_phone_2 || '-'}</p>
                <p><strong>Ofisler:</strong> {
                  user?.offices?.length 
                    ? user.offices.map(code => offices.find(o => o.code === code)?.name).join(', ')
                    : '❌ Eksik'
                }</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button 
                onClick={copyToClipboard}
                disabled={!user?.name || !user?.title}
              >
                📋 Kopyala (Outlook&apos;a Yapıştır)
              </Button>
              
              <Button 
                variant="outline"
                onClick={downloadHTML}
                disabled={!user?.name || !user?.title}
              >
                💾 HTML Dosyası İndir
              </Button>

              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard/profile/'}
              >
                ⚙️ Profili Düzenle
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-600 space-y-1 pt-4 border-t">
              <p><strong>Outlook&apos;ta Kullanım:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>&quot;Kopyala&quot; butonuna basın</li>
                <li>Outlook → File → Options → Mail → Signatures</li>
                <li>New → İmza adı girin → Ctrl+V ile yapıştırın</li>
                <li>OK → İmzanız hazır!</li>
              </ol>
            </div>

            </CardContent>
          </Card>

        {/* Row 2: Preview Panel - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>📧 İmza Önizlemesi</CardTitle>
            <CardDescription>
              İmzanız email&apos;lerde bu şekilde görünecek
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            {/* Preview */}
            <div 
              id="preview"
              ref={previewRef}
              className="border rounded-lg p-6 bg-white min-h-[200px]"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(user?.name && user?.title ? generateSignatureHTML() : '<p class="text-gray-500 italic">Profil bilgileri tamamlandığında önizleme görünecek</p>') 
              }}
            />

          </CardContent>
        </Card>
      </main>
    </div>
  );
}