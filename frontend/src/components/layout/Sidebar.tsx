import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, Package, Building2, Tag, Users2, MapPin, 
  ShoppingCart, ArrowLeftRight, AlertTriangle, Wrench, 
  FileText, UserCog, ClipboardList, BarChart3, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
// Pastikan path import logo ini sesuai dengan struktur folder Anda
import logo from '@/assets/logo.png'; 

const menu = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', '1', '2'] },
  { to: '/assets', label: 'Assets', icon: Package, roles: ['admin', 'staff', '1', '2'] },
  { to: '/divisions', label: 'Divisi', icon: Building2, roles: ['admin', '1'] },
  { to: '/categories', label: 'Kategori', icon: Tag, roles: ['admin', '1'] },
  { to: '/employees', label: 'Karyawan', icon: Users2, roles: ['admin', '1'] },
  { to: '/locations', label: 'Lokasi', icon: MapPin, roles: ['admin', '1'] },
  { to: '/purchases', label: 'Pembelian', icon: ShoppingCart, roles: ['admin', '1'] },
  { to: '/loans', label: 'Peminjaman', icon: ArrowLeftRight, roles: ['admin', 'staff', '1', '2'] },
  { to: '/damages', label: 'Kerusakan', icon: AlertTriangle, roles: ['admin', 'staff', '1', '2'] },
  { to: '/installed', label: 'Terpasang', icon: Wrench, roles: ['admin', 'staff', '1', '2'] },
  { to: '/templates', label: 'Template', icon: FileText, roles: ['admin', '1'] },
  { to: '/users', label: 'Users', icon: UserCog, roles: ['admin', '1'] },
  { to: '/logs', label: 'Activity Logs', icon: ClipboardList, roles: ['admin', '1'] },
  { to: '/reports', label: 'Laporan', icon: BarChart3, roles: ['admin', 'staff', '1', '2'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  
  const role = String(user?.role || 'staff').toLowerCase();
  
  const isAdmin = role === 'admin' || role === '1' || role === 'administrator' || role === 'superadmin';
  const isStaff = role === 'staff' || role === '2';

  const filtered = menu.filter((m) => {
    if (isAdmin && m.roles.includes('admin')) return true;
    if (isStaff && m.roles.includes('staff')) return true;
    return m.roles.includes(role);
  });

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      {/* BAGIAN LOGO DIKEMBALIKAN */}
      <div className="p-6 border-b border-slate-200 flex justify-center">
        <img src={logo} alt="Prakarsa Logo" className="h-16 object-contain" />
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
