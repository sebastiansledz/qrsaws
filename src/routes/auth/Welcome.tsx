import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../hooks/useToast'
import { QRIcon } from '../../components/common/QRIcon'

export default function Welcome() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Check if user came from an invite link and has a valid session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      } else {
        // No session, redirect to sign in
        navigate('/auth/signin', { replace: true })
      }
      setLoading(false)
    })
  }, [navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({ 
        title: 'Błąd', 
        description: 'Hasła nie są zgodne',
        variant: 'destructive'
      })
      return
    }

    if (password.length < 6) {
      toast({ 
        title: 'Błąd', 
        description: 'Hasło musi mieć co najmniej 6 znaków',
        variant: 'destructive'
      })
      return
    }

    setSubmitting(true)
    
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      // Fetch role and redirect
      const { data: { user } } = await supabase.auth.getUser()
      const { data: roleRow } = await supabase
        .from('app_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single()

      toast({
        title: 'Sukces',
        description: 'Hasło zostało ustawione pomyślnie'
      })

      // Redirect based on role
      setTimeout(() => {
        if (roleRow?.role === 'admin') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/app', { replace: true })
        }
      }, 1000)
    } catch (error: any) {
      console.error('Password update error:', error)
      toast({ 
        title: 'Błąd', 
        description: error.message || 'Nie udało się ustawić hasła',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    )
  }

  if (!ready) {
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
                <div className="p-4 bg-error-100 rounded-2xl">
                  <QRIcon size={48} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Brak sesji zaproszenia</h2>
                <p className="text-gray-600 mt-2">
                  Link zaproszenia jest nieprawidłowy lub wygasł.
                </p>
              </div>
              <Button onClick={() => navigate('/auth/signin')}>
                Przejdź do logowania
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
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
                <Lock className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">
                Ustaw hasło
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Witamy w QRSaws! Ustaw swoje hasło aby dokończyć konfigurację konta.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Nowe hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Potwierdź hasło"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ustawianie hasła...
                  </>
                ) : (
                  'Zapisz i przejdź'
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Po ustawieniu hasła zostaniesz przekierowany do panelu aplikacji.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export { Welcome }