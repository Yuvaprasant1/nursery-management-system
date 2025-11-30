/**
 * Loading Manager
 * 
 * A singleton that manages global loading state for API requests.
 * This allows axios interceptors (which run outside React context) 
 * to trigger loading states that the LoadingContext can observe.
 */

type LoadingListener = (isLoading: boolean) => void

class LoadingManager {
  private listeners: Set<LoadingListener> = new Set()
  private requestCount = 0

  /**
   * Subscribe to loading state changes
   */
  subscribe(listener: LoadingListener): () => void {
    this.listeners.add(listener)
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Start loading (increment request count)
   */
  startLoading(): void {
    this.requestCount++
    if (this.requestCount === 1) {
      this.notifyListeners(true)
    }
  }

  /**
   * Stop loading (decrement request count)
   */
  stopLoading(): void {
    this.requestCount = Math.max(0, this.requestCount - 1)
    if (this.requestCount === 0) {
      this.notifyListeners(false)
    }
  }

  /**
   * Get current loading state
   */
  isLoading(): boolean {
    return this.requestCount > 0
  }

  /**
   * Get current request count
   */
  getRequestCount(): number {
    return this.requestCount
  }

  /**
   * Notify all listeners of loading state change
   */
  private notifyListeners(isLoading: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(isLoading)
      } catch (error) {
        console.error('Error in loading listener:', error)
      }
    })
  }

  /**
   * Reset loading state (useful for error recovery)
   */
  reset(): void {
    this.requestCount = 0
    this.notifyListeners(false)
  }
}

// Export singleton instance
export const loadingManager = new LoadingManager()

