import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  
  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      
      {/* Kiri: Tombol Menu (Mobile) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Kanan: Profil & Logout */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="text-right hidden sm:block">
          <div className="font-semibold text-sm text-slate-900">{user?.name}</div>
          <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
        </div>
        
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div> {/* Garis pemisah */}

        <Button 
          size="sm" 
          variant="ghost" 
          className="text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors" 
          onClick={logout}
        >
          <LogOut size={16} className="mr-2" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
}
