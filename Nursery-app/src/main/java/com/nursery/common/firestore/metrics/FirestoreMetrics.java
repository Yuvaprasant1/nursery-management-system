package com.nursery.common.firestore.metrics;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
public class FirestoreMetrics {
    
    private static final AtomicLong readOperations = new AtomicLong(0);
    private static final AtomicLong writeOperations = new AtomicLong(0);
    private static final AtomicLong failedOperations = new AtomicLong(0);
    
    public static void recordReadOperation(String collection, String operation, Duration duration) {
        readOperations.incrementAndGet();
        logOperation("READ", collection, operation, duration, null);
    }
    
    public static void recordWriteOperation(String collection, String operation, Duration duration) {
        writeOperations.incrementAndGet();
        logOperation("WRITE", collection, operation, duration, null);
    }
    
    public static void recordFailedOperation(String collection, String operation, Duration duration, Throwable error) {
        failedOperations.incrementAndGet();
        logOperation("FAILED", collection, operation, duration, error);
    }
    
    private static void logOperation(String type, String collection, String operation, Duration duration, Throwable error) {
        try (MDC.MDCCloseable ignored = MDC.putCloseable("firestore.collection", collection);
             MDC.MDCCloseable ignored2 = MDC.putCloseable("firestore.operation", operation);
             MDC.MDCCloseable ignored3 = MDC.putCloseable("firestore.type", type)) {
            
            if (error != null) {
                log.error("Firestore {} operation on {} took {}ms", type, operation, duration.toMillis(), error);
            } else {
                log.debug("Firestore {} operation on {} took {}ms", type, operation, duration.toMillis());
            }
        }
    }
    
    public static long getReadOperations() {
        return readOperations.get();
    }
    
    public static long getWriteOperations() {
        return writeOperations.get();
    }
    
    public static long getFailedOperations() {
        return failedOperations.get();
    }
    
    public static void reset() {
        readOperations.set(0);
        writeOperations.set(0);
        failedOperations.set(0);
    }
}

