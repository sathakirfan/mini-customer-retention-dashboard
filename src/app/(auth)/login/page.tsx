'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail } from 'lucide-react';
import { LogoIcon } from '@/components/layout/logo';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Welcome back! Loading dashboard...');
      } else {
        toast.error(result.message || 'Invalid credentials. Please try again.');
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950 px-4 py-12 premium-gradient-mesh relative overflow-hidden">
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-purple-500/10 dark:bg-purple-500/15 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <LogoIcon className="mx-auto mb-4 h-14 w-14 text-indigo-600 dark:text-indigo-400 drop-shadow-md animate-pulse" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 font-heading">
            LocalPulse <span className="bg-clip-text bg-gradient-to-r from-indigo-650 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300">CRM</span>
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-zinc-400">
            Hyperlocal Business Retention & Revenue Dashboard
          </p>
        </div>

        <Card className="glass-card premium-shadow border-none">
          <CardHeader className="space-y-1.5 pb-6 border-b border-slate-100/50 dark:border-zinc-800/40">
            <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">Sign in</CardTitle>
            <CardDescription className="text-slate-400 dark:text-zinc-400 font-medium">
              Enter your credentials to manage your business dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400 dark:text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@business.com"
                    className="pl-10.5 bg-white/70 dark:bg-zinc-950/50 border-slate-200/60 dark:border-zinc-800/60 focus:bg-white dark:focus:bg-zinc-950"
                    {...register('email')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-semibold text-rose-500 dark:text-rose-450">{errors.email?.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-400">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400 dark:text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10.5 bg-white/70 dark:bg-zinc-950/50 border-slate-200/60 dark:border-zinc-800/60 focus:bg-white dark:focus:bg-zinc-950"
                    {...register('password')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-semibold text-rose-500 dark:text-rose-450">{errors.password?.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-3">
              <Button type="submit" className="w-full font-bold shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/15 cursor-pointer transition-all duration-200" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Info Footer */}
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-zinc-400">
          Single business owner panel. Credentials configured via `.env.local`.
        </p>
      </div>
    </div>
  );
}
