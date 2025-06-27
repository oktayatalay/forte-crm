'use client';

import { useEffect, useState } from 'react';
// Card components removed - using native divs for modern design
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
                <h1 className="text-2xl font-semibold text-gray-900">Kullanıcılar</h1>
                <p className="text-sm text-gray-500 mt-1">Sistem kullanıcılarını yönetin ve düzenleyin</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="text-gray-600">
                📥 Download
              </Button>
              <Button onClick={() => setShowAddUser(true)} className="bg-blue-600 hover:bg-blue-700">
                ➕ Add new
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-8 py-6">
        
        {/* Search and Filter Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Input
                  placeholder="Quick search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 bg-white border-gray-200"
                />
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <span className="text-gray-400 text-sm">🔍</span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="ml-4">
              🔽 Filter
            </Button>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUser && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
              <p className="mt-1 text-sm text-gray-500">
                Fill in the information below to create a new user account
              </p>
            </div>
            <div className="p-6">
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

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Add User
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
              <p className="mt-1 text-sm text-gray-500">
                Update user information and settings
              </p>
            </div>
            <div className="p-6">
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

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Update User
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NAME <span className="ml-1">▲</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EMAIL <span className="ml-1">▲</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LOCATION <span className="ml-1">▲</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS <span className="ml-1">▲</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SPENT <span className="ml-1">▲</span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                          <span className="text-white font-medium text-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.title || 'No title'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {user.city || 'Unknown'}
                        {user.department_name && (
                          <div className="text-xs text-gray-500">{user.department_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.mobile_phone_1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.mobile_phone_1 ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ${Math.floor(Math.random() * 9000 + 1000)}.{Math.floor(Math.random() * 99)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          onClick={() => setEditingUser(user)}
                        >
                          ✏️
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(10, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled className="text-gray-400">
              ←
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-600 text-white border-blue-600">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              →
            </Button>
            <select className="ml-4 text-sm border border-gray-300 rounded px-2 py-1">
              <option>10 / page</option>
              <option>25 / page</option>
              <option>50 / page</option>
            </select>
          </div>
        </div>
      </main>
    </div>
  );
}