'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuthStore } from '@/app/store/authStore'
import { FeatureCode, FREE_FEATURES, LicenseInfo, hasFeature } from '@/lib/license'

interface LicenseContextValue {
  licenseInfo: LicenseInfo | null
  licenseKey: string | null
  loading: boolean
  hasFeature: (feature: FeatureCode) => boolean
  refresh: () => void
}

const LicenseContext = createContext<LicenseContextValue>({
  licenseInfo: null,
  licenseKey: null,
  loading: true,
  hasFeature: (f) => FREE_FEATURES.includes(f),
  refresh: () => {},
})

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { token, _hasHydrated } = useAuthStore()
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null)
  const [licenseKey, setLicenseKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchLicense = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/license', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLicenseKey(data.licenseKey)
        setLicenseInfo(data.licenseInfo)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (_hasHydrated) fetchLicense()
  }, [_hasHydrated, token])

  const checkFeature = (feature: FeatureCode): boolean => {
    return hasFeature(licenseInfo, feature)
  }

  return (
    <LicenseContext.Provider value={{ licenseInfo, licenseKey, loading, hasFeature: checkFeature, refresh: fetchLicense }}>
      {children}
    </LicenseContext.Provider>
  )
}

export function useLicense() {
  return useContext(LicenseContext)
}
