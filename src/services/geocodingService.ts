/**
 * Geocoding Service
 * Converts addresses to coordinates using OpenStreetMap Nominatim API
 * Includes validation and error handling for accurate location mapping
 */

interface GeocodingResult {
  lat: number
  lng: number
  displayName: string
  address: {
    city?: string
    state?: string
    country?: string
  }
  boundingBox?: [number, number, number, number] // [south, north, west, east]
}

interface GeocodingError {
  success: false
  error: string
  originalAddress: string
}

interface GeocodingSuccess {
  success: true
  data: GeocodingResult
}

type GeocodingResponse = GeocodingSuccess | GeocodingError

// City coordinates database for common Indian cities
const CITY_COORDINATES: Record<string, GeocodingResult> = {
  'chennai': {
    lat: 13.0827,
    lng: 80.2707,
    displayName: 'Chennai, Tamil Nadu, India',
    address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    boundingBox: [12.8342, 13.2847, 80.0955, 80.2707]
  },
  'hyderabad': {
    lat: 17.3850,
    lng: 78.4867,
    displayName: 'Hyderabad, Telangana, India',
    address: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    boundingBox: [17.2403, 17.5647, 78.2577, 78.6343]
  },
  'hyderabad hitech city': {
    lat: 17.4435,
    lng: 78.3772,
    displayName: 'Hitech City, Hyderabad, Telangana, India',
    address: { city: 'Hyderabad', state: 'Telangana', country: 'India' }
  },
  'hyderabad - hitech city': {
    lat: 17.4435,
    lng: 78.3772,
    displayName: 'Hitech City, Hyderabad, Telangana, India',
    address: { city: 'Hyderabad', state: 'Telangana', country: 'India' }
  },
  'bangalore': {
    lat: 12.9716,
    lng: 77.5946,
    displayName: 'Bangalore, Karnataka, India',
    address: { city: 'Bangalore', state: 'Karnataka', country: 'India' }
  },
  'mumbai': {
    lat: 19.0760,
    lng: 72.8777,
    displayName: 'Mumbai, Maharashtra, India',
    address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }
  },
  'delhi': {
    lat: 28.7041,
    lng: 77.1025,
    displayName: 'Delhi, India',
    address: { city: 'Delhi', state: 'Delhi', country: 'India' }
  },
  'pune': {
    lat: 18.5204,
    lng: 73.8567,
    displayName: 'Pune, Maharashtra, India',
    address: { city: 'Pune', state: 'Maharashtra', country: 'India' }
  },
  'kolkata': {
    lat: 22.5726,
    lng: 88.3639,
    displayName: 'Kolkata, West Bengal, India',
    address: { city: 'Kolkata', state: 'West Bengal', country: 'India' }
  }
}

/**
 * Normalize address string for lookup
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/[,.-]/g, ' ')
    .replace(/\s+/g, ' ')
}

/**
 * Check if address is in local database
 */
function getFromLocalDatabase(address: string): GeocodingResult | null {
  const normalized = normalizeAddress(address)
  
  // Direct match
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized]
  }
  
  // Partial match
  for (const [key, value] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value
    }
  }
  
  return null
}

/**
 * Geocode address using OpenStreetMap Nominatim API
 */
async function geocodeWithNominatim(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FleetManagementSystem/1.0'
      }
    })
    
    if (!response.ok) {
      console.error('Nominatim API error:', response.statusText)
      return null
    }
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      const result = data[0]
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        address: {
          city: result.address?.city || result.address?.town || result.address?.village,
          state: result.address?.state,
          country: result.address?.country
        },
        boundingBox: result.boundingbox ? [
          parseFloat(result.boundingbox[0]),
          parseFloat(result.boundingbox[1]),
          parseFloat(result.boundingbox[2]),
          parseFloat(result.boundingbox[3])
        ] : undefined
      }
    }
    
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Main geocoding function with fallback strategy
 */
export async function geocodeAddress(address: string): Promise<GeocodingResponse> {
  if (!address || address.trim() === '') {
    return {
      success: false,
      error: 'Address is empty',
      originalAddress: address
    }
  }
  
  console.log(`🔍 Geocoding address: "${address}"`)
  
  // Strategy 1: Check local database first (instant)
  const localResult = getFromLocalDatabase(address)
  if (localResult) {
    console.log(`✅ Found in local database: [${localResult.lat}, ${localResult.lng}]`)
    return {
      success: true,
      data: localResult
    }
  }
  
  // Strategy 2: Use Nominatim API
  console.log('🌐 Querying Nominatim API...')
  const nominatimResult = await geocodeWithNominatim(address)
  if (nominatimResult) {
    console.log(`✅ Geocoded via Nominatim: [${nominatimResult.lat}, ${nominatimResult.lng}]`)
    return {
      success: true,
      data: nominatimResult
    }
  }
  
  // Strategy 3: Fallback - return error
  console.error(`❌ Failed to geocode address: "${address}"`)
  return {
    success: false,
    error: 'Could not geocode address. Please provide a more specific location.',
    originalAddress: address
  }
}

/**
 * Batch geocode multiple addresses
 */
export async function geocodeBatch(addresses: string[]): Promise<Map<string, GeocodingResponse>> {
  const results = new Map<string, GeocodingResponse>()
  
  for (const address of addresses) {
    const result = await geocodeAddress(address)
    results.set(address, result)
    
    // Rate limiting for Nominatim (1 request per second)
    if (addresses.indexOf(address) < addresses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Validate if coordinates are within expected bounds
 */
export function validateCoordinates(
  lat: number,
  lng: number,
  expectedCity?: string
): { valid: boolean; warning?: string } {
  // Check if coordinates are valid numbers
  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, warning: 'Invalid coordinates' }
  }
  
  // Check if coordinates are within India's bounds
  const INDIA_BOUNDS = {
    north: 35.5,
    south: 6.5,
    east: 97.5,
    west: 68.0
  }
  
  if (
    lat < INDIA_BOUNDS.south ||
    lat > INDIA_BOUNDS.north ||
    lng < INDIA_BOUNDS.west ||
    lng > INDIA_BOUNDS.east
  ) {
    return {
      valid: false,
      warning: 'Coordinates are outside India. Please verify the address.'
    }
  }
  
  // If expected city is provided, check proximity
  if (expectedCity) {
    const cityCoords = getFromLocalDatabase(expectedCity)
    if (cityCoords) {
      const distance = calculateDistance(lat, lng, cityCoords.lat, cityCoords.lng)
      if (distance > 100) { // More than 100km away
        return {
          valid: true,
          warning: `Location is ${distance}km from ${expectedCity}. Please verify.`
        }
      }
    }
  }
  
  return { valid: true }
}

/**
 * Get map bounds to fit multiple locations
 */
export function getMapBounds(locations: Array<{ lat: number; lng: number }>) {
  if (locations.length === 0) {
    return null
  }
  
  const lats = locations.map(l => l.lat)
  const lngs = locations.map(l => l.lng)
  
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  }
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

/**
 * Reverse geocode (coordinates to address)
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FleetManagementSystem/1.0'
      }
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.display_name || null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

export default {
  geocodeAddress,
  geocodeBatch,
  calculateDistance,
  validateCoordinates,
  getMapBounds,
  formatCoordinates,
  reverseGeocode
}
