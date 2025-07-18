'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface User {
  id: number;
  name: string;
  email: string;
  title: string;
  department_id: number;
  user_image: string | null;
}

interface Department {
  id: number;
  name: string;
  parent_id: number | null;
  parent_name: string | null;
  users: User[];
  subdepartments: Department[];
}

export default function UserPhotos() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Image upload and crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    verifyAdminSession();
    loadUsersWithDepartments();
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
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin';
      }
    } catch {
      toast.error('Session doğrulama hatası');
      window.location.href = '/admin';
    }
  };

  const loadUsersWithDepartments = async () => {
    const token = localStorage.getItem('admin_token');
    
    try {
      const response = await fetch('/api/admin/user-photos.php', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDepartments(data.departments);
      } else {
        toast.error(data.message || 'Kullanıcılar yüklenemedi');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Create a square crop in the center
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        1, // 1:1 aspect ratio for square
        width,
        height,
      ),
      width,
      height,
    );

    setCrop(crop);
  };

  const applyCropAndUpload = async () => {
    if (!completedCrop || !uploadedImage || !selectedUser || !imgRef.current) {
      toast.error('Kırpma ayarları eksik');
      return;
    }

    try {
      // Create canvas to crop image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imgRef.current;
      
      // Set canvas size to 600x600
      canvas.width = 600;
      canvas.height = 600;

      // Calculate crop area - ReactCrop provides pixel coordinates relative to displayed image
      // We need to scale these to natural image size
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      
      const pixelCrop = {
        x: completedCrop.x,
        y: completedCrop.y,
        width: completedCrop.width,
        height: completedCrop.height
      };

      // Scale to natural image dimensions
      const sourceX = pixelCrop.x * scaleX;
      const sourceY = pixelCrop.y * scaleY;
      const sourceWidth = pixelCrop.width * scaleX;
      const sourceHeight = pixelCrop.height * scaleY;

      // Draw cropped image to canvas at 600x600
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        600,
        600
      );

      // Convert to base64
      const croppedImageBase64 = canvas.toDataURL('image/jpeg', 0.9);

      // Upload to server
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/update-user-photo.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          image_data: croppedImageBase64
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Fotoğraf başarıyla güncellendi');
        setShowCropModal(false);
        setUploadedImage(null);
        setSelectedUser(null);
        loadUsersWithDepartments(); // Reload to show updated photo
      } else {
        toast.error(data.message || 'Fotoğraf güncellenemedi');
      }
    } catch {
      toast.error('Bağlantı hatası');
    }
  };

  const downloadUserPhoto = (user: User) => {
    if (!user.user_image) {
      toast.error('Bu kullanıcının fotoğrafı yok');
      return;
    }

    const link = document.createElement('a');
    link.href = user.user_image;
    link.download = `${user.name.replace(/\s+/g, '_')}_photo.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDepartments = departments.map(dept => ({
    ...dept,
    users: dept.users.filter(user => 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.title && user.title.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    subdepartments: dept.subdepartments.map(subdept => ({
      ...subdept,
      users: subdept.users.filter(user => 
        searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.title && user.title.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })).filter(subdept => subdept.users.length > 0)
  })).filter(dept => dept.users.length > 0 || dept.subdepartments.length > 0);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kullanıcı Fotoğrafları</h1>
          <p className="text-muted-foreground mt-2">
            Departmanlara göre kullanıcı fotoğraflarını yönetin
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Kullanıcı adı, e-posta veya unvan ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Departments */}
      {filteredDepartments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Arama kriterinize uygun kullanıcı bulunamadı.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredDepartments.map((department) => {
            const totalUsers = department.users.length + 
              department.subdepartments.reduce((sum, sub) => sum + sub.users.length, 0);
            
            return (
              <Card key={department.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    🏢 {department.name}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({totalUsers} kullanıcı)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Parent Department Users */}
                  {department.users.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {department.name} Üyeleri
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {department.users.map((user) => (
                          <div key={user.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                            {/* User Photo */}
                            <div className="w-24 h-24 mx-auto mb-4 relative">
                              {user.user_image ? (
                                <img
                                  src={user.user_image}
                                  alt={user.name}
                                  className="w-full h-full rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:border-purple-400 transition-colors"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.click();
                                    }
                                  }}
                                />
                              ) : (
                                <div 
                                  className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-purple-100 transition-colors border-2 border-dashed border-gray-300 hover:border-purple-400"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.click();
                                    }
                                  }}
                                >
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <div className="text-center">
                              <h3 className="font-semibold text-gray-900 mb-1">{user.name}</h3>
                              {user.title && (
                                <p className="text-sm text-gray-600 mb-2">{user.title}</p>
                              )}
                              <p className="text-xs text-gray-500 mb-3">{user.email}</p>

                              {/* Actions */}
                              <div className="flex justify-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.click();
                                    }
                                  }}
                                >
                                  📷 {user.user_image ? 'Değiştir' : 'Ekle'}
                                </Button>
                                {user.user_image && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadUserPhoto(user)}
                                  >
                                    ⬇️ İndir
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subdepartments */}
                  {department.subdepartments.map((subdept) => (
                    subdept.users.length > 0 && (
                      <div key={subdept.id}>
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {subdept.name} ({subdept.users.length} üye)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {subdept.users.map((user) => (
                            <div key={user.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                              {/* User Photo */}
                              <div className="w-24 h-24 mx-auto mb-4 relative">
                                {user.user_image ? (
                                  <img
                                    src={user.user_image}
                                    alt={user.name}
                                    className="w-full h-full rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:border-purple-400 transition-colors"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      if (fileInputRef.current) {
                                        fileInputRef.current.click();
                                      }
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-purple-100 transition-colors border-2 border-dashed border-gray-300 hover:border-purple-400"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      if (fileInputRef.current) {
                                        fileInputRef.current.click();
                                      }
                                    }}
                                  >
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* User Info */}
                              <div className="text-center">
                                <h3 className="font-semibold text-gray-900 mb-1">{user.name}</h3>
                                {user.title && (
                                  <p className="text-sm text-gray-600 mb-2">{user.title}</p>
                                )}
                                <p className="text-xs text-gray-500 mb-3">{user.email}</p>

                                {/* Actions */}
                                <div className="flex justify-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      if (fileInputRef.current) {
                                        fileInputRef.current.click();
                                      }
                                    }}
                                  >
                                    📷 {user.user_image ? 'Değiştir' : 'Ekle'}
                                  </Button>
                                  {user.user_image && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => downloadUserPhoto(user)}
                                    >
                                      ⬇️ İndir
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Crop Modal */}
      {showCropModal && uploadedImage && (
        <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Fotoğrafı Kırp (600x600px)</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="max-h-96 overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={false}
                >
                  <img
                    ref={imgRef}
                    src={uploadedImage}
                    alt="Crop"
                    onLoad={onImageLoad}
                    className="max-w-full max-h-[400px]"
                  />
                </ReactCrop>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowCropModal(false)}>
                  İptal
                </Button>
                <Button onClick={applyCropAndUpload} disabled={!completedCrop}>
                  Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}