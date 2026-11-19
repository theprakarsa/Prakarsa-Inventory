import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Package, ArrowLeftRight, AlertTriangle, Wrench } from 'lucide-react';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/api/reports/dashboard')).data.data,
    retry: 0,
  });

  const cards = [
    { label: 'Total Asset', value: data?.totalAssets, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Dipinjam', value: data?.totalLoans, icon: ArrowLeftRight, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Rusak', value: data?.totalDamages, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Terpasang', value: data?.totalInstalled, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-semibold mb-4 text-slate-900">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs md:text-sm text-slate-500">{c.label}</p>
                <p className="text-xl md:text-2xl font-bold text-slate-900">{isLoading ? '...' : c.value ?? 0}</p>
              </div>
              <div className={`p-2 rounded-lg ${c.bg}`}>
                <c.icon className={c.color} size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
