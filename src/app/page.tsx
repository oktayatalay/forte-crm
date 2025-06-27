'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      toast.error('Email adresi gerekli');
      return;
    }

    if (!email.endsWith('@fortetourism.com')) {
      toast.error('Sadece @fortetourism.com uzantılı email adresleri kabul edilir');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('api/endpoints/send_code.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setStep('code');
      } else {
        toast.error(data.error || 'Bir hata oluştu');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast.error('6 haneli kod gerekli');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('api/endpoints/verify_code.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Session storage'a token'ı kaydet
        localStorage.setItem('session_token', data.session_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Dashboard'a yönlendir
        window.location.href = 'dashboard/';
      } else {
        toast.error(data.error || 'Kod doğrulama hatası');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Forte Panel</CardTitle>
          <CardDescription>
            {step === 'email' ? 'Giriş yapmak için email adresinizi girin' : 'Email adresinize gönderilen kodu girin'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {step === 'email' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email Adresi</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@fortetourism.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendCode()}
                  disabled={loading}
                />
              </div>
              
              <Button 
                onClick={handleSendCode} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Gönderiliyor...' : 'Kod Gönder'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Doğrulama Kodu</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="6 haneli kod"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyCode()}
                  disabled={loading}
                />
              </div>
              
              <div className="text-sm text-gray-600 text-center">
                Kod <strong>{email}</strong> adresine gönderildi
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleVerifyCode} 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
                </Button>
                
                <Button 
                  onClick={handleBackToEmail} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  Geri Dön
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
