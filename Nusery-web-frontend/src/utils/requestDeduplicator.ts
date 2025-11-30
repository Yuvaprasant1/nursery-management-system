/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate concurrent API requests by tracking in-flight requests
 * and returning the same promise for requests with the same key.
 * 
 * Also provides optional short-term caching of completed requests.
 */

interface CachedRequest {
  data: unknown
  timestamp: number
}

// Track in-flight requests by key
const inFlightRequests = new Map<string, Promise<unknown>>()

// Cache completed requests briefly to handle rapid re-requests
const completedRequests = new Map<string, CachedRequest>()
const CACHE_TTL = 1000 // Cache completed requests for 1 second

/**
 * Generate a stable request key from parameters
 */
export function generateRequestKey(
  method: string,
  url: string,
  params?: Record<string, unknown>,
  data?: unknown
): string {
  const parts = [method.toUpperCase(), url]
  
  if (params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&')
    parts.push(sortedParams)
  }
  
  if (data) {
    parts.push(JSON.stringify(data))
  }
  
  return parts.join('|')
}

/**
 * Deduplicate a request - returns existing promise if request with same key is in flight
 * 
 * @param key - Unique key for the request
 * @param requestFn - Function that returns the promise for the request
 * @param useCache - Whether to use short-term cache for completed requests (default: true)
 * @returns Promise that resolves with the request result
 */
export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  useCache: boolean = true
): Promise<T> {
  // Check cache first if enabled
  if (useCache) {
    const cached = completedRequests.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T
    }
  }
  
  // Check if request is already in flight
  const existingRequest = inFlightRequests.get(key)
  if (existingRequest) {
    return existingRequest as Promise<T>
  }
  
  // Create new request
  const requestPromise = requestFn()
  
  // Store in-flight request
  inFlightRequests.set(key, requestPromise)
  
  try {
    const result = await requestPromise
    
    // Cache the result if enabled
    if (useCache) {
      completedRequests.set(key, { data: result, timestamp: Date.now() })
      
      // Clean up old cache entries
      for (const [cacheKey, cacheValue] of completedRequests.entries()) {
        if (Date.now() - cacheValue.timestamp > CACHE_TTL) {
          completedRequests.delete(cacheKey)
        }
      }
    }
    
    // Remove from in-flight requests
    inFlightRequests.delete(key)
    
    return result
  } catch (error) {
    // Remove from in-flight requests on error
    inFlightRequests.delete(key)
    throw error
  }
}

/**
 * Clear all cached requests (useful for testing or manual cache invalidation)
 */
export function clearRequestCache(): void {
  inFlightRequests.clear()
  completedRequests.clear()
}

/**
 * Get current cache statistics (useful for debugging)
 */
export function getCacheStats(): {
  inFlight: number
  cached: number
} {
  return {
    inFlight: inFlightRequests.size,
    cached: completedRequests.size,
  }
}

