import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat, Result, NotFoundException, ChecksumException, FormatException } from '@zxing/library'
import { BrowserCodeReader, IScannerControls, VideoInputDevice } from '@zxing/browser'

type Props = {
  onDecode: (value: string, raw?: Result) => void
  onError?: (error: unknown) => void
  facingMode?: 'environment' | 'user'
  className?: string
}

export default function LiveQrScanner({ onDecode, onError, facingMode = 'environment', className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)

  const [devices, setDevices] = useState<VideoInputDevice[]>([])
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined)
  const [torchOn, setTorchOn] = useState(false)

  const hints = useMemo(() => {
    const h = new Map()
    // Restrict to QR for speed/stability
    h.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
    return h
  }, [])

  // Throttle real errors to avoid console spam
  const lastErrorRef = useRef(0)
  const handleDecode = useCallback((result: Result | undefined, err: unknown) => {
    if (result) {
      onDecode(result.getText(), result)
      return
    }
    if (!err) return
    // Ignore expected "no code in this frame" & similar decoding errors
    if (err instanceof NotFoundException || err instanceof ChecksumException || err instanceof FormatException) return
    const now = Date.now()
    if (now - lastErrorRef.current > 1000) {
      lastErrorRef.current = now
      onError?.(err)
    }
  }, [onDecode, onError])

  // Start scanner
  useEffect(() => {
    let mounted = true
    const start = async () => {
      try {
        const list = await BrowserCodeReader.listVideoInputDevices()
        if (!mounted) return
        setDevices(list)
        // Pick device by facingMode if possible
        let chosen: string | undefined = deviceId
        if (!chosen && list.length) {
          const env = list.find(d => /back|rear|environment/i.test(d.label))
          const user = list.find(d => /front|user/i.test(d.label))
          chosen = (facingMode === 'environment' ? env?.deviceId : user?.deviceId) ?? list[0].deviceId
          setDeviceId(chosen)
        }

        // Preferred constraints for clarity
        const videoConstraints: MediaTrackConstraints = {
          deviceId: chosen ? { exact: chosen } : undefined,
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }

        // Start decoder
        const reader = new BrowserMultiFormatReader(hints, 250) // 250ms scan interval
        controlsRef.current = await reader.decodeFromVideoDevice(
          chosen ?? undefined,
          videoRef.current!,
          (res, err) => handleDecode(res ?? undefined, err ?? undefined)
        )

        // Try to grab the track so we can toggle torch
        const stream = (videoRef.current as any)?.srcObject as MediaStream | undefined
        const track = stream?.getVideoTracks?.()[0]
        trackRef.current = track ?? null

        // Apply constraints after start (some browsers honor them better this way)
        if (track && Object.keys(videoConstraints).length) {
          await track.applyConstraints({ advanced: [{ width: 1280 }, { height: 720 }] as any })
        }
      } catch (e) {
        onError?.(e)
      }
    }

    start()
    return () => {
      mounted = false
      controlsRef.current?.stop()
      controlsRef.current = null
      trackRef.current = null
    }
  }, [deviceId, facingMode, hints, handleDecode, onError])

  // Torch toggle (if supported)
  const toggleTorch = async () => {
    const track = trackRef.current
    if (!track) return
    const capabilities = (track.getCapabilities?.() as any) || {}
    if (!('torch' in capabilities)) {
      onError?.(new Error('Torch not supported on this device'))
      return
    }
    const next = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] as any })
      setTorchOn(next)
    } catch (e) {
      onError?.(e)
    }
  }

  return (
    <div className={className}>
      {/* Controls row */}
      <div className="mb-2 flex items-center gap-2">
        <select
          className="border rounded-md px-2 py-1 text-sm"
          value={deviceId ?? ''}
          onChange={(e) => setDeviceId(e.target.value || undefined)}
        >
          {devices.map(d => (
            <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
          ))}
        </select>
        <button
          type="button"
          className="border rounded-md px-2 py-1 text-sm"
          onClick={toggleTorch}
        >
          {torchOn ? 'Latarka: włączona' : 'Latarka: wyłączona'}
        </button>
      </div>

      {/* Video with overlay */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} muted playsInline />
        {/* Overlay target box */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            width: '60%',
            aspectRatio: '1 / 1',
            border: '2px solid rgba(255,255,255,0.85)',
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)'
          }} />
        </div>
      </div>
    </div>
  )
}