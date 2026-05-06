'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, MapPin, Clock, CheckCircle, LogOut, RotateCcw } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

type AttendanceRecord = {
  id: string
  type: 'CLOCK_IN' | 'CLOCK_OUT'
  createdAt: string
  address?: string
  photo: string
}

export default function AttendancePage() {
  const router = useRouter()
  const { user, token, logout, isAuthenticated } = useAuthStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [step, setStep] = useState<'idle' | 'camera' | 'preview' | 'submitting' | 'done'>('idle')
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [locError, setLocError] = useState('')
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return }
    if (user?.role !== 'SALES') { router.push('/dashboard'); return }
    fetchToday()
    getLocation()
  }, [])

  const fetchToday = async () => {
    try {
      const res = await fetch('/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTodayAttendance(Array.isArray(data) ? data : (data.attendance || []))
      }
    } catch {}
  }

  const getLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          )
          const data = await res.json()
          if (data.display_name) address = data.display_name
        } catch {}
        setLocation({ lat, lng, address })
      },
      () => setLocError('Gagal mendapatkan lokasi. Pastikan GPS aktif.')
    )
  }

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setStep('camera')
    } catch {
      setError('Tidak bisa mengakses kamera. Izinkan akses kamera di browser.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const flipCamera = async () => {
    stopCamera()
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {}
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const W = video.videoWidth || 1280
    const H = video.videoHeight || 720
    canvas.width = W
    canvas.height = H

    const ctx = canvas.getContext('2d')!
    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(W, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, W, H)
    if (facingMode === 'user') ctx.setTransform(1, 0, 0, 1, 0, 0)

    // --- Timestamp burn ---
    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const clockType = hasClockIn ? 'CLOCK OUT' : 'CLOCK IN'
    const lines = [
      `${user?.name || ''}`,
      `${dateStr}  ${timeStr}`,
      `${clockType}`,
      location ? location.address.slice(0, 60) + (location.address.length > 60 ? '…' : '') : '',
    ].filter(Boolean)

    const fontSize = Math.max(16, Math.round(W * 0.022))
    ctx.font = `bold ${fontSize}px monospace`
    const padding = 12
    const lineH = fontSize + 6
    const boxH = lines.length * lineH + padding * 2
    const boxY = H - boxH - 10

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(10, boxY, W - 20, boxH)

    // Text
    ctx.fillStyle = '#ffffff'
    lines.forEach((line, i) => {
      ctx.fillText(line, 10 + padding, boxY + padding + fontSize + i * lineH)
    })

    canvas.toBlob(blob => {
      if (!blob) return
      setCapturedBlob(blob)
      setPreviewUrl(URL.createObjectURL(blob))
      stopCamera()
      setStep('preview')
    }, 'image/jpeg', 0.88)
  }

  const retake = () => {
    setPreviewUrl('')
    setCapturedBlob(null)
    startCamera()
  }

  const submit = async () => {
    if (!capturedBlob || !location) return
    setStep('submitting')
    setError('')

    const clockType = hasClockIn ? 'CLOCK_OUT' : 'CLOCK_IN'
    const form = new FormData()
    form.append('type', clockType)
    form.append('latitude', String(location.lat))
    form.append('longitude', String(location.lng))
    form.append('address', location.address)
    form.append('photo', capturedBlob, 'selfie.jpg')

    try {
      const res = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal submit')
      await fetchToday()
      setStep('done')
    } catch (e: any) {
      setError(e.message)
      setStep('preview')
    }
  }

  const hasClockIn = todayAttendance.some(a => a.type === 'CLOCK_IN')
  const hasClockOut = todayAttendance.some(a => a.type === 'CLOCK_OUT')
  const clockIn = todayAttendance.find(a => a.type === 'CLOCK_IN')
  const clockOut = todayAttendance.find(a => a.type === 'CLOCK_OUT')

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">Absensi</h1>
          <p className="text-xs text-gray-500">{user?.name}</p>
        </div>
        <button onClick={() => { logout(); router.push('/login') }} className="p-2 text-gray-500">
          <LogOut size={20} />
        </button>
      </header>

      <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {/* Today status */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Clock size={16} /> Status Hari Ini
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg p-3 ${clockIn ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="text-xs text-gray-500">Clock In</div>
              <div className={`font-bold text-lg ${clockIn ? 'text-green-700' : 'text-gray-400'}`}>
                {clockIn ? formatTime(clockIn.createdAt) : '--:--'}
              </div>
              {clockIn?.photo && (
                <img src={clockIn.photo} className="mt-2 w-full h-16 object-cover rounded" />
              )}
            </div>
            <div className={`rounded-lg p-3 ${clockOut ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="text-xs text-gray-500">Clock Out</div>
              <div className={`font-bold text-lg ${clockOut ? 'text-blue-700' : 'text-gray-400'}`}>
                {clockOut ? formatTime(clockOut.createdAt) : '--:--'}
              </div>
              {clockOut?.photo && (
                <img src={clockOut.photo} className="mt-2 w-full h-16 object-cover rounded" />
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              {location
                ? <span className="text-gray-700">{location.address}</span>
                : locError
                  ? <span className="text-red-500">{locError}</span>
                  : <span className="text-gray-400">Mendapatkan lokasi...</span>
              }
            </div>
          </div>
          {locError && (
            <button onClick={getLocation} className="mt-2 text-xs text-blue-600 underline">Coba lagi</button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Camera / Preview / Done */}
        {step === 'idle' && !hasClockOut && (
          <button
            onClick={startCamera}
            disabled={!location}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Camera size={20} />
            {hasClockIn ? 'Clock Out — Ambil Foto' : 'Clock In — Ambil Foto'}
          </button>
        )}

        {hasClockOut && step !== 'done' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700 font-medium">
            <CheckCircle className="mx-auto mb-2" size={32} />
            Absensi hari ini sudah lengkap!
          </div>
        )}

        {step === 'camera' && (
          <div className="bg-black rounded-xl overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6">
              <button onClick={flipCamera} className="bg-white/20 text-white p-3 rounded-full">
                <RotateCcw size={20} />
              </button>
              <button
                onClick={capturePhoto}
                className="bg-white w-16 h-16 rounded-full border-4 border-blue-500 shadow-lg"
              />
              <button onClick={() => { stopCamera(); setStep('idle') }} className="bg-white/20 text-white p-3 rounded-full text-sm">
                Batal
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && previewUrl && (
          <div className="space-y-3">
            <img src={previewUrl} className="w-full rounded-xl shadow" alt="Preview" />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={retake} className="py-3 border border-gray-300 rounded-xl text-gray-700 font-medium flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Ulangi
              </button>
              <button onClick={submit} className="py-3 bg-blue-600 text-white rounded-xl font-semibold">
                {hasClockIn ? 'Clock Out' : 'Clock In'}
              </button>
            </div>
          </div>
        )}

        {step === 'submitting' && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
            Menyimpan absensi...
          </div>
        )}

        {step === 'done' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="mx-auto mb-2 text-green-600" size={40} />
            <div className="font-bold text-green-700 text-lg">
              {hasClockIn && !hasClockOut ? 'Clock In Berhasil!' : 'Clock Out Berhasil!'}
            </div>
            <button onClick={() => setStep('idle')} className="mt-4 text-sm text-blue-600 underline">
              Lihat status
            </button>
          </div>
        )}
      </div>

      {/* Hidden canvas for photo processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
