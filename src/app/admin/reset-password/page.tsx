'use client';

import { useState, useEffect, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      verifyToken(tokenParam);
    } else {
      setError('Geçersiz şifre sıfırlama bağlantısı');
      setCheckingToken(false);
    }
  }, [searchParams]);

  const verifyToken = async (resetToken: string) => {
    try {
      const response = await fetch('/api/admin/verify-reset-token.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: resetToken })
      });

      const data = await response.json();
      
      if (data.success) {
        setValidToken(true);
      } else {
        setError(data.error || 'Geçersiz veya süresi dolmuş token');
      }
    } catch {
      setError('Token doğrulama hatası');
    } finally {
      setCheckingToken(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/reset-password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          token, 
          password,
          confirm_password: confirmPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setSuccess(true);
      } else {
        setError(data.error || 'Bir hata oluştu');
      }
    } catch {
      setError('Bağlantı hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Token doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-red-600">
              Geçersiz Bağlantı
            </h1>
          </div>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
            </p>
            <Link 
              href="/admin/forgot-password"
              className="inline-block text-blue-600 hover:text-blue-500 font-medium"
            >
              Yeni şifre sıfırlama bağlantısı talep et
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Şifre Değiştirildi
            </h1>
          </div>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Şifreniz başarıyla değiştirildi. Artık yeni şifrenizle giriş yapabilirsiniz.
            </p>
            <Link 
              href="/admin"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Yeni Şifre Belirle
            </h1>
            <p className="text-gray-600">
              Hesabınız için yeni bir şifre belirleyin
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="password">Yeni Şifre</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Şifre Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </button>

              <div className="text-center">
                <Link 
                  href="/admin"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Giriş sayfasına dön
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}