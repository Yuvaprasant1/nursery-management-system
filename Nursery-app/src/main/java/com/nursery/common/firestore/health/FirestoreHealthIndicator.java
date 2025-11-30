package com.nursery.common.firestore.health;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

/**
 * Health indicator for Firestore connection
 * Verifies connectivity by performing a simple read operation
 * Only active if Spring Boot Actuator is on the classpath
 * 
 * To use this, add spring-boot-starter-actuator to your dependencies:
 * implementation 'org.springframework.boot:spring-boot-starter-actuator'
 */
@Slf4j
@Component
@ConditionalOnClass(name = "org.springframework.boot.actuate.health.HealthIndicator")
public class FirestoreHealthIndicator {
    
    private static final String HEALTH_CHECK_COLLECTION = "__health_check__";
    private static final Duration HEALTH_CHECK_TIMEOUT = Duration.ofSeconds(5);
    private static final long HEALTH_CHECK_CACHE_TTL_MS = 30_000; // 30 seconds
    
    private final Firestore firestore;
    private volatile HealthStatus cachedHealth;
    private volatile long lastHealthCheckTime;
    
    public FirestoreHealthIndicator(Firestore firestore) {
        this.firestore = firestore;
        log.info("FirestoreHealthIndicator initialized (Actuator health check will be available if actuator is on classpath)");
    }
    
    /**
     * Perform health check and return status
     * Can be called manually or by Actuator if available
     */
    public HealthStatus checkHealth() {
        // Use cached health status if still valid
        long now = System.currentTimeMillis();
        if (cachedHealth != null && (now - lastHealthCheckTime) < HEALTH_CHECK_CACHE_TTL_MS) {
            return cachedHealth;
        }
        
        // Perform health check
        HealthStatus health = performHealthCheck();
        cachedHealth = health;
        lastHealthCheckTime = now;
        
        return health;
    }
    
    private HealthStatus performHealthCheck() {
        Instant start = Instant.now();
        try {
            // Perform a simple query to verify connectivity
            // Using a non-existent collection to minimize impact
            Query query = firestore.collection(HEALTH_CHECK_COLLECTION).limit(1);
            
            // Execute with timeout
            try {
                query.get().get(HEALTH_CHECK_TIMEOUT.toSeconds(), TimeUnit.SECONDS);
            } catch (java.util.concurrent.TimeoutException e) {
                log.warn("Firestore health check timed out after {} seconds", HEALTH_CHECK_TIMEOUT.toSeconds());
                return new HealthStatus(false, "Connection timeout", 
                    Duration.between(start, Instant.now()).toMillis());
            }
            
            Duration duration = Duration.between(start, Instant.now());
            log.debug("Firestore health check passed in {}ms", duration.toMillis());
            
            return new HealthStatus(true, "Connected", duration.toMillis());
                
        } catch (Exception e) {
            Duration duration = Duration.between(start, Instant.now());
            log.error("Firestore health check failed", e);
            
            return new HealthStatus(false, e.getClass().getSimpleName() + ": " + e.getMessage(), 
                duration.toMillis());
        }
    }
    
    /**
     * Simple health status class
     */
    public static class HealthStatus {
        private final boolean up;
        private final String message;
        private final long durationMs;
        
        public HealthStatus(boolean up, String message, long durationMs) {
            this.up = up;
            this.message = message;
            this.durationMs = durationMs;
        }
        
        public boolean isUp() {
            return up;
        }
        
        public String getMessage() {
            return message;
        }
        
        public long getDurationMs() {
            return durationMs;
        }
    }
}

