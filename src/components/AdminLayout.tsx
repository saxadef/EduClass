import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, UploadCloud, Users, Settings, LogOut, Menu, X, WifiOff, Wifi, HardDrive } from 'lucide-react';
import { ApiClient } from '../lib/api';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [hasSession, setHasSession] = useState<boolean>(!!ApiClient.getSessionToken());

  useEffect(() => {
    // Check session
    const token = ApiClient.getSessionToken();
    if (!token) {
      setHasSession(false);
      navigate('/admin/login');
    } else {
      setHasSession(true);
    }
    // Check mode
    setIsLiveMode(ApiClient.isLiveMode());
  }, [navigate, location]);

  const handleLogout = () => {
    ApiClient.logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dasbor', path: '/admin', icon: LayoutDashboard },
    { label: 'Instruksi', path: '/admin/instructions', icon: FileText },
    { label: 'File Manager', path: '/admin/files', icon: HardDrive },
    { label: 'Evaluasi & Nilai Tugas', path: '/admin/submissions', icon: UploadCloud },
    { label: 'Data Siswa', path: '/admin/students', icon: Users },
    { label: 'Pengaturan', path: '/admin/settings', icon: Settings },
  ];

  const adminName = ApiClient.getAdminDisplayName();

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="text-sm text-neutral-500 animate-pulse">Memverifikasi sesi admin...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/70 via-indigo-50/10 to-neutral-50 flex flex-col font-sans text-neutral-800">
      {/* Top Banner indicating mode */}
      <div className={`text-center py-1.5 px-4 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
        isLiveMode ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-neutral-900'
      }`}>
        {isLiveMode ? (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span>Mode Terhubung: Beroperasi melalui Google Apps Script langsung.</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Mode Demo (Aktif): Menyimpan data di localStorage browser. Atur Apps Script di Pengaturan untuk beralih ke mode langsung!</span>
          </>
        )}
      </div>

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-neutral-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <span className="text-xl font-bold tracking-tight text-neutral-950 flex items-center gap-2">
              <span className="bg-neutral-950 text-white px-2 py-0.5 rounded text-sm font-semibold">Edu</span>
              Class Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-sm text-neutral-600">
              Selamat datang, <strong className="text-neutral-900">{adminName}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="text-neutral-500 hover:text-red-600 flex items-center gap-1.5 text-sm font-medium transition py-1.5 px-3 rounded-md hover:bg-neutral-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 relative">
        {/* Sidebar for Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-neutral-900/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute top-16 left-0 w-64 bg-white h-[calc(100vh-4rem)] border-r border-neutral-200 p-4 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 bg-white border border-neutral-200 rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
