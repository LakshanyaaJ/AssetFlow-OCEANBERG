import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../../lib/api';
import { useAuth } from './AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const { accessToken, user } = res.data.data;
      login(accessToken, user);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-2 border-slate-800 rounded-2xl shadow-md overflow-hidden bg-white">
          <div className="border-b-2 border-slate-800 py-3 bg-slate-100 text-center font-bold text-lg text-slate-800 tracking-wide">
            AssetFlow - login
          </div>
          <CardContent className="py-8 px-6 sm:px-10 space-y-6">
            {/* Circle AF Emblem */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center text-xl font-extrabold text-slate-800 tracking-wider bg-white">
                AF
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Email"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
              />
              
              <Input
                label="Password"
                type="password"
                placeholder="********"
                autoComplete="current-password"
                {...register('password')}
                error={errors.password?.message}
              />

              <div className="flex justify-end pt-1">
                <a href="#" className="text-xs font-medium text-slate-600 hover:text-slate-900 underline transition-colors">
                  Forgot password
                </a>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg shadow-sm" size="lg" isLoading={isLoading}>
                  Sign in
                </Button>
              </div>
            </form>

            {/* New here section from wireframe */}
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <span className="block text-sm font-bold text-slate-800">New here?</span>
              <div className="border-2 border-slate-700 rounded-lg p-3 text-xs sm:text-sm text-slate-800 font-medium bg-slate-50 leading-relaxed">
                Sign up creates an employee account admin roles assigned later
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-slate-800 text-slate-800 hover:bg-slate-100 font-bold py-2 rounded-lg"
                onClick={() => toast.success('Sign up flow initiated')}
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
