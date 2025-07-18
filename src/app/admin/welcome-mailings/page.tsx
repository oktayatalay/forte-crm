'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import UserAvatar from '@/components/ui/user-avatar';
import UserPhotoUpload from '@/components/ui/user-photo-upload';

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
  user_image: string | null;
  created_at: string | null;
}

interface WelcomeMailingData {
  userId: number;
  userImage: string | null;
  biographyTurkish: string;
  biographyEnglish: string;
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
    biographyEnglish: ''
  });

  // Canvas refs
  const mailingCanvasRef = useRef<HTMLCanvasElement>(null);
  const storyCanvasRef = useRef<HTMLCanvasElement>(null);

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
      userId: user.id,
      userImage: user.user_image || null
    }));
  };


  const calculateFooterHeight = (user: User): number => {
    // Calculate actual footer height
    let height = 0;
    height += 50; // "Aramıza Hoş Geldin" line
    height += 40; // "Welcome" line + reduced spacing
    if (user.email) height += 50; // Email line
    if (user.mobile_phone_1) height += 30; // Phone line
    return height;
  };

  const generateMailingCanvas = async () => {
    const canvas = mailingCanvasRef.current;
    if (!canvas || !selectedUser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate exact needed height
    const baseHeight = 500; // Header height
    const userSectionHeight = 400; // User info section  
    const biographyHeight = calculateBiographyHeight(mailingData.biographyTurkish, mailingData.biographyEnglish);
    const footerHeight = calculateFooterHeight(selectedUser);
    const totalHeight = baseHeight + userSectionHeight + biographyHeight + 20 + footerHeight + 40; // +20 for spacing before footer, +40 final padding

    // Set canvas size
    canvas.width = 800;
    canvas.height = totalHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background with correct color #AF2331
    ctx.fillStyle = '#AF2331';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Try to load and draw header image (corrected filename)
    const headerImg = new Image();
    const headerLoaded = new Promise<void>((resolve) => {
      headerImg.onload = () => {
        // Draw header image at 800x500px
        ctx.drawImage(headerImg, 0, 0, 800, 500);
        resolve();
      };
      headerImg.onerror = () => {
        console.log('Header image failed to load, using fallback');
        drawHeaderFallback(ctx);
        resolve();
      };
      headerImg.src = '/assets/Welcome_Mail_Hedaer.png';
    });
    
    // Wait for header to load, then draw content once
    await headerLoaded;
    await drawMailingContent(ctx);
  };

  const drawHeaderFallback = (ctx: CanvasRenderingContext2D) => {
    // Draw red header background to match
    ctx.fillStyle = '#AF2331';
    ctx.fillRect(0, 0, 800, 500);
    
    // Draw "Welcome to forte" text as fallback
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Welcome to', 400, 200);
    ctx.font = 'bold 72px serif';
    ctx.fillText('forte', 400, 300);
    ctx.font = '24px serif';
    ctx.fillText('MEETINGS & EVENTS', 400, 350);
  };

  const drawMailingContent = async (ctx: CanvasRenderingContext2D) => {
    if (!selectedUser) return;
    
    // User image position: 374px from top
    const userImageY = 374;
    
    // Draw white circle background for user image
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(400, userImageY, 111, 0, 2 * Math.PI); // 222px diameter = 111px radius
    ctx.fill();
    
    // Draw user image circle with proper crop settings
    if (mailingData.userImage) {
      await drawUserImageCircle(ctx, 400, userImageY, 111);
    }
    
    // Draw user name box (below the header area)
    const userNameY = 570; // After 500px header + some spacing
    drawUserNameBox(ctx, selectedUser.name || 'Unnamed User', 400, userNameY);
    
    // Draw title
    const titleY = userNameY + 60;
    drawTitle(ctx, selectedUser.title || '', 400, titleY);
    
    // Draw biographies with alternating pattern (TR-EN-TR-EN)
    const biographyStartY = titleY + 80;
    const biographyEndY = drawAlternatingBiographies(ctx, mailingData.biographyTurkish, mailingData.biographyEnglish, biographyStartY);
    
    // Draw footer section right after biography with minimal spacing
    const footerY = biographyEndY + 20; // Just 20px padding as requested
    drawFooterSection(ctx, selectedUser, footerY);
  };

  const generateStoryCanvas = async () => {
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
    const bgLoaded = new Promise<void>((resolve) => {
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      bgImg.onerror = () => {
        // Fallback: draw background manually
        drawStoryBackgroundFallback(ctx);
        resolve();
      };
      bgImg.src = '/assets/Story_BG.png';
    });
    
    // Wait for background to load, then draw content once
    await bgLoaded;
    await drawStoryContent(ctx);
  };

  const drawStoryBackgroundFallback = (ctx: CanvasRenderingContext2D) => {
    // Draw red gradient background as fallback
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#DC2626');
    gradient.addColorStop(1, '#991B1B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);
  };

  const drawStoryContent = async (ctx: CanvasRenderingContext2D) => {
    if (!selectedUser) return;
    
    // User image position: 902px from top
    const userImageY = 902;
    
    // Draw white circle background for user image (384px diameter = 192px radius)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(540, userImageY, 192, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw user image circle with proper crop settings
    if (mailingData.userImage) {
      await drawUserImageCircle(ctx, 540, userImageY, 192);
    }
    
    // Draw white rounded background for user name
    const nameText = selectedUser.name || 'Unnamed User';
    ctx.font = 'bold 48px SF Pro Display';
    const textWidth = ctx.measureText(nameText).width;
    const boxWidth = textWidth + 80; // 40px padding on each side
    const boxHeight = 70;
    const nameY = userImageY + 250; // Below the user image
    const boxX = 540 - boxWidth / 2;
    const boxY = nameY - boxHeight / 2;
    
    // Draw white rounded rectangle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 35);
    ctx.fill();
    
    // Draw user name with correct color #C6162A
    ctx.fillStyle = '#C6162A';
    ctx.font = 'bold 48px SF Pro Display';
    ctx.textAlign = 'center';
    ctx.fillText(nameText, 540, nameY + 15); // +15 for vertical centering
    
    // Draw title below the name box
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '36px SF Pro Display';
    ctx.fillText(selectedUser.title || '', 540, nameY + 100);
  };

  const drawUserImageCircle = async (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    if (!mailingData.userImage) return;

    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        ctx.save();
        
        // Create circular clip
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.clip();
        
        // Draw image to fill the circle (square crop from center)
        const imgSize = Math.min(img.naturalWidth, img.naturalHeight);
        const sourceX = (img.naturalWidth - imgSize) / 2;
        const sourceY = (img.naturalHeight - imgSize) / 2;
        
        // Calculate destination size to fill circle
        const destSize = radius * 2;
        const destX = centerX - radius;
        const destY = centerY - radius;
        
        // Draw the image (center cropped to square)
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          imgSize,
          imgSize,
          destX,
          destY,
          destSize,
          destSize
        );
        
        ctx.restore();
        resolve();
      };
      
      img.onerror = () => resolve(); // Continue even if image fails
      if (mailingData.userImage) {
        img.src = mailingData.userImage;
      }
    });
  };

  const drawAlternatingBiographies = (ctx: CanvasRenderingContext2D, turkishBio: string, englishBio: string, startY: number): number => {
    let currentY = startY;
    const lineHeight = 35;
    const paragraphSpacing = 30;
    
    // Split biographies into paragraphs (by double line breaks)
    const turkishParagraphs = turkishBio.split('\n\n').filter(p => p.trim().length > 0);
    const englishParagraphs = englishBio.split('\n\n').filter(p => p.trim().length > 0);
    
    const maxParagraphs = Math.max(turkishParagraphs.length, englishParagraphs.length);
    
    for (let i = 0; i < maxParagraphs; i++) {
      // Draw Turkish paragraph if exists
      if (i < turkishParagraphs.length) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'italic 500 26px "New York Extra Large"';
        ctx.textAlign = 'center';
        const turkishText = turkishParagraphs[i].trim();
        const turkishLines = wrapText(ctx, turkishText, 740);
        turkishLines.forEach(line => {
          ctx.fillText(line, 400, currentY);
          currentY += lineHeight;
        });
        currentY += paragraphSpacing;
      }
      
      // Draw English paragraph if exists
      if (i < englishParagraphs.length) {
        ctx.fillStyle = '#CBCBCB';
        ctx.font = 'italic 400 26px "New York Extra Large"';
        ctx.textAlign = 'center';
        const englishText = englishParagraphs[i].trim();
        const englishLines = wrapText(ctx, englishText, 740);
        englishLines.forEach(line => {
          ctx.fillText(line, 400, currentY);
          currentY += lineHeight;
        });
        currentY += paragraphSpacing;
      }
    }
    
    return currentY; // Return the final Y position
  };

  const drawFooterSection = (ctx: CanvasRenderingContext2D, user: User, startY: number): number => {
    let currentY = startY;
    
    // Draw "Aramıza Hoş Geldin" section with correct fonts
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '500 26px "New York Extra Large"'; // Removed italic
    ctx.textAlign = 'center';
    ctx.fillText(`Aramıza Hoş Geldin ${user.name}!`, 400, currentY);
    currentY += 50;
    
    ctx.fillStyle = '#CBCBCB';
    ctx.font = '400 26px "New York Extra Large"'; // Removed italic
    ctx.fillText(`Welcome ${user.name}!`, 400, currentY);
    currentY += 40; // Reduced spacing
    
    // Draw email section with better centering
    if (user.email) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px sans-serif';
      
      // Calculate total width for centering
      const emailIconWidth = 30;
      const emailTextWidth = ctx.measureText(user.email).width;
      const totalWidth = emailIconWidth + emailTextWidth + 20; // 20px spacing
      const startX = 400 - totalWidth / 2;
      
      // Draw white line-style email icon
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      drawEmailIcon(ctx, startX, currentY);
      ctx.fillText(user.email, startX + emailIconWidth + 20, currentY);
      currentY += 50;
    }
    
    // Draw phone section with better centering
    if (user.mobile_phone_1) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px sans-serif';
      
      // Calculate total width for centering
      const phoneIconWidth = 30;
      const phoneTextWidth = ctx.measureText(user.mobile_phone_1).width;
      const totalWidth = phoneIconWidth + phoneTextWidth + 20; // 20px spacing
      const startX = 400 - totalWidth / 2;
      
      // Draw white line-style phone icon
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      drawPhoneIcon(ctx, startX, currentY);
      ctx.fillText(user.mobile_phone_1, startX + phoneIconWidth + 20, currentY);
      currentY += 30; // Add some spacing after phone
    }
    
    return currentY; // Return final Y position
  };

  const drawEmailIcon = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Draw envelope outline
    const width = 24;
    const height = 16;
    const centerY = y - height / 2;
    
    // Envelope rectangle
    ctx.rect(x, centerY, width, height);
    
    // Envelope flap
    ctx.moveTo(x, centerY);
    ctx.lineTo(x + width / 2, centerY + height * 0.6);
    ctx.lineTo(x + width, centerY);
    
    ctx.stroke();
  };

  const drawPhoneIcon = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Draw phone outline
    const width = 16;
    const height = 24;
    const centerY = y - height / 2;
    const radius = 3;
    
    // Phone body with rounded corners
    ctx.roundRect(x + 4, centerY, width, height, radius);
    
    // Speaker
    ctx.moveTo(x + 8, centerY + 3);
    ctx.lineTo(x + 12, centerY + 3);
    
    // Home button
    ctx.moveTo(x + 11, centerY + height - 4);
    ctx.arc(x + 12, centerY + height - 4, 1, 0, 2 * Math.PI);
    
    ctx.stroke();
  };

  const drawUserNameBox = (ctx: CanvasRenderingContext2D, name: string, centerX: number, y: number) => {
    // Set font and measure text to calculate dynamic width
    ctx.font = 'bold 24px SF Pro Display';
    const textWidth = ctx.measureText(name).width;
    
    // Calculate box dimensions with 40px horizontal padding (20px each side) and 10px vertical padding
    const boxWidth = textWidth + 80; // 40px padding on each side
    const boxHeight = 44; // Text height + 20px vertical padding (10px top + 10px bottom)
    const boxX = centerX - boxWidth / 2;
    const boxY = y - boxHeight / 2;
    
    // Draw white rounded rectangle background with 25px border radius
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 25);
    ctx.fill();
    
    // Draw name text
    ctx.fillStyle = '#C6162A';
    ctx.textAlign = 'center';
    ctx.fillText(name, centerX, y + 6); // Slight adjustment for vertical centering
  };

  const drawTitle = (ctx: CanvasRenderingContext2D, title: string, centerX: number, y: number) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '26px SF Pro Display';
    ctx.textAlign = 'center';
    ctx.fillText(title, centerX, y);
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
    // Improved calculation for alternating paragraphs
    const avgCharsPerLine = 80;
    const lineHeight = 35;
    const paragraphSpacing = 30;
    
    const turkishParagraphs = turkishBio.split('.').filter(p => p.trim().length > 0);
    const englishParagraphs = englishBio.split('.').filter(p => p.trim().length > 0);
    
    let totalHeight = 0;
    const maxParagraphs = Math.max(turkishParagraphs.length, englishParagraphs.length);
    
    for (let i = 0; i < maxParagraphs; i++) {
      if (i < turkishParagraphs.length) {
        const turkishLines = Math.ceil(turkishParagraphs[i].length / avgCharsPerLine);
        totalHeight += turkishLines * lineHeight + paragraphSpacing;
      }
      if (i < englishParagraphs.length) {
        const englishLines = Math.ceil(englishParagraphs[i].length / avgCharsPerLine);
        totalHeight += englishLines * lineHeight + paragraphSpacing;
      }
    }
    
    return totalHeight + 100; // Extra padding
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
      const generateCanvases = async () => {
        await generateMailingCanvas();
        await generateStoryCanvas();
      };
      generateCanvases();
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
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Welcome Mailings</h1>
              <p className="text-sm text-gray-500 mt-1">Hoş geldin e-postalarını oluştur ve yönet</p>
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
                          <UserAvatar user={user} size="md" className="mr-3" />
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
                    <div className="flex items-center space-x-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Mevcut Fotoğraf:</h4>
                        <UserAvatar user={selectedUser} size="xl" />
                        <p className="text-sm text-gray-500 mt-2">
                          {selectedUser.user_image ? 'Kullanıcının profil fotoğrafı' : 'Henüz fotoğraf yüklenmemiş'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Yeni Fotoğraf Yükle:</h4>
                        <UserPhotoUpload
                          currentImage={mailingData.userImage}
                          onImageUpdate={async (imageData) => {
                            // Update admin's photo for this user
                            try {
                              const token = localStorage.getItem('admin_token');
                              const response = await fetch('/api/admin/update-user-photo.php', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  user_id: selectedUser.id,
                                  image_data: imageData
                                }),
                              });

                              if (response.ok) {
                                // Update local state
                                setMailingData(prev => ({ ...prev, userImage: imageData }));
                                setSelectedUser(prev => prev ? { ...prev, user_image: imageData } : null);
                                toast.success('Fotoğraf güncellendi ve mailingde kullanılacak');
                              } else {
                                const data = await response.json();
                                toast.error(data.message || 'Fotoğraf güncellenemedi');
                              }
                            } catch {
                              toast.error('Bağlantı hatası');
                            }
                          }}
                          userId={selectedUser.id}
                          isAdmin={true}
                          size="lg"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Bu fotoğraf hem kullanıcının profili hem de mailing için kullanılacak
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <Button 
                        onClick={() => {
                          // Use current user photo for mailing
                          setMailingData(prev => ({ ...prev, userImage: selectedUser.user_image }));
                          toast.success('Mevcut profil fotoğrafı mailing için seçildi');
                        }}
                        variant="outline"
                        disabled={!selectedUser.user_image}
                      >
                        📷 Mevcut Profil Fotoğrafını Kullan
                      </Button>
                    </div>
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
                        className="w-full max-w-sm h-auto border border-gray-300 rounded-lg"
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
                        className="w-full max-w-[200px] h-auto border border-gray-300 rounded-lg"
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
    </div>
  );
}