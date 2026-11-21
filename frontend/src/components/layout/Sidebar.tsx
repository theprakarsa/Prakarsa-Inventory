import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Building2, Tag, Users2, MapPin,
  ShoppingCart, ArrowLeftRight, AlertTriangle, Wrench,
  FileText, UserCog, ClipboardList, BarChart3, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const menu = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { to: '/assets', label: 'Assets', icon: Package, roles: ['admin', 'staff'] },
  { to: '/divisions', label: 'Divisi', icon: Building2, roles: ['admin'] },
  { to: '/categories', label: 'Kategori', icon: Tag, roles: ['admin'] },
  { to: '/employees', label: 'Karyawan', icon: Users2, roles: ['admin'] },
  { to: '/locations', label: 'Lokasi', icon: MapPin, roles: ['admin'] },
  { to: '/purchases', label: 'Pembelian', icon: ShoppingCart, roles: ['admin'] },
  { to: '/loans', label: 'Peminjaman', icon: ArrowLeftRight, roles: ['admin', 'staff'] },
  { to: '/damages', label: 'Kerusakan', icon: AlertTriangle, roles: ['admin', 'staff'] },
  { to: '/installed', label: 'Terpasang', icon: Wrench, roles: ['admin', 'staff'] },
  { to: '/templates', label: 'Template', icon: FileText, roles: ['admin'] },
  { to: '/users', label: 'Users', icon: UserCog, roles: ['admin'] },
  { to: '/logs', label: 'Activity Logs', icon: ClipboardList, roles: ['admin'] },
  { to: '/reports', label: 'Laporan', icon: BarChart3, roles: ['admin', 'staff'] },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const role = (user?.role || 'staff').toLowerCase();
  const filtered = menu.filter((m) => m.roles.includes(role) || role === 'administrator' || role === 'superadmin');

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Sidebar Putih */}
      <aside
        className={cn(
          'no-print fixed md:static inset-y-0 left-0 z-50 w-64 min-h-screen bg-white border-r border-slate-200 p-4 flex flex-col transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Area Logo - TENGAH & SANGAT BESAR */}
        <div className="relative flex justify-center items-center mb-6 mt-1 px-2">
          <img 
            src="/logo.png" 
            alt="Prakarsa Logo" 
            className="h-24 w-auto object-contain" // <-- UKURAN DIPERBESAR JADI h-24
          />
          
          {/* Tombol Close hanya muncul di Mobile, posisinya absolute di kanan atas */}
          <button 
            onClick={onClose} 
            className="md:hidden absolute right-0 top-0 p-1 rounded-md text-slate-500 hover:bg-slate-100" 
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Navigasi */}
        <nav className="space-y-1.5 overflow-y-auto flex-1">
          {filtered.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <m.icon size={18} className="shrink-0" /> {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
