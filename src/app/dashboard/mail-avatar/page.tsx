'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  name: string | null;
}

export default function MailAvatarPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarData, setAvatarData] = useState({
    initials: '',
    backgroundColor: '#b80728',
    textColor: '#ffffff',
    fontSize: 280,
    fontWeight: 'bold'
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const [fontBase64, setFontBase64] = useState('');

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
          // Kullanıcı adından initials oluştur
          if (data.user.name) {
            const names = data.user.name.split(' ');
            const initials = names.map((n: string) => n.charAt(0).toUpperCase()).join('').substring(0, 3);
            setAvatarData(prev => ({ ...prev, initials }));
          } else {
            // Email'den initials oluştur
            const emailName = data.user.email.split('@')[0];
            const initials = emailName.substring(0, 2).toUpperCase();
            setAvatarData(prev => ({ ...prev, initials }));
          }
        } else {
          window.location.href = '/dashboard';
        }
      } catch {
        window.location.href = '../';
      } finally {
        setLoading(false);
      }
    };

    // Font dosyasını base64'e çevir
    const loadFont = async () => {
      try {
        // Font dosyasını fetch et (public klasöründen)
        const response = await fetch('/assets/Copperplate-Bold-03.ttf');
        const arrayBuffer = await response.arrayBuffer();
        
        // Büyük dosyalar için güvenli base64 dönüşümü
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 0x8000; // 32KB chunks
        
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.slice(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        
        const base64 = btoa(binary);
        setFontBase64(base64);
      } catch (error) {
        console.warn('Font yüklenemedi, varsayılan font kullanılacak', error);
      }
    };

    verifySession();
    loadFont();
  }, []);

  const generateSVG = () => {
    const { initials, backgroundColor } = avatarData;
    
    const fontFamily = fontBase64 ? 'CopperplateBold, Arial, sans-serif' : 'Arial, sans-serif';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        ${fontBase64 ? `
        <style>
          @font-face {
            font-family: 'CopperplateBold';
            src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
            font-weight: bold;
            font-style: normal;
          }
        </style>
        ` : ''}
        <clipPath id="clip-path">
          <circle cx="300" cy="300" r="300" fill="${backgroundColor}"/>
        </clipPath>
      </defs>
      
      <!-- Multiple Border Rings (Outer to Inner) -->
      <!-- Outer Ring -->
      <path d="M561.423,279.043c0,156.431-126.619,283.243-282.811,283.243S-4.2,435.474-4.2,279.043,122.419-4.2,278.611-4.2,561.423,122.612,561.423,279.043Zm-11.144,0c0-150.266-121.629-272.081-271.667-272.081S6.944,128.776,6.944,279.043,128.574,551.124,278.611,551.124,550.278,429.309,550.278,279.043Z" transform="translate(21.03 20.957)" fill="#fff"/>
      
      <!-- Middle Ring -->
      <path d="M562.756,281.707c0,155.693-126.022,281.907-281.478,281.907S-.2,437.4-.2,281.707,125.822-.2,281.278-.2,562.756,126.014,562.756,281.707Zm-8.477,0c0-151-122.227-273.417-273-273.417s-273,122.413-273,273.417,122.227,273.417,273,273.417S554.278,432.711,554.278,281.707Z" transform="translate(18.252 18.293)" fill="#fff"/>
      
      <!-- Inner Ring -->
      <path d="M540.634,270.732c0,149.521-121.025,270.732-270.317,270.732S0,420.253,0,270.732,121.025,0,270.317,0,540.634,121.211,540.634,270.732Zm-2.922,0c0-147.9-119.717-267.8-267.395-267.8S2.922,122.827,2.922,270.732s119.717,267.8,267.395,267.8S537.712,418.636,537.712,270.732Z" transform="translate(30.215 29.269)" fill="#fff"/>
      
      <!-- Main Circle -->
      <ellipse cx="300" cy="300" rx="299.541" ry="300" fill="${backgroundColor}"/>
      
      <!-- Outermost Border -->
      <path d="M558.757,273.714c0,157.906-127.813,285.914-285.478,285.914S-12.2,431.62-12.2,273.714,115.613-12.2,273.279-12.2,558.757,115.808,558.757,273.714Zm-16.478,0c0-148.791-120.435-269.41-269-269.41s-269,120.619-269,269.41,120.435,269.41,269,269.41S542.278,422.505,542.278,273.714Z" transform="translate(26.19 26.286)" fill="#fff"/>
      
      <!-- Forte Logo (F harfi) with Clipping -->
      <g clip-path="url(#clip-path)">
        <path d="M89.516,50.09c0,17.014,11.871,28.449,29.549,28.449,17.613,0,29.916-12.758,29.916-31.019C148.981,19.542,127.476,0,96.686,0c-41.06,0-67,29.863-67.7,77.972V96.485H0v9.2H28.984V276.25H0v9.2H126.285v-9.2h-33.8V105.687h38.89v-9.2H97.418c-33.219,0-50.064-13.757-50.064-40.89C47.354,28.712,68.1,9.2,96.686,9.2c15.935,0,28.856,6.218,36.259,16.435a26.053,26.053,0,0,0-14.615-4.36c-16.966,0-28.814,11.851-28.814,28.815" transform="translate(225.613 377.169)" fill="#fff"/>
      </g>
      
      <!-- Custom Initials Text -->
      <text x="300" y="255" 
            text-anchor="middle" 
            dominant-baseline="central"
            font-family="${fontFamily}"
            font-size="193" 
            font-weight="bold" 
            fill="#fff">
        <tspan x="300" y="255">${initials}</tspan>
      </text>
    </svg>`;
  };

  useEffect(() => {
    const updatePreview = () => {
      if (svgRef.current) {
        svgRef.current.innerHTML = generateSVG().replace(/<svg[^>]*>/, '').replace('</svg>', '');
      }
    };

    if (!loading) {
      updatePreview();
    }
  }, [avatarData, fontBase64, loading]);

  const downloadSVG = () => {
    const svgContent = generateSVG();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${avatarData.initials}_avatar.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Avatar başarıyla indirildi!');
  };

  const handleInputChange = (field: string, value: string | number) => {
    setAvatarData(prev => ({ ...prev, [field]: value }));
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
              Mail Avatar Generator
            </h1>
            <p className="text-muted-foreground mt-2">
              Outlook için mail avatarınızı özelleştirin
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Kullanıcı hesabı</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Settings Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Avatar Ayarları</CardTitle>
              <CardDescription>
                Outlook için mail avatarınızı özelleştirin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Initials */}
              <div className="space-y-2">
                <Label htmlFor="initials">İnisiyaller (1-3 karakter)</Label>
                <Input
                  id="initials"
                  value={avatarData.initials}
                  onChange={(e) => handleInputChange('initials', e.target.value.toUpperCase().substring(0, 3))}
                  placeholder="AB"
                  maxLength={3}
                />
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Arkaplan Rengi</Label>
                <div className="flex space-x-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={avatarData.backgroundColor}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    className="w-20"
                  />
                  <Input
                    value={avatarData.backgroundColor}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    placeholder="#b80728"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <Label htmlFor="textColor">Metin Rengi</Label>
                <div className="flex space-x-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={avatarData.textColor}
                    onChange={(e) => handleInputChange('textColor', e.target.value)}
                    className="w-20"
                  />
                  <Input
                    value={avatarData.textColor}
                    onChange={(e) => handleInputChange('textColor', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Boyutu: {avatarData.fontSize}px</Label>
                <Input
                  id="fontSize"
                  type="range"
                  min="150"
                  max="350"
                  value={avatarData.fontSize}
                  onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Preset Colors */}
              <div className="space-y-2">
                <Label>Hazır Renkler</Label>
                <div className="flex space-x-2">
                  {[
                    { color: '#b80728', class: 'bg-red-700' }, // Forte Red
                    { color: '#1f2937', class: 'bg-gray-800' }, // Dark Gray
                    { color: '#059669', class: 'bg-green-600' }, // Green
                    { color: '#dc2626', class: 'bg-red-600' }, // Red
                    { color: '#2563eb', class: 'bg-blue-600' }, // Blue
                    { color: '#7c3aed', class: 'bg-purple-600' }, // Purple
                  ].map(({ color, class: bgClass }) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors ${bgClass}`}
                      onClick={() => handleInputChange('backgroundColor', color)}
                    />
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Önizleme</CardTitle>
              <CardDescription>
                Avatar&apos;ınız Outlook&apos;ta bu şekilde görünecek
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              
              {/* SVG Preview */}
              <div className="bg-gray-100 p-8 rounded-lg mb-4">
                <svg
                  ref={svgRef}
                  width="300"
                  height="300"
                  viewBox="0 0 600 600"
                  className="mx-auto"
                />
              </div>

              {/* Download Button */}
              <Button 
                onClick={downloadSVG}
                size="lg"
                className="w-full"
              >
                📥 SVG Olarak İndir
              </Button>

              {/* Info */}
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p>• Font dahil edilmiş SVG formatında</p>
                <p>• Outlook&apos;ta font sorunu yaşanmaz</p>
                <p>• 600x600 piksel boyutunda</p>
                <p>• Email imzalarında kullanıma hazır</p>
              </div>

            </CardContent>
          </Card>

      </div>
    </div>
  );
}