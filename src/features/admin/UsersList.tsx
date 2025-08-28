import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Loader2, RefreshCcw, Shield, User, Users } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../hooks/useToast'

type Role = 'admin' | 'client' | 'worker'

type UserRow = { 
  user_id: string
  display_name: string | null
  email: string | null
  app_roles: { role: Role } | null
  created_at: string
}

export default function UsersList() {
  const { toast } = useToast()
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRows = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, email, created_at, app_roles(role)')
        .order('display_name', { ascending: true })
      
      if (error) throw error
      setRows(data as UserRow[])
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować użytkowników',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchRows() 
  }, [])

  const handleResendInvite = async (email: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret': import.meta.env.VITE_EDGE_SECRET!,
        },
        body: JSON.stringify({ action: 'resend', email }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Nie udało się wysłać zaproszenia')
      }

      toast({
        title: 'Sukces',
        description: 'Zaproszenie zostało wysłane ponownie'
      })
    } catch (error: any) {
      console.error('Error resending invite:', error)
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się wysłać zaproszenia',
        variant: 'destructive'
      })
    }
  }

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'client':
        return <User className="h-4 w-4" />
      case 'worker':
        return <Users className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'client':
        return 'Klient'
      case 'worker':
        return 'Pracownik'
      default:
        return role
    }
  }

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'client':
        return 'default'
      case 'worker':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Użytkownicy ({rows.length})</h2>
        <Button variant="outline" onClick={fetchRows}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Odśwież
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista użytkowników</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Data utworzenia</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user, index) => (
                <motion.tr
                  key={user.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    {user.display_name || 'Bez nazwy'}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.app_roles?.role ? (
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.app_roles.role)}
                        <Badge variant={getRoleBadgeVariant(user.app_roles.role) as any}>
                          {getRoleLabel(user.app_roles.role)}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-gray-400">Brak roli</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pl-PL')}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvite(user.email!)}
                      >
                        Wyślij ponownie
                      </Button>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    Brak użytkowników w systemie
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}