import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { supabase } from '../../lib/supabaseClient';
import { createFormConfig } from '../../lib/forms';
import { QRIcon } from '../../components/common/QRIcon';

const signUpSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string().min(6, 'Potwierdzenie hasła jest wymagane'),
  displayName: z.string().min(2, 'Imię i nazwisko musi mieć co najmniej 2 znaki'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są zgodne",
  path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof signUpSchema>;

export const SignUp: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>(
    createFormConfig(signUpSchema)
  );

  const onSubmit = async (data: SignUpForm) => {
    setLoading(true);
    setError('');

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_SITE_URL}/auth/callback`,
          data: {
            display_name: data.displayName,
          }
        }
      });

      if (error) throw error;
      
      // After signup, user will need to confirm email before accessing the app
      navigate('/auth/signin');
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.message?.includes('already registered')) {
        setError('Ten adres email jest już używany');
      } else {
        setError('Błąd rejestracji. Spróbuj ponownie');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-large">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-primary-100 rounded-2xl">
                <QRIcon size={32} />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">
                Utwórz konto
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Wypełnij formularz aby założyć nowe konto
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Input
                  {...register('displayName')}
                  type="text"
                  placeholder="Imię i nazwisko"
                  className="h-12"
                  autoComplete="name"
                />
                {errors.displayName && (
                  <p className="text-sm text-error-600">{errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Adres email"
                  className="h-12"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-error-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="Hasło"
                  className="h-12"
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="text-sm text-error-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="Potwierdź hasło"
                  className="h-12"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-error-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-error-600 text-center bg-error-50 p-3 rounded-xl"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? 'Tworzenie konta...' : 'Utwórz konto'}
              </Button>
            </form>

            <div className="text-center">
              <div className="text-sm text-gray-600">
                Masz już konto?{' '}
                <Link
                  to="/auth/signin"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Zaloguj się
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};