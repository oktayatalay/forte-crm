'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Department {
  id: number;
  name: string;
}


export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    title: '',
    mobile_phone_1: '',
    mobile_phone_2: '',
    offices: [] as string[],
    department_id: null as number | null,
    gender: '',
    birth_date: '',
    city: '',
    address: ''
  });

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
        setUsers(data.users);
        setDepartments(data.departments || []);
      } else {
        toast.error('Kullanıcılar yüklenemedi');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };


  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    
    try {
      const response = await fetch('/api/admin/users.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Kullanıcı başarıyla eklendi');
        setShowAddUser(false);
        setNewUser({
          email: '',
          name: '',
          title: '',
          mobile_phone_1: '',
          mobile_phone_2: '',
          offices: [],
          department_id: null,
          gender: '',
          birth_date: '',
          city: '',
          address: ''
        });
        loadUsers();
      } else {
        toast.error(data.error || 'Kullanıcı eklenemedi');
      }
    } catch {
      toast.error('Bağlantı hatası');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const token = localStorage.getItem('admin_token');
    
    try {
      const response = await fetch('/api/admin/users.php', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingUser),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Kullanıcı başarıyla güncellendi');
        setEditingUser(null);
        loadUsers();
      } else {
        toast.error(data.error || 'Kullanıcı güncellenemedi');
      }
    } catch {
      toast.error('Bağlantı hatası');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    const token = localStorage.getItem('admin_token');
    
    try {
      const response = await fetch('/api/admin/users.php', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Kullanıcı başarıyla silindi');
        loadUsers();
      } else {
        toast.error(data.error || 'Kullanıcı silinemedi');
      }
    } catch {
      toast.error('Bağlantı hatası');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.title && user.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.department_name && user.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                onClick={() => window.location.href = '/admin/dashboard'}
              >
                ← Geri
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Kullanıcı Yönetimi</h1>
            </div>
            <Button onClick={() => setShowAddUser(true)}>
              👤 Yeni Kullanıcı Ekle
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Search */}
        <div className="mb-6">
          <div className="max-w-md">
            <Label htmlFor="search">Kullanıcı Ara</Label>
            <Input
              id="search"
              placeholder="E-posta, isim, unvan veya departmana göre ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUser && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Yeni Kullanıcı Ekle</CardTitle>
              <CardDescription>
                Yeni bir kullanıcı eklemek için bilgileri doldurun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta Adresi *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Unvan</Label>
                    <Input
                      id="title"
                      value={newUser.title}
                      onChange={(e) => setNewUser(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone1">Telefon 1</Label>
                    <Input
                      id="phone1"
                      value={newUser.mobile_phone_1}
                      onChange={(e) => setNewUser(prev => ({ ...prev, mobile_phone_1: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone2">Telefon 2</Label>
                    <Input
                      id="phone2"
                      value={newUser.mobile_phone_2}
                      onChange={(e) => setNewUser(prev => ({ ...prev, mobile_phone_2: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Departman</Label>
                    <select
                      id="department"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={newUser.department_id || ''}
                      onChange={(e) => setNewUser(prev => ({ ...prev, department_id: e.target.value ? parseInt(e.target.value) : null }))}
                    >
                      <option value="">Departman Seçiniz</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit">Kullanıcı Ekle</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Kullanıcı Düzenle</CardTitle>
              <CardDescription>
                Kullanıcı bilgilerini güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">E-posta Adresi *</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editName">Ad Soyad</Label>
                    <Input
                      id="editName"
                      value={editingUser.name || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editTitle">Unvan</Label>
                    <Input
                      id="editTitle"
                      value={editingUser.title || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, title: e.target.value } : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editPhone1">Telefon 1</Label>
                    <Input
                      id="editPhone1"
                      value={editingUser.mobile_phone_1 || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, mobile_phone_1: e.target.value } : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editPhone2">Telefon 2</Label>
                    <Input
                      id="editPhone2"
                      value={editingUser.mobile_phone_2 || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, mobile_phone_2: e.target.value } : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editDepartment">Departman</Label>
                    <select
                      id="editDepartment"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={editingUser.department_id || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, department_id: e.target.value ? parseInt(e.target.value) : null } : null)}
                    >
                      <option value="">Departman Seçiniz</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit">Güncelle</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-xl text-gray-800">Kullanıcılar ({filteredUsers.length})</CardTitle>
            <CardDescription className="text-gray-600">
              Tüm kullanıcıları görüntüle ve yönet
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">E-posta</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">Ad Soyad</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">Cinsiyet</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">Departman</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">Unvan</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">Telefon</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">Ofis</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">Şehir</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">Doğum Tarihi</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`transition-colors duration-200 hover:bg-blue-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-medium text-sm">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-gray-900 font-medium">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">{user.name || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {user.gender === 'male' ? (
                            <span className="bg-blue-100 text-blue-800">👨 Erkek</span>
                          ) : user.gender === 'female' ? (
                            <span className="bg-pink-100 text-pink-800">👩 Kadın</span>
                          ) : user.gender === 'other' ? (
                            <span className="bg-purple-100 text-purple-800">⚧ Diğer</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600">-</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.department_name ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {user.department_name}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{user.title || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{user.mobile_phone_1 || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {user.offices && user.offices.length > 0 
                            ? user.offices.join(', ') 
                            : '-'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{user.city || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {user.birth_date ? new Date(user.birth_date).toLocaleDateString('tr-TR') : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                            onClick={() => setEditingUser(user)}
                          >
                            <span className="text-sm">✏️</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <span className="text-sm">🗑️</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}