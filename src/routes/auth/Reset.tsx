import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { supabase } from '../../lib/supabaseClient';
import { createFormConfig } from '../../lib/forms';
import { QRIcon } from '../../components/common/QRIcon';
import { CheckCircle } from 'lucide-react';

const resetSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
});

type ResetForm = z.infer<typeof resetSchema>;

export const Reset: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>(
    createFormConfig(resetSchema)
  );

  const onSubmit = async (data: ResetForm) => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email);
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError('Błąd wysyłania emaila. Spróbuj ponownie');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-large text-center">
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-success-100 rounded-2xl">
                  <CheckCircle className="h-12 w-12 text-success-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Email wysłany!</h2>
                <p className="text-gray-600 mt-2">
                  Sprawdź swoją skrzynkę pocztową i kliknij link resetowania hasła.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Nie otrzymałeś emaila? Sprawdź folder spam lub spróbuj ponownie.
                </p>
                <Link to="/auth/signin">
                  <Button className="w-full">
                    Powrót do logowania
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
                Resetuj hasło
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Wprowadź swój adres email aby otrzymać link resetowania hasła
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                {loading ? 'Wysyłanie...' : 'Wyślij link resetowania'}
              </Button>
            </form>

            <div className="text-center">
              <Link
                to="/auth/signin"
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                Powrót do logowania
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};