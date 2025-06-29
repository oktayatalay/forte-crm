'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  name: string | null;
  title: string | null;
  mobile_phone_1: string | null;
  mobile_phone_2: string | null;
  offices: string[] | null;
  department_id: number | null;
  department_name: string | null;
  gender: string | null;
  birth_date: string | null;
  city: string | null;
  address: string | null;
  created_at: string | null;
}

interface WelcomeMailingData {
  userId: number;
  userImage: string | null;
  biographyTurkish: string;
  biographyEnglish: string;
  cropSettings: {
    x: number;
    y: number;
    scale: number;
  };
}

export default function WelcomeMailings() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mailing data state
  const [mailingData, setMailingData] = useState<WelcomeMailingData>({
    userId: 0,
    userImage: null,
    biographyTurkish: '',
    biographyEnglish: '',
    cropSettings: { x: 0, y: 0, scale: 1 }
  });

  // Image upload and crop states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropScale, setCropScale] = useState(1);

  // Canvas refs
  const mailingCanvasRef = useRef<HTMLCanvasElement>(null);
  const storyCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    verifyAdminSession();
    loadUsers();
  }, []);

  const verifyAdminSession = async () => {
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
      window.location.href = '/admin';
      return;
    }

    try {
      const response = await fetch('/api/admin/verify-session.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        window.location.href = '/admin';
      }
    } catch {
      window.location.href = '/admin';
    }
  };

  const loadUsers = async () => {
    const token = localStorage.getItem('admin_token');
    
    try {
      const response = await fetch('/api/admin/users.php', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
      } else {
        toast.error('Kullanıcılar yüklenemedi');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setMailingData(prev => ({
      ...prev,
      userId: user.id
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCropSettings = () => {
    setMailingData(prev => ({
      ...prev,
      userImage: uploadedImage,
      cropSettings: {
        x: cropPosition.x,
        y: cropPosition.y,
        scale: cropScale
      }
    }));
    setShowCropModal(false);
    toast.success('Görsel ayarları kaydedildi');
  };

  const generateMailingCanvas = () => {
    const canvas = mailingCanvasRef.current;
    if (!canvas || !selectedUser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    
    // Calculate height based on content
    const baseHeight = 500; // Base height for header and user info
    const biographyHeight = calculateBiographyHeight(mailingData.biographyTurkish, mailingData.biographyEnglish);
    canvas.height = baseHeight + biographyHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4F46E5');
    gradient.addColorStop(1, '#7C3AED');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Try to load and draw header image, fallback to manual drawing
    const headerImg = new Image();
    headerImg.onload = () => {
      ctx.drawImage(headerImg, 0, 0, canvas.width, 200);
      drawMailingContent(ctx);
    };
    headerImg.onerror = () => {
      // Fallback: draw header manually
      drawHeaderFallback(ctx);
      drawMailingContent(ctx);
    };
    headerImg.src = '/assets/Welcome_Mail_Header.png';
    
    // Also draw content immediately in case image doesn't load
    setTimeout(() => drawMailingContent(ctx), 100);
  };

  const drawHeaderFallback = (ctx: CanvasRenderingContext2D) => {
    // Draw header background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 200);
    
    // Draw "WELCOME" text
    ctx.fillStyle = '#4F46E5';
    ctx.font = 'bold 48px SF Pro Display';
    ctx.textAlign = 'center';
    ctx.fillText('WELCOME', 400, 100);
  };

  const drawMailingContent = (ctx: CanvasRenderingContext2D) => {
    if (!selectedUser) return;
    
    // Draw white circle background for user image
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(400, 250, 111, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw user image circle
    if (mailingData.userImage) {
      drawUserImageCircle(ctx, 400, 250, 111); // 222px diameter = 111px radius
    }
    
    // Draw user name box
    drawUserNameBox(ctx, selectedUser.name || 'Unnamed User', 400, 380);
    
    // Draw title
    drawTitle(ctx, selectedUser.title || '', 400, 430);
    
    // Draw biographies
    drawBiographies(ctx, mailingData.biographyTurkish, mailingData.biographyEnglish, 480);
  };

  const generateStoryCanvas = () => {
    const canvas = storyCanvasRef.current;
    if (!canvas || !selectedUser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for story (1080x1920)
    canvas.width = 1080;
    canvas.height = 1920;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load and draw story background
    const bgImg = new Image();
    bgImg.onload = () => {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      drawStoryContent(ctx);
    };
    bgImg.onerror = () => {
      // Fallback: draw background manually
      drawStoryBackgroundFallback(ctx);
      drawStoryContent(ctx);
    };
    bgImg.src = '/assets/Story_BG.png';
    
    // Also draw content immediately in case image doesn't load
    setTimeout(() => drawStoryContent(ctx), 100);
  };

  const drawStoryBackgroundFallback = (ctx: CanvasRenderingContext2D) => {
    // Draw red gradient background as fallback
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#DC2626');
    gradient.addColorStop(1, '#991B1B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);
  };

  const drawStoryContent = (ctx: CanvasRenderingContext2D) => {
    if (!selectedUser) return;
    
    // Draw white circle background for user image (384px diameter = 192px radius)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(540, 500, 192, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw user image circle
    if (mailingData.userImage) {
      drawUserImageCircle(ctx, 540, 500, 192);
    }
    
    // Draw white rounded background for user name
    const nameText = selectedUser.name || 'Unnamed User';
    ctx.font = 'bold 48px SF Pro Display';
    const textWidth = ctx.measureText(nameText).width;
    const boxWidth = textWidth + 80; // 40px padding on each side
    const boxHeight = 70;
    const boxX = 540 - boxWidth / 2;
    const boxY = 750 - boxHeight / 2;
    
    // Draw white rounded rectangle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 35);
    ctx.fill();
    
    // Draw user name with correct color #C6162A
    ctx.fillStyle = '#C6162A';
    ctx.font = 'bold 48px SF Pro Display';
    ctx.textAlign = 'center';
    ctx.fillText(nameText, 540, 750 + 15); // +15 for vertical centering
    
    // Draw title below the name box
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '36px SF Pro Display';
    ctx.fillText(selectedUser.title || '', 540, 850);
  };

  const drawUserImageCircle = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    if (!mailingData.userImage) return;

    const img = new Image();
    img.onload = () => {
      ctx.save();
      
      // Create circular clip
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.clip();
      
      // Apply crop settings and draw image
      const { x, y, scale } = mailingData.cropSettings;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      ctx.drawImage(
        img,
        centerX - radius + x,
        centerY - radius + y,
        scaledWidth,
        scaledHeight
      );
      
      ctx.restore();
    };
    img.src = mailingData.userImage;
  };

  const drawUserNameBox = (ctx: CanvasRenderingContext2D, name: string, centerX: number, y: number) => {
    // Draw white rounded rectangle background
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(centerX - 150, y - 25, 300, 50, 25);
    ctx.fill();
    
    // Draw name text
    ctx.fillStyle = 'hsla(353, 89%, 78%, 1)';
    ctx.font = 'bold 24px SF Pro Display';
    ctx.textAlign = 'center';
    ctx.fillText(name, centerX, y + 5);
  };

  const drawTitle = (ctx: CanvasRenderingContext2D, title: string, centerX: number, y: number) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '26px SF Pro Display';
    ctx.textAlign = 'center';
    ctx.fillText(title, centerX, y);
  };

  const drawBiographies = (ctx: CanvasRenderingContext2D, turkishBio: string, englishBio: string, startY: number) => {
    let currentY = startY;
    
    // Draw Turkish biography
    if (turkishBio) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'italic 26px New York Extra Large';
      ctx.textAlign = 'center';
      const turkishLines = wrapText(ctx, turkishBio, 740);
      turkishLines.forEach(line => {
        ctx.fillText(line, 400, currentY);
        currentY += 35;
      });
      currentY += 20; // Space between paragraphs
    }
    
    // Draw English biography
    if (englishBio) {
      ctx.fillStyle = '#CBCBCB';
      ctx.font = 'italic 26px New York Extra Large';
      ctx.textAlign = 'center';
      const englishLines = wrapText(ctx, englishBio, 740);
      englishLines.forEach(line => {
        ctx.fillText(line, 400, currentY);
        currentY += 35;
      });
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const calculateBiographyHeight = (turkishBio: string, englishBio: string): number => {
    // Rough calculation - in real implementation, you'd measure text properly
    const avgCharsPerLine = 80;
    const lineHeight = 35;
    const turkishLines = Math.ceil(turkishBio.length / avgCharsPerLine);
    const englishLines = Math.ceil(englishBio.length / avgCharsPerLine);
    return (turkishLines + englishLines) * lineHeight + 100; // Extra padding
  };

  const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const filteredUsers = users.filter(user => 
    searchTerm === '' || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Generate canvases when data changes
  useEffect(() => {
    if (selectedUser && mailingData.biographyTurkish && mailingData.biographyEnglish) {
      generateMailingCanvas();
      generateStoryCanvas();
    }
  }, [selectedUser, mailingData]);

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
                <h1 className="text-2xl font-semibold text-gray-900">Welcome Mailings</h1>
                <p className="text-sm text-gray-500 mt-1">Hoş geldin e-postalarını oluştur ve yönet</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          
          {/* User Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>1. Kullanıcı Seçimi</CardTitle>
              <CardDescription>
                Welcome mailing hazırlanacak kullanıcıyı seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex-1 max-w-lg">
                  <Input
                    placeholder="Kullanıcı ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 bg-white border-gray-200"
                  />
                </div>
                
                {selectedUser && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">Seçili Kullanıcı</p>
                        <p className="text-green-600">{selectedUser.name} - {selectedUser.email}</p>
                        <p className="text-sm text-green-500">{selectedUser.title}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedUser(null)}
                      >
                        Değiştir
                      </Button>
                    </div>
                  </div>
                )}
                
                {!selectedUser && (
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredUsers.map((user) => (
                      <div 
                        key={user.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                            <span className="text-white font-medium text-sm">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">{user.title}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedUser && (
            <>
              {/* Image Upload and Crop */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>2. Profil Fotoğrafı</CardTitle>
                  <CardDescription>
                    Kullanıcının profil fotoğrafını yükleyin ve konumlandırın
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mb-4"
                      >
                        📷 Fotoğraf Yükle
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    
                    {mailingData.userImage && (
                      <div className="flex items-center space-x-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                          <img 
                            src={mailingData.userImage} 
                            alt="User" 
                            className="w-full h-full object-cover"
                            style={{
                              transform: `translate(${mailingData.cropSettings.x}px, ${mailingData.cropSettings.y}px) scale(${mailingData.cropSettings.scale})`
                            }}
                          />
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => setShowCropModal(true)}
                        >
                          ✂️ Kırp ve Konumlandır
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Biography Input */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>3. Biyografi</CardTitle>
                  <CardDescription>
                    Türkçe ve İngilizce biyografi metinlerini girin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="biographyTurkish">Türkçe Biyografi</Label>
                      <Textarea
                        id="biographyTurkish"
                        placeholder="Türkçe biyografi metnini buraya girin..."
                        value={mailingData.biographyTurkish}
                        onChange={(e) => setMailingData(prev => ({ ...prev, biographyTurkish: e.target.value }))}
                        rows={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biographyEnglish">İngilizce Biyografi</Label>
                      <Textarea
                        id="biographyEnglish"
                        placeholder="English biography text here..."
                        value={mailingData.biographyEnglish}
                        onChange={(e) => setMailingData(prev => ({ ...prev, biographyEnglish: e.target.value }))}
                        rows={6}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Canvas Preview and Download */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Mailing Canvas */}
                <Card>
                  <CardHeader>
                    <CardTitle>4. Mailing Görseli</CardTitle>
                    <CardDescription>
                      800px genişlik, otomatik yükseklik
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <canvas 
                        ref={mailingCanvasRef}
                        style={{ 
                          width: '100%', 
                          maxWidth: '400px', 
                          height: 'auto',
                          border: '1px solid #ddd',
                          borderRadius: '8px'
                        }}
                      />
                      <Button 
                        onClick={() => mailingCanvasRef.current && downloadCanvas(mailingCanvasRef.current, `welcome-mailing-${selectedUser.name?.replace(/\s+/g, '-') || 'user'}.png`)}
                        className="w-full"
                        disabled={!mailingData.biographyTurkish || !mailingData.biographyEnglish}
                      >
                        📥 Mailing PNG İndir
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Story Canvas */}
                <Card>
                  <CardHeader>
                    <CardTitle>5. Story Görseli</CardTitle>
                    <CardDescription>
                      1080x1920px (Instagram Story formatı)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <canvas 
                        ref={storyCanvasRef}
                        style={{ 
                          width: '100%', 
                          maxWidth: '200px', 
                          height: 'auto',
                          border: '1px solid #ddd',
                          borderRadius: '8px'
                        }}
                      />
                      <Button 
                        onClick={() => storyCanvasRef.current && downloadCanvas(storyCanvasRef.current, `welcome-story-${selectedUser.name?.replace(/\s+/g, '-') || 'user'}.png`)}
                        className="w-full"
                        disabled={!mailingData.biographyTurkish || !mailingData.biographyEnglish}
                      >
                        📥 Story PNG İndir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Crop Modal */}
      {showCropModal && uploadedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Fotoğrafı Konumlandır</h3>
            
            <div className="mb-4">
              <div className="w-64 h-64 mx-auto rounded-full overflow-hidden border-2 border-gray-300 relative">
                <img 
                  src={uploadedImage}
                  alt="Crop preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropScale})`
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Yatay Konum</Label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={cropPosition.x}
                  onChange={(e) => setCropPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label>Dikey Konum</Label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={cropPosition.y}
                  onChange={(e) => setCropPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label>Büyütme</Label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={cropScale}
                  onChange={(e) => setCropScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCropModal(false)}>
                İptal
              </Button>
              <Button onClick={applyCropSettings}>
                Uygula
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}