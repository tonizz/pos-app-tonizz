'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Camera, X } from 'lucide-react'

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const hasScannedRef = useRef(false)
  const lastScannedRef = useRef<string>('')

  useEffect(() => {
    if (isOpen) {
      hasScannedRef.current = false
      lastScannedRef.current = ''
      startScanning()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isOpen])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)

      const codeReader = new BrowserMultiFormatReader()
      readerRef.current = codeReader

      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices()

      if (videoInputDevices.length === 0) {
        throw new Error('No camera found')
      }

      // Prefer back camera on mobile
      const backCamera = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear')
      )
      const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId

      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result && !hasScannedRef.current) {
            const barcode = result.getText()

            // Prevent duplicate scans
            if (barcode !== lastScannedRef.current) {
              hasScannedRef.current = true
              lastScannedRef.current = barcode
              onScan(barcode)

              // Stop scanning and close after successful scan
              setTimeout(() => {
                stopScanning()
                onClose()
              }, 100)
            }
          }
        }
      )
    } catch (err: any) {
      console.error('Scanner error:', err)
      setError(err.message || 'Failed to start camera')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current = null
    }

    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Camera className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-white">Scan Barcode</h2>
          </div>
          <button
            onClick={() => {
              stopScanning()
              onClose()
            }}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error ? (
            <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={startScanning}
                className="mt-3 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-4 border-blue-500 rounded-lg w-64 h-32 animate-pulse"></div>
                  </div>
                )}
              </div>
              <p className="text-center text-gray-400 text-sm">
                Position the barcode within the frame
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-700">
          <button
            onClick={() => {
              stopScanning()
              onClose()
            }}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
