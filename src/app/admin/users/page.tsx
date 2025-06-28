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
  const [sortField, setSortField] = useState<keyof User | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const downloadCSV = () => {
    const headers = ['Adı Soyadı', 'E-posta', 'Şirket Telefonu', 'Şahsi Telefonu', 'Ofis', 'Departman', 'Title', 'Yaşadığı Şehir', 'Cinsiyet', 'Doğum Tarihi'];
    const csvData = sortedUsers.map(user => [
      user.name || '',
      user.email,
      user.mobile_phone_1 || '',
      user.mobile_phone_2 || '',
      user.offices ? user.offices.join('; ') : '',
      user.department_name || '',
      user.title || '',
      user.city || '',
      user.gender === 'male' ? 'Erkek' : user.gender === 'female' ? 'Kadın' : user.gender === 'other' ? 'Diğer' : '',
      user.birth_date ? new Date(user.birth_date).toLocaleDateString('tr-TR') : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kullanicilar_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.title && user.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.department_name && user.department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.city && user.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.mobile_phone_1 && user.mobile_phone_1.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.mobile_phone_2 && user.mobile_phone_2.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: string | number;
    let bValue: string | number;
    
    // Special handling for offices array
    if (sortField === 'offices') {
      aValue = Array.isArray(a.offices) ? a.offices.join(', ') : (a.offices || '');
      bValue = Array.isArray(b.offices) ? b.offices.join(', ') : (b.offices || '');
    }
    // Special handling for birth_date
    else if (sortField === 'birth_date') {
      aValue = a.birth_date ? new Date(a.birth_date).getTime() : 0;
      bValue = b.birth_date ? new Date(b.birth_date).getTime() : 0;
    }
    // Default handling for other fields
    else {
      aValue = (a[sortField] as string) || '';
      bValue = (b[sortField] as string) || '';
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

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
              <Button 
                variant="outline" 
                size="sm" 
                className="text-gray-600"
                onClick={downloadCSV}
              >
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

                  <div className="space-y-2">
                    <Label htmlFor="gender">Cinsiyet</Label>
                    <select
                      id="gender"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={newUser.gender}
                      onChange={(e) => setNewUser(prev => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="">Cinsiyet Seçiniz</option>
                      <option value="male">Erkek</option>
                      <option value="female">Kadın</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Doğum Tarihi</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={newUser.birth_date}
                      onChange={(e) => setNewUser(prev => ({ ...prev, birth_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Yaşadığı Şehir</Label>
                    <Input
                      id="city"
                      value={newUser.city}
                      onChange={(e) => setNewUser(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adres</Label>
                    <Input
                      id="address"
                      value={newUser.address}
                      onChange={(e) => setNewUser(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offices">Ofisler</Label>
                    <Input
                      id="offices"
                      placeholder="Ofisleri virgülle ayırın"
                      value={Array.isArray(newUser.offices) ? newUser.offices.join(', ') : ''}
                      onChange={(e) => {
                        const officesArray = e.target.value.split(',').map(office => office.trim()).filter(office => office.length > 0);
                        setNewUser(prev => ({ ...prev, offices: officesArray }));
                      }}
                    />
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

                  <div className="space-y-2">
                    <Label htmlFor="editGender">Cinsiyet</Label>
                    <select
                      id="editGender"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={editingUser.gender || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, gender: e.target.value } : null)}
                    >
                      <option value="">Cinsiyet Seçiniz</option>
                      <option value="male">Erkek</option>
                      <option value="female">Kadın</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editBirthDate">Doğum Tarihi</Label>
                    <Input
                      id="editBirthDate"
                      type="date"
                      value={editingUser.birth_date || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, birth_date: e.target.value } : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editCity">Yaşadığı Şehir</Label>
                    <Input
                      id="editCity"
                      value={editingUser.city || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, city: e.target.value } : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editAddress">Adres</Label>
                    <Input
                      id="editAddress"
                      value={editingUser.address || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, address: e.target.value } : null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editOffices">Ofisler</Label>
                    <Input
                      id="editOffices"
                      placeholder="Ofisleri virgülle ayırın"
                      value={Array.isArray(editingUser.offices) ? editingUser.offices.join(', ') : ''}
                      onChange={(e) => {
                        const officesArray = e.target.value.split(',').map(office => office.trim()).filter(office => office.length > 0);
                        setEditingUser(prev => prev ? { ...prev, offices: officesArray } : null);
                      }}
                    />
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
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('name')}
                  >
                    ADI SOYADI <span className="ml-1">{sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}</span>
                  </th>
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('email')}
                  >
                    E-POSTA <span className="ml-1">{sortField === 'email' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}</span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TELEFON NUMARALARI
                  </th>
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('offices')}
                  >
                    OFİS <span className="ml-1">{sortField === 'offices' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}</span>
                  </th>
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('department_name')}
                  >
                    DEPARTMAN <span className="ml-1">{sortField === 'department_name' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}</span>
                  </th>
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('title')}
                  >
                    TITLE <span className="ml-1">{sortField === 'title' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}</span>
                  </th>
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('city')}
                  >
                    YAŞADIĞI ŞEHİR <span className="ml-1">{sortField === 'city' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}</span>
                  </th>
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('gender')}
                  >
                    CİNSİYET <span className="ml-1">{sortField === 'gender' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}</span>
                  </th>
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('birth_date')}
                  >
                    DOĞUM TARİHİ <span className="ml-1">{sortField === 'birth_date' ? (sortDirection === 'asc' ? '▲' : '▼') : '▲'}</span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
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
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'Unnamed User'}
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
                        {user.mobile_phone_1 && (
                          <div className="mb-1">
                            <span className="text-xs text-gray-500">Şirket:</span> {user.mobile_phone_1}
                          </div>
                        )}
                        {user.mobile_phone_2 && (
                          <div>
                            <span className="text-xs text-gray-500">Şahsi:</span> {user.mobile_phone_2}
                          </div>
                        )}
                        {!user.mobile_phone_1 && !user.mobile_phone_2 && '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {user.offices && user.offices.length > 0 
                          ? user.offices.join(', ') 
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {user.department_name ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.department_name}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {user.title || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {user.city || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.gender === 'male' ? 'bg-blue-100 text-blue-800' : 
                        user.gender === 'female' ? 'bg-pink-100 text-pink-800' : 
                        user.gender === 'other' ? 'bg-purple-100 text-purple-800' : 
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.gender === 'male' ? '👨 Erkek' : 
                         user.gender === 'female' ? '👩 Kadın' : 
                         user.gender === 'other' ? '⚧ Diğer' : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {user.birth_date ? new Date(user.birth_date).toLocaleDateString('tr-TR') : '-'}
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
            Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedUsers.length)}</span> of <span className="font-medium">{sortedUsers.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1} 
              className={currentPage === 1 ? "text-gray-400" : ""}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              ←
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button 
                  key={pageNum}
                  variant="outline" 
                  size="sm" 
                  className={currentPage === pageNum ? "bg-blue-600 text-white border-blue-600" : ""}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              className={currentPage === totalPages ? "text-gray-400" : ""}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              →
            </Button>
            
            <select 
              className="ml-4 text-sm border border-gray-300 rounded px-2 py-1"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </main>
    </div>
  );
}