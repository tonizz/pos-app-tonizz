'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapPin } from 'lucide-react'

// Fix for default marker icons in react-leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface SalesLocation {
  user: {
    id: string
    name: string
    email: string
  }
  location: {
    latitude: number
    longitude: number
    accuracy: number | null
    createdAt: string
  } | null
  attendance: {
    clockIn: any
    clockOut: any
    status: 'CLOCKED_IN' | 'CLOCKED_OUT' | 'NOT_CLOCKED_IN'
  }
}

interface MapComponentProps {
  salesLocations: SalesLocation[]
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
  formatTime: (dateString: string) => string
  formatLastUpdate: (dateString: string) => string
}

export default function MapComponent({
  salesLocations,
  getStatusColor,
  getStatusText,
  formatTime,
  formatLastUpdate
}: MapComponentProps) {
  const defaultCenter: [number, number] = [-6.2088, 106.8456] // Jakarta
  const activeSales = salesLocations.filter(s => s.location)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <MapPin className="text-blue-600" size={20} />
          <h2 className="font-semibold text-gray-900">Live Location Map</h2>
          <span className="ml-auto text-xs text-gray-500">Auto-refresh: 30s</span>
        </div>
      </div>
      <div className="h-[600px]">
        <MapContainer
          center={activeSales[0]?.location ? [activeSales[0].location.latitude, activeSales[0].location.longitude] : defaultCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {activeSales.map((sales) => (
            sales.location && (
              <Marker
                key={sales.user.id}
                position={[sales.location.latitude, sales.location.longitude]}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <div className="font-semibold text-gray-900">{sales.user.name}</div>
                    <div className="text-sm text-gray-600">{sales.user.email}</div>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded border ${getStatusColor(sales.attendance.status)}`}>
                        {getStatusText(sales.attendance.status)}
                      </span>
                    </div>
                    {sales.attendance.clockIn && (
                      <div className="text-xs text-gray-600 mt-2">
                        <div className="font-medium">Clock In: {formatTime(sales.attendance.clockIn.createdAt)}</div>
                        {sales.attendance.clockIn.address && (
                          <div className="text-gray-500 mt-1">{sales.attendance.clockIn.address}</div>
                        )}
                      </div>
                    )}
                    {sales.attendance.clockOut && (
                      <div className="text-xs text-gray-600 mt-1">
                        <div className="font-medium">Clock Out: {formatTime(sales.attendance.clockOut.createdAt)}</div>
                        {sales.attendance.clockOut.address && (
                          <div className="text-gray-500 mt-1">{sales.attendance.clockOut.address}</div>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                      Last update: {formatLastUpdate(sales.location.createdAt)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
