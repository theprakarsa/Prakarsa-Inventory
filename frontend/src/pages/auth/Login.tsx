import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      setSubmitting(true);
      await login(data.email, data.password);
      toast.success('Login berhasil');
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Email atau Password salah');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] p-4">
      
      {/* Card Form Login */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-slate-100">
        
        {/* Area Logo Besar */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Prakarsa Logo" 
            className="h-28 w-auto object-contain" 
          />
        </div>

        {/* Judul yang Lebih Elegan */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
            Inventory Management
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Input Email */}
          <div>
            <Input
              type="email"
              {...register('email')}
              placeholder="Email"
              className="h-12 bg-slate-50 border-slate-200"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>
            )}
          </div>
          
          {/* Input Password */}
          <div>
            <Input 
              type="password" 
              {...register('password')} 
              placeholder="Password"
              className="h-12 bg-slate-50 border-slate-200"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold mt-4" disabled={submitting}>
            {submitting ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} ThePrakarsa. Internal Use Only.
        </div>
      </div>
    </div>
  );
}
