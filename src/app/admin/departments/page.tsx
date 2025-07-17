'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Department {
  id: number;
  name: string;
  description: string | null;
  is_active: number;
  director_id: number | null;
  director_name: string | null;
  parent_id: number | null;
  parent_name: string | null;
  created_at: string;
  updated_at: string;
  children?: Department[];
  level?: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  title: string;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    director_id: null as number | null,
    parent_id: null as number | null,
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

      fetchDepartments();
      fetchUsers();
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('admin_token');
      router.push('/admin');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const fetchDepartments = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/departments.php', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDepartments(buildHierarchy(data.departments));
      }
    } catch (error) {
      console.error('Fetch departments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/users.php', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users.filter((user: User) => user.name)); // Only users with names
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const buildHierarchy = (depts: Department[]): Department[] => {
    const departmentMap = new Map();
    const result: Department[] = [];

    // First pass: create map and add level info
    depts.forEach(dept => {
      departmentMap.set(dept.id, { ...dept, children: [], level: 0 });
    });

    // Second pass: build hierarchy and calculate levels
    depts.forEach(dept => {
      const deptWithChildren = departmentMap.get(dept.id);
      if (dept.parent_id) {
        const parent = departmentMap.get(dept.parent_id);
        if (parent) {
          deptWithChildren.level = (parent.level || 0) + 1;
          parent.children.push(deptWithChildren);
        }
      } else {
        result.push(deptWithChildren);
      }
    });

    return result;
  };

  const flattenDepartments = (depts: Department[]): Department[] => {
    const result: Department[] = [];
    
    const addDepartment = (dept: Department) => {
      result.push(dept);
      if (dept.children) {
        dept.children.forEach(child => addDepartment(child));
      }
    };

    depts.forEach(dept => addDepartment(dept));
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    
    try {
      const url = '/api/admin/departments.php';
      const method = editingDepartment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingDepartment ? { ...formData, id: editingDepartment.id } : formData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(editingDepartment ? 'Departman güncellendi' : 'Departman eklendi');
        fetchDepartments();
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingDepartment(null);
        setFormData({
          name: '',
          description: '',
          director_id: null,
          parent_id: null,
          is_active: 1
        });
      } else {
        toast.error(data.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Bağlantı hatası');
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      director_id: department.director_id,
      parent_id: department.parent_id,
      is_active: department.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (departmentId: number) => {
    if (!confirm('Bu departmanı silmek istediğinizden emin misiniz?')) {
      return;
    }

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/departments.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: departmentId })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Departman silindi');
        fetchDepartments();
      } else {
        toast.error(data.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Bağlantı hatası');
    }
  };

  const toggleStatus = async (department: Department) => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/departments.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: department.id,
          name: department.name,
          description: department.description,
          director_id: department.director_id,
          parent_id: department.parent_id,
          is_active: department.is_active === 1 ? 0 : 1
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Departman ${department.is_active === 1 ? 'pasifleştirildi' : 'aktifleştirildi'}`);
        fetchDepartments();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  const filteredDepartments = flattenDepartments(departments).filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (dept.director_name && dept.director_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getIndentClass = (level: number) => {
    const indentClasses = ['pl-0', 'pl-6', 'pl-12', 'pl-18', 'pl-24'];
    return indentClasses[level] || 'pl-24';
  };

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
                <h1 className="text-2xl font-semibold text-gray-900">Departman Yönetimi</h1>
                <p className="text-sm text-gray-500 mt-1">Departmanları ve hiyerarşilerini yönetin</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setIsAddDialogOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                ➕ Add new
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          
            {/* Search Bar */}
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
          </div>
        </div>

          {/* Departments Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Tüm Departmanlar ({filteredDepartments.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filteredDepartments.map(dept => (
                <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`flex-1 ${getIndentClass(dept.level || 0)}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {dept.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{dept.name}</h3>
                        <p className="text-sm text-gray-600">{dept.description || 'Açıklama bulunmuyor'}</p>
                        {dept.director_name && (
                          <p className="text-xs text-blue-600">Direktör: {dept.director_name}</p>
                        )}
                        {dept.parent_name && (
                          <p className="text-xs text-gray-500">Bağlı olduğu: {dept.parent_name}</p>
                        )}
                      </div>
                      <Badge variant={dept.is_active === 1 ? 'default' : 'destructive'}>
                        {dept.is_active === 1 ? 'Aktif' : 'Pasif'}
                      </Badge>
                      {dept.level && dept.level > 0 && (
                        <Badge variant="outline">
                          Level {dept.level + 1}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(dept)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    >
                      {dept.is_active === 1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(dept)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(dept.id)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* Add Department Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Departman Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Departman Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="parent">Bağlı Olduğu Departman</Label>
                <Select value={formData.parent_id?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, parent_id: value ? parseInt(value) : null })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ana departman seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ana Departman (Bağımsız)</SelectItem>
                    {flattenDepartments(departments).map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {'  '.repeat(dept.level || 0)}{dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="director">Direktör</Label>
                <Select value={formData.director_id?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, director_id: value ? parseInt(value) : null })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Direktör seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Direktör seçilmedi</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} - {user.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Department
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Departman Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="edit_name">Departman Adı *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit_description">Açıklama</Label>
                <Input
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit_parent">Bağlı Olduğu Departman</Label>
                <Select value={formData.parent_id?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, parent_id: value ? parseInt(value) : null })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ana departman seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ana Departman (Bağımsız)</SelectItem>
                    {flattenDepartments(departments).filter(dept => dept.id !== editingDepartment?.id).map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {'  '.repeat(dept.level || 0)}{dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit_director">Direktör</Label>
                <Select value={formData.director_id?.toString() || ''} onValueChange={(value) => setFormData({ ...formData, director_id: value ? parseInt(value) : null })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Direktör seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Direktör seçilmedi</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} - {user.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Department
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}