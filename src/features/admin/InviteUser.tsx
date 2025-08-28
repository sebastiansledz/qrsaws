import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useToast } from '../../hooks/useToast'
import { Loader2, UserPlus } from 'lucide-react'
import { getClients } from '../../lib/queriesSupabase'
import { Client } from '../../types/client'

type Role = 'admin' | 'client' | 'worker'

export default function InviteUser() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<Role>('client')
  const [clientId, setClientId] = useState<string>('')
  const [clients, setClients] = useState<Client[]>([])
  const [busy, setBusy] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getClients()
        setClients(clientsData as Client[])
      } catch (error) {
        console.error('Error loading clients:', error)
        toast({
          title: 'Błąd',
          description: 'Nie udało się załadować listy klientów',
          variant: 'destructive'
        })
      } finally {
        setLoadingClients(false)
      }
    }
    loadClients()
  }, [toast])

  const onInvite = async () => {
    if (!email || !displayName) {
      toast({
        title: 'Błąd',
        description: 'Email i nazwa wyświetlana są wymagane',
        variant: 'destructive'
      })
      return
    }

    setBusy(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret': import.meta.env.VITE_EDGE_SECRET!,
        },
        body: JSON.stringify({ 
          action: 'invite', 
          email, 
          display_name: displayName, 
          role,
          client_id: role === 'client' ? clientId : undefined
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Nie udało się wysłać zaproszenia')
      }

      toast({ 
        title: 'Zaproszenie wysłane', 
        description: `Email aktywacyjny został wysłany do ${email}.` 
      })
      
      // Reset form
      setEmail('')
      setDisplayName('')
      setRole('client')
      setClientId('')
    } catch (error: any) {
      console.error('Error inviting user:', error)
      toast({ 
        title: 'Błąd', 
        description: error.message || 'Nie udało się wysłać zaproszenia.',
        variant: 'destructive'
      })
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = email && displayName && (role !== 'client' || clientId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-primary-600" />
            <span>Zaproś nowego użytkownika</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nazwa wyświetlana *</label>
              <Input
                placeholder="Jan Kowalski"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rola *</label>
              <Select value={role} onValueChange={(v: Role) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz rolę" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Klient</SelectItem>
                  <SelectItem value="worker">Pracownik</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {role === 'client' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Klient *</label>
                {loadingClients ? (
                  <div className="flex items-center h-10 px-3 border rounded-xl">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Ładowanie...</span>
                  </div>
                ) : (
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz klienta" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id!}>
                          {client.name} ({client.code2})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700">
              Użytkownik otrzyma email z zaproszeniem do ustawienia hasła i aktywacji konta.
            </p>
          </div>

          <Button 
            onClick={onInvite} 
            disabled={busy || !canSubmit}
            className="w-full"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wysyłanie zaproszenia...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Wyślij zaproszenie
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}