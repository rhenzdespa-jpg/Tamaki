import { useState, useCallback, useRef, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import { MdSearch, MdBookmark, MdBookmarkBorder, MdMyLocation, MdClose, MdAttachMoney } from 'react-icons/md'
import toast from 'react-hot-toast'

const MAPS_LIBRARIES: ('places')[] = ['places']

type PlaceResult = {
  place_id: string
  name: string
  vicinity: string
  geometry: { location: google.maps.LatLng }
  rating?: number
  price_level?: number
  opening_hours?: { isOpen?: () => boolean }
  photos?: { getUrl: (opts: object) => string }[]
  types?: string[]
}

const BUDGET_CATEGORIES = [
  { label: 'Lugaw/Goto', query: 'lugaw goto congee', emoji: '🍚', color: '#FF8A80' },
  { label: 'Carinderia', query: 'carinderia turo turo Filipino food', emoji: '🍛', color: '#FFB74D' },
  { label: 'Street Food', query: 'street food fishball barbecue', emoji: '🍢', color: '#81C784' },
  { label: 'Merienda', query: 'merienda snacks cheap cafe', emoji: '☕', color: '#64B5F6' },
  { label: 'Siomai/Dimsum', query: 'siomai dimsum cheap', emoji: '🥟', color: '#BA68C8' },
]

const PRICE_LABELS = ['Free', '₱1-50', '₱51-100', '₱101-200', 'Expensive']

export default function MapPage() {
  const { profile } = useAuth()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: MAPS_LIBRARIES,
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [userLocation, setUserLocation] = useState({ lat: 14.5995, lng: 120.9842 }) // Manila default
  const [places, setPlaces] = useState<PlaceResult[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState(0)
  const [searching, setSearching] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('couple_connections')
      .select('id')
      .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
      .single()
      .then(({ data }) => { if (data) setCoupleId(data.id) })

    supabase
      .from('saved_places')
      .select('place_id')
      .eq('saved_by', profile.id)
      .then(({ data }) => {
        if (data) setSavedPlaceIds(new Set(data.map((p: { place_id: string }) => p.place_id)))
      })
  }, [profile?.id])

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
    serviceRef.current = new google.maps.places.PlacesService(mapInstance)
    // Auto-search on load
    searchNearby(mapInstance, BUDGET_CATEGORIES[0].query)
  }, [])

  const searchNearby = (mapInstance: google.maps.Map | null, query: string) => {
    const service = mapInstance ? new google.maps.places.PlacesService(mapInstance) : serviceRef.current
    if (!service) return

    setSearching(true)
    setPlaces([])

    service.nearbySearch(
      {
        location: userLocation,
        radius: 2000,
        keyword: query,
        type: 'restaurant',
      },
      (results, status) => {
        setSearching(false)
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const filtered = results.filter(r => (r.price_level ?? 0) <= 2)
          setPlaces(filtered.slice(0, 20) as PlaceResult[])
        }
      }
    )
  }

  const handleCategoryChange = (idx: number) => {
    setActiveCategory(idx)
    setSelectedPlace(null)
    searchNearby(map, BUDGET_CATEGORIES[idx].query)
  }

  const centerOnUser = () => {
    if (map) {
      map.panTo(userLocation)
      map.setZoom(15)
    }
  }

  const toggleSave = async (place: PlaceResult) => {
    if (!profile) return

    if (savedPlaceIds.has(place.place_id)) {
      await supabase.from('saved_places').delete()
        .eq('saved_by', profile.id)
        .eq('place_id', place.place_id)
      const newSet = new Set(savedPlaceIds)
      newSet.delete(place.place_id)
      setSavedPlaceIds(newSet)
      toast('Removed from saved spots', { icon: '🗑️' })
    } else {
      await supabase.from('saved_places').insert({
        saved_by: profile.id,
        couple_id: coupleId,
        place_id: place.place_id,
        place_name: place.name,
        place_address: place.vicinity,
        place_lat: place.geometry.location.lat(),
        place_lng: place.geometry.location.lng(),
        avg_price: place.price_level ? place.price_level * 50 : 50,
      })
      const newSet = new Set(savedPlaceIds)
      newSet.add(place.place_id)
      setSavedPlaceIds(newSet)
      toast.success('Saved to your spots! 💕')
    }
  }

  const getPriceText = (level?: number) => {
    if (level === undefined) return '₱ Budget'
    return PRICE_LABELS[level] || '₱ Affordable'
  }

  const getMarkerColor = (priceLevel?: number): string => {
    const colors = ['#69F0AE', '#FF6B9D', '#FFB74D', '#FF5252', '#9E9E9E']
    return colors[priceLevel ?? 1] || '#FF6B9D'
  }

  if (!apiKey || apiKey === 'your_google_maps_api_key') {
    return (
      <Layout title="Food Map 🗺️">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="font-display text-xl text-bubblegum mb-2">Map Setup Needed</h3>
          <p className="text-gray-500 text-sm font-medium px-4">
            Add your Google Maps API key to <code className="bg-pink-50 px-1 rounded">.env.local</code> to enable the food map feature!
          </p>
          <p className="text-gray-400 text-xs mt-2 font-medium">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Cheap Food Map 🍜">
      <div className="-mx-4">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
          {BUDGET_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => handleCategoryChange(i)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                activeCategory === i
                  ? 'text-white border-transparent'
                  : 'bg-white border-gray-100 text-gray-500'
              }`}
              style={activeCategory === i ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="relative mx-4 rounded-3xl overflow-hidden shadow-soft" style={{ height: '45vh' }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={userLocation}
              zoom={15}
              onLoad={onMapLoad}
              options={{
                disableDefaultUI: true,
                styles: [
                  { featureType: 'all', elementType: 'geometry', stylers: [{ saturation: -20 }] },
                  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#B3E5FC' }] },
                  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
                  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#C8F0D5' }] },
                ]
              }}
            >
              {/* User marker */}
              <Marker
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#FF6B9D',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 3,
                }}
              />

              {/* Place markers */}
              {places.map((place) => (
                <Marker
                  key={place.place_id}
                  position={place.geometry.location}
                  onClick={() => setSelectedPlace(place)}
                  icon={{
                    path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    scale: 7,
                    fillColor: getMarkerColor(place.price_level),
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                  }}
                />
              ))}

              {/* Info Window */}
              {selectedPlace && (
                <InfoWindow
                  position={selectedPlace.geometry.location}
                  onCloseClick={() => setSelectedPlace(null)}
                >
                  <div style={{ fontFamily: 'Nunito, sans-serif', maxWidth: 200 }}>
                    <p style={{ fontWeight: 900, fontSize: 14, margin: '0 0 4px', color: '#FF6B9D' }}>
                      {selectedPlace.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#888', margin: '0 0 4px' }}>{selectedPlace.vicinity}</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#2ECC71' }}>
                      {getPriceText(selectedPlace.price_level)}
                    </p>
                    {selectedPlace.rating && (
                      <p style={{ fontSize: 11, color: '#FFB74D' }}>⭐ {selectedPlace.rating}</p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="h-full flex items-center justify-center bg-pink-50">
              <div className="text-4xl animate-bounce">🗺️</div>
            </div>
          )}

          {/* Center button */}
          <button
            onClick={centerOnUser}
            className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-soft flex items-center justify-center border border-pink-100"
          >
            <MdMyLocation size={20} className="text-bubblegum" />
          </button>

          {searching && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-1.5 shadow-soft border border-pink-100 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-bubblegum border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-gray-600">Finding cheap spots...</span>
            </div>
          )}
        </div>

        {/* Results list */}
        <div className="px-4 mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-gray-700">
              {places.length > 0 ? `${places.length} spots found! 🎉` : 'No results yet'}
            </h3>
            <span className="text-xs font-bold text-gray-400">within 2km</span>
          </div>

          {places.map((place, i) => (
            <motion.div
              key={place.place_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card-cute flex items-center gap-3"
              onClick={() => {
                setSelectedPlace(place)
                map?.panTo(place.geometry.location)
                map?.setZoom(17)
              }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: `${getMarkerColor(place.price_level)}30` }}
              >
                {BUDGET_CATEGORIES[activeCategory].emoji}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-700 text-sm truncate">{place.name}</p>
                <p className="text-gray-400 text-xs truncate">{place.vicinity}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold" style={{ color: getMarkerColor(place.price_level) }}>
                    {getPriceText(place.price_level)}
                  </span>
                  {place.rating && (
                    <span className="text-xs text-yellow-500 font-bold">⭐ {place.rating}</span>
                  )}
                  {place.opening_hours?.isOpen?.() === true && (
                    <span className="text-xs font-bold text-green-500">● Open</span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); toggleSave(place) }}
                className="p-2 rounded-full hover:bg-pink-50 transition-colors"
              >
                {savedPlaceIds.has(place.place_id) ? (
                  <MdBookmark size={22} className="text-bubblegum" />
                ) : (
                  <MdBookmarkBorder size={22} className="text-gray-300" />
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
