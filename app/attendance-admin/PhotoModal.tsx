'use client'

import { X, Download, MapPin, Clock, User } from 'lucide-react'
import { useEffect } from 'react'

interface PhotoModalProps {
  isOpen: boolean
  onClose: () => void
  photoUrl: string
  metadata: {
    userName: string
    userNrp?: string
    type: 'CLOCK_IN' | 'CLOCK_OUT'
    timestamp: string
    address?: string
    latitude?: number
    longitude?: number
  }
}

export default function PhotoModal({ isOpen, onClose, photoUrl, metadata }: PhotoModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleDownload = async () => {
    try {
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-${metadata.userName}-${metadata.type}-${new Date(metadata.timestamp).getTime()}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'medium'
    })
  }

  const openInGoogleMaps = () => {
    if (metadata.latitude && metadata.longitude) {
      window.open(`https://www.google.com/maps?q=${metadata.latitude},${metadata.longitude}`, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded text-sm font-medium ${
              metadata.type === 'CLOCK_IN'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {metadata.type === 'CLOCK_IN' ? 'Clock In' : 'Clock Out'}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{metadata.userName}</span>
              {metadata.userNrp && <span className="ml-2 text-blue-600">NRP: {metadata.userNrp}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Download Photo"
            >
              <Download size={20} className="text-gray-700" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Photo */}
          <div className="flex-1 bg-gray-900 flex items-center justify-center p-4 lg:p-8">
            <img
              src={photoUrl}
              alt={`${metadata.type} photo`}
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
              onClick={(e) => {
                const img = e.target as HTMLImageElement
                if (img.style.transform === 'scale(2)') {
                  img.style.transform = 'scale(1)'
                  img.style.cursor = 'zoom-in'
                } else {
                  img.style.transform = 'scale(2)'
                  img.style.cursor = 'zoom-out'
                }
              }}
              style={{ cursor: 'zoom-in', transition: 'transform 0.3s ease' }}
            />
          </div>

          {/* Metadata */}
          <div className="w-full lg:w-80 p-6 bg-white border-l border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo Details</h3>

            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-start gap-3">
                <User size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase">Employee</div>
                  <div className="text-sm font-medium text-gray-900">{metadata.userName}</div>
                  {metadata.userNrp && (
                    <div className="text-xs text-blue-600 mt-1">NRP: {metadata.userNrp}</div>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase">Timestamp</div>
                  <div className="text-sm text-gray-900">{formatDateTime(metadata.timestamp)}</div>
                </div>
              </div>

              {/* Location */}
              {metadata.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase">Location</div>
                    <div className="text-sm text-gray-900">{metadata.address}</div>
                  </div>
                </div>
              )}

              {/* Coordinates */}
              {metadata.latitude && metadata.longitude && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 uppercase mb-2">GPS Coordinates</div>
                  <div className="text-sm text-gray-700 font-mono mb-2">
                    <div>Lat: {metadata.latitude.toFixed(6)}</div>
                    <div>Long: {metadata.longitude.toFixed(6)}</div>
                  </div>
                  <button
                    onClick={openInGoogleMaps}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin size={16} />
                    Open in Google Maps
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
