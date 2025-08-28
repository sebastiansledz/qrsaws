import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LiveQrScanner from '../../components/qr/LiveQrScanner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Loader2 } from 'lucide-react'

export const ScanBlade = () => {
  const navigate = useNavigate()
  const [value, setValue] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleDecode = useCallback(async (v: string) => {
    if (busy) return
    setBusy(true)
    setValue(v)
    try {
      // Navigate to your existing flow or blade details
      navigate(`/scan/result/${encodeURIComponent(v)}`)
    } finally {
      setBusy(false)
    }
  }, [busy, navigate])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Skanuj kod QR</h1>

      <Card className="rounded-2xl shadow-lg">
        <CardContent className="p-3">
          <LiveQrScanner
            onDecode={handleDecode}
            onError={(e) => setErrorMsg((e as Error)?.message || 'Błąd skanera')}
            facingMode="environment"
            className="w-full"
          />
        </CardContent>
      </Card>

      {value && (
        <div className="text-sm text-muted-foreground break-all">
          Odczytano: <span className="font-medium">{value}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.history.back()}>Wróć</Button>
        <Button disabled={busy || !value} onClick={() => value && navigate(`/scan/result/${encodeURIComponent(value)}`)}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Kontynuuj
        </Button>
      </div>

      {errorMsg && (
        <p className="text-xs text-amber-600">Uwaga skanera: {errorMsg}</p>
      )}
      
      <p className="text-xs text-muted-foreground">
        Wskazówka: zbliż kod, upewnij się że jest dobrze oświetlony i ostry. Użyj podglądu w ramce.
      </p>
    </div>
  )
}

// Provide both exports so router imports work either way
export default ScanBlade