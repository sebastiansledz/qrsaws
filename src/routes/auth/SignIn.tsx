import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase, SITE_URL } from '../../lib/supabase';
import useAuth from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { QRIcon } from '../../components/common/QRIcon';

export function SignIn() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_SITE_URL}/auth/callback`
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // After successful sign-in, check roles to decide destination
      const { data: ures } = await supabase.auth.getUser();
      const uid = ures?.user?.id;

      let destination = '/app';
      if (uid) {
        const { data: r1 } = await supabase.from('app_roles').select('is_admin').eq('user_id', uid).limit(1).maybeSingle();
        if (r1 && (r1 as any).is_admin === true) {
          destination = '/admin';
        } else {
          const { data: r2 } = await supabase.from('app_roles').select('role').eq('user_id', uid);
          if (Array.isArray(r2) && r2.some((r: any) => r.role === 'admin')) {
            destination = '/admin';
          }
        }
      }
      
      navigate(destination, { replace: true });
    } catch (error: any) {
      setError(error.message || 'Błąd logowania');
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
                Zaloguj się
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Wprowadź swoje dane aby uzyskać dostęp
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="email" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  required 
                  className="h-12"
                  placeholder="Adres email"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Input 
                  type="password" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  required 
                  className="h-12"
                  placeholder="Hasło"
                  autoComplete="current-password"
                />
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
                disabled={loading} 
                className="w-full h-12 text-base font-semibold"
              >
                {loading ? 'Logowanie…' : 'Zaloguj się'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}