import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <Menu size={20} />
        </button>
        <h2 className="text-sm md:text-base font-medium text-slate-700">
          Selamat Datang, <span className="font-semibold">{user?.name}</span>
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-slate-800">{user?.name}</div>
          <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="text-red-600 border-red-200 hover:bg-red-50">
          <LogOut size={14} className="mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
