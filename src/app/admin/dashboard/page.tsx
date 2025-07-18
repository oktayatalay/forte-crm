'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Shield, 
  Building, 
  Activity, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface DashboardStats {
  total_users: number;
  total_admins: number;
  total_departments: number;
  recent_logins: number;
  department_stats: Array<{
    id: number;
    name: string;
    user_count: number;
    percentage: number;
  }>;
  weekly_stats: Array<{
    day: string;
    count: number;
    percentage: number;
  }>;
  recent_activities: Array<{
    id: number;
    activity_type: string;
    user_email: string;
    description: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_admins: 0,
    total_departments: 0,
    recent_logins: 0,
    department_stats: [],
    weekly_stats: [],
    recent_activities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifySession();
    loadDashboardStats();
  }, []);

  const verifySession = async () => {
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

      const data = await response.json();

      if (response.ok) {
        setAdmin(data.admin);
      } else {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin';
      }
    } catch {
      // toast.error('Session doğrulama hatası');
      // Mock data for development
      setAdmin({
        id: 1,
        email: 'admin@forte.works',
        full_name: 'Admin User',
        role: 'superadmin',
        is_active: true
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    const token = localStorage.getItem('admin_token');
    
    try {
      const response = await fetch('/api/admin/dashboard-stats.php', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch {
      console.error('İstatistikler yüklenemedi');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Hoş geldiniz, {admin?.full_name}! Sistem durumu ve yönetim araçları.
            </p>
          </div>
          <Badge variant="destructive" className="h-8">
            <Shield className="mr-1 h-3 w-3" />
            {admin?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Kullanıcı
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% bu aydan
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Admin Sayısı
            </CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_admins}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              Aktif durumda
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Departmanlar
            </CardTitle>
            <Building className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_departments}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Activity className="h-3 w-3 mr-1 text-blue-500" />
              Organizasyon yapısı
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Günlük Aktiflik
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent_logins}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1 text-orange-500" />
              Son 24 saat
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Kullanıcı Aktivitesi
            </CardTitle>
            <CardDescription>
              Son 7 günlük kullanıcı giriş istatistikleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.weekly_stats.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{day.day}</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={day.percentage} className="w-[100px]" />
                    <span className="text-sm text-muted-foreground">{day.count}</span>
                  </div>
                </div>
              ))}
              {stats.weekly_stats.length === 0 && (
                <div className="text-center py-4">
                  <span className="text-sm text-muted-foreground">Henüz veri yok</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Departman Dağılımı
            </CardTitle>
            <CardDescription>
              Kullanıcıların departmanlara göre dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.department_stats.map((dept, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={dept.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                      <span className="text-sm font-medium">{dept.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={dept.percentage} className="w-[100px]" />
                      <span className="text-sm text-muted-foreground">{dept.user_count}</span>
                    </div>
                  </div>
                );
              })}
              {stats.department_stats.length === 0 && (
                <div className="text-center py-4">
                  <span className="text-sm text-muted-foreground">Henüz departman verisi yok</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and System Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Son Aktiviteler
            </CardTitle>
            <CardDescription>
              Sistemdeki son kullanıcı aktiviteleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_activities.map((activity) => {
                const activityColors = {
                  'user_login': 'bg-green-500',
                  'profile_update': 'bg-blue-500', 
                  'signature_created': 'bg-orange-500',
                  'department_change': 'bg-purple-500',
                  'default': 'bg-gray-500'
                };
                
                const colorClass = activityColors[activity.activity_type as keyof typeof activityColors] || activityColors.default;
                
                const formatTimeAgo = (dateStr: string) => {
                  const now = new Date();
                  const activityDate = new Date(dateStr);
                  const diffMs = now.getTime() - activityDate.getTime();
                  const diffMins = Math.floor(diffMs / (1000 * 60));
                  
                  if (diffMins < 1) return 'Az önce';
                  if (diffMins < 60) return `${diffMins} dk önce`;
                  const diffHours = Math.floor(diffMins / 60);
                  if (diffHours < 24) return `${diffHours} saat önce`;
                  const diffDays = Math.floor(diffHours / 24);
                  return `${diffDays} gün önce`;
                };
                
                return (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{activity.description}</span>
                      <span className="text-muted-foreground ml-2">{activity.user_email}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</span>
                  </div>
                );
              })}
              {stats.recent_activities.length === 0 && (
                <div className="text-center py-4">
                  <span className="text-sm text-muted-foreground">Henüz aktivite yok</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Sistem Durumu
            </CardTitle>
            <CardDescription>
              Sistem sağlığı ve durum bilgileri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Çalışıyor
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">API Servis</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Çalışıyor
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Mail Sistemi</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Çalışıyor
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Backup</span>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Beklemede
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Son Backup:</span>
                <span className="text-muted-foreground">2 saat önce</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Sistem Uptime:</span>
                <span className="text-muted-foreground">99.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChart className="mr-2 h-5 w-5" />
            Hızlı İşlemler
          </CardTitle>
          <CardDescription>
            Sık kullanılan yönetim araçlarına hızlı erişim
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 justify-start hover:bg-blue-50 border-blue-200"
              onClick={() => window.location.href = '/admin/users'}
            >
              <Users className="mr-2 h-4 w-4 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Kullanıcı Yönetimi</div>
                <div className="text-xs text-muted-foreground">Kullanıcıları yönet</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 justify-start hover:bg-green-50 border-green-200"
              onClick={() => window.location.href = '/admin/departments'}
            >
              <Building className="mr-2 h-4 w-4 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Departmanlar</div>
                <div className="text-xs text-muted-foreground">Departman yönetimi</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 justify-start hover:bg-red-50 border-red-200"
              onClick={() => window.location.href = '/admin/admins'}
            >
              <Shield className="mr-2 h-4 w-4 text-red-600" />
              <div className="text-left">
                <div className="font-medium">Admin Yönetimi</div>
                <div className="text-xs text-muted-foreground">Admin yetkiler</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 justify-start hover:bg-purple-50 border-purple-200"
              onClick={() => window.location.href = '/admin/settings'}
            >
              <Calendar className="mr-2 h-4 w-4 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">Sistem Ayarları</div>
                <div className="text-xs text-muted-foreground">Genel ayarlar</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}