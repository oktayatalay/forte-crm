'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Clock, 
  CreditCard, 
  Users, 
  Settings, 
  ArrowRight,
  TrendingUp,
  Star,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  name: string | null;
  title: string | null;
  mobile_phone_1: string | null;
  mobile_phone_2: string | null;
}

// Dashboard feature cards data
const dashboardFeatures = [
  {
    title: "Mail Avatar",
    description: "SVG formatında mail avatarı oluşturun ve indirin",
    icon: User,
    href: "/dashboard/mail-avatar",
    color: "bg-blue-500",
    stats: "Son 30 gün",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    title: "Mail İmzası",
    description: "HTML formatında Outlook mail imzası oluşturun",
    icon: Mail,
    href: "/dashboard/mail-signature",
    color: "bg-green-500",
    stats: "Aktif",
    gradient: "from-green-500 to-green-600"
  },
  {
    title: "Otomatik Yanıt",
    description: "Out of office email metni oluşturun",
    icon: Clock,
    href: "/dashboard/auto-reply",
    color: "bg-orange-500",
    stats: "Hazır",
    gradient: "from-orange-500 to-orange-600"
  },
  {
    title: "Dijital Kartvizit",
    description: "vCard'ınızı görüntüleyin ve QR kod indirin",
    icon: CreditCard,
    href: "/dashboard/vcard",
    color: "bg-purple-500",
    stats: "QR Kod",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    title: "Ortak Hesaplar",
    description: "WeTransfer, SmallPDF gibi ortak hesap bilgileri",
    icon: Users,
    href: "/dashboard/shared-accounts",
    color: "bg-gray-500",
    stats: "Yakında",
    gradient: "from-gray-500 to-gray-600",
    disabled: true
  },
  {
    title: "Profil Ayarları",
    description: "Kişisel bilgilerinizi güncelleyin",
    icon: Settings,
    href: "/dashboard/profile",
    color: "bg-red-500",
    stats: "Profil",
    gradient: "from-red-500 to-red-600"
  }
];

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session kontrolü yap
    const verifySession = async () => {
      const token = localStorage.getItem('session_token');
      
      if (!token) {
        window.location.href = '../';
        return;
      }

      try {
        const response = await fetch('../api/endpoints/verify_session.php', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
        } else {
          localStorage.removeItem('session_token');
          localStorage.removeItem('user');
          window.location.href = '../';
        }
      } catch {
        toast.error('Session doğrulama hatası');
        window.location.href = '../';
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
              Hoş geldiniz{user?.name ? `, ${user.name}` : ''}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Forte Corporate Panel&apos;e hoş geldiniz. Aşağıdaki araçları kullanabilirsiniz.
            </p>
          </div>
          <Badge variant="outline" className="h-8">
            <Activity className="mr-1 h-3 w-3" />
            Aktif
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kullanılan Araçlar
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              Toplam araç sayısı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profil Durumu
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.name ? '100%' : '60%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Tamamlanma oranı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Son Kullanım
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Bugün</div>
            <p className="text-xs text-muted-foreground">
              Son oturum açma
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Favori Araç
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Mail İmzası</div>
            <p className="text-xs text-muted-foreground">
              En çok kullanılan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Feature Cards */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Araçlar</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dashboardFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className={`hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br ${feature.gradient} text-white relative overflow-hidden group ${feature.disabled ? 'opacity-75' : ''}`}>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {feature.stats}
                    </Badge>
                  </div>
                  <CardTitle className="text-white mt-4">{feature.title}</CardTitle>
                  <CardDescription className="text-white/80">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  {feature.disabled ? (
                    <Button disabled className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30">
                      Yakında Gelecek
                    </Button>
                  ) : (
                    <Link href={feature.href}>
                      <Button className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30 group">
                        Başlat
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Profil Bilgileri
            </CardTitle>
            <CardDescription>
              Kişisel bilgilerinizi görüntüleyin ve güncelleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm text-muted-foreground">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Ad Soyad:</span>
                <span className="text-sm text-muted-foreground">{user?.name || 'Henüz girilmemiş'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Unvan:</span>
                <span className="text-sm text-muted-foreground">{user?.title || 'Henüz girilmemiş'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Telefon:</span>
                <span className="text-sm text-muted-foreground">{user?.mobile_phone_1 || 'Henüz girilmemiş'}</span>
              </div>
            </div>
            <Link href="/dashboard/profile">
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Profili Düzenle
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Hızlı Erişim
            </CardTitle>
            <CardDescription>
              Sık kullanılan araçlara hızlı erişim
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/mail-signature">
              <Button variant="ghost" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Mail İmzası
              </Button>
            </Link>
            <Link href="/dashboard/mail-avatar">
              <Button variant="ghost" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                Mail Avatar
              </Button>
            </Link>
            <Link href="/dashboard/vcard">
              <Button variant="ghost" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                Dijital Kartvizit
              </Button>
            </Link>
            <Link href="/dashboard/auto-reply">
              <Button variant="ghost" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Otomatik Yanıt
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}