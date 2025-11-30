/**
 * Navigation utility for Next.js
 * Can be used from both React components and non-React contexts (like API interceptors)
 */

let routerInstance: any = null

/**
 * Set the router instance (called from React components)
 */
export function setRouter(router: any) {
  routerInstance = router
}

/**
 * Navigate to a route
 * Uses Next.js router if available, otherwise falls back to window.location
 */
export function navigate(path: string, replace = false) {
  if (typeof window === 'undefined') {
    return // Server-side, do nothing
  }

  if (routerInstance) {
    // Use Next.js router if available
    if (replace) {
      routerInstance.replace(path)
    } else {
      routerInstance.push(path)
    }
  } else {
    // Fallback to window.location for non-React contexts
    if (replace) {
      window.history.replaceState({}, '', path)
      window.location.href = path
    } else {
      window.location.href = path
    }
  }
}

/**
 * Navigate to login page
 */
export function navigateToLogin() {
  navigate('/login', true)
}

/**
 * Navigate to home/dashboard
 */
export function navigateToHome() {
  navigate('/', true)
}

