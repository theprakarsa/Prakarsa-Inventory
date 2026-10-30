import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  tersedia: 'bg-green-100 text-green-800',
  dipinjam: 'bg-blue-100 text-blue-800',
  terpasang: 'bg-yellow-100 text-yellow-800',
  rusak: 'bg-red-100 text-red-800',
  hilang: 'bg-gray-800 text-white',
  dilepas: 'bg-gray-200 text-gray-700',
  aktif: 'bg-blue-100 text-blue-800',
  selesai: 'bg-green-100 text-green-800',
  purchase: 'bg-indigo-100 text-indigo-800',
  grant: 'bg-purple-100 text-purple-800',
  rusak_pemakaian: 'bg-red-100 text-red-800',
  rusak_hardware: 'bg-red-200 text-red-900',
};

export function Badge({ value, className }: { value: string; className?: string }) {
  const cls = STATUS_COLORS[value] ?? 'bg-gray-100 text-gray-700';
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded text-xs font-medium capitalize',
        cls,
        className
      )}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}
