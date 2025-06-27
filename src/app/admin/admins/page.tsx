'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Admin {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'superadmin';
  is_active: number;
  created_at: string;
  last_login: string | null;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'admin' as 'admin' | 'superadmin',
    password: '',
    is_active: 1
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    try {
      const response = await fetch('/api/admin/verify-session.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        localStorage.removeItem('admin_token');
        router.push('/admin');
        return;
      }

      const data = await response.json();
      setCurrentAdmin(data.admin);

      // Sadece süperadmin bu sayfaya erişebilir
      if (data.admin.role !== 'superadmin') {
        router.push('/admin/dashboard');
        return;
      }

      fetchAdmins();
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('admin_token');
      router.push('/admin');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchAdmins = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/admins.php', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    
    try {
      const url = editingAdmin ? '/api/admin/admins.php' : '/api/admin/admins.php';
      const method = editingAdmin ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingAdmin ? { ...formData, id: editingAdmin.id } : formData)
      });

      const data = await response.json();
      
      if (data.success) {
        fetchAdmins();
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingAdmin(null);
        setFormData({
          email: '',
          full_name: '',
          role: 'admin',
          password: '',
          is_active: 1
        });
      } else {
        alert(data.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Bir hata oluştu');
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
      password: '',
      is_active: admin.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (adminId: number) => {
    if (!confirm('Bu admini silmek istediğinizden emin misiniz?')) {
      return;
    }

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/admins.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: adminId })
      });

      const data = await response.json();
      if (data.success) {
        fetchAdmins();
      } else {
        alert(data.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Bir hata oluştu');
    }
  };

  const toggleStatus = async (admin: Admin) => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/admins.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          role: admin.role,
          is_active: admin.is_active === 1 ? 0 : 1
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchAdmins();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Yönetimi</h1>
          <p className="text-gray-600">Sistem adminlerini yönetin</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Yeni Admin Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Admin Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="full_name">Ad Soyad</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'superadmin' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Süper Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">Ekle</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tüm Adminler ({filteredAdmins.length})
          </CardTitle>
          <div className="flex gap-4">
            <Input
              placeholder="Admin ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAdmins.map(admin => (
              <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-medium">{admin.full_name}</h3>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                    <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                      {admin.role === 'superadmin' ? 'Süper Admin' : 'Admin'}
                    </Badge>
                    <Badge variant={admin.is_active === 1 ? 'default' : 'destructive'}>
                      {admin.is_active === 1 ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Katılım: {new Date(admin.created_at).toLocaleDateString('tr-TR')}</p>
                    {admin.last_login && (
                      <p>Son Giriş: {new Date(admin.last_login).toLocaleDateString('tr-TR')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(admin)}
                    disabled={admin.id === currentAdmin?.id}
                  >
                    {admin.is_active === 1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(admin)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(admin.id)}
                    disabled={admin.id === currentAdmin?.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit_email">E-posta</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_full_name">Ad Soyad</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'superadmin' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Süper Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_password">Yeni Şifre (boş bırakırsanız değişmez)</Label>
              <Input
                id="edit_password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit">Güncelle</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}