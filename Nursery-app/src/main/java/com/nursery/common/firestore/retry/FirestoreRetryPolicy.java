package com.nursery.common.firestore.retry;

import com.google.api.gax.rpc.ApiException;
import com.google.api.gax.rpc.StatusCode;
import lombok.extern.slf4j.Slf4j;

import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
public class FirestoreRetryPolicy {
    
    private static final Set<StatusCode.Code> RETRYABLE_CODES = Set.of(
        StatusCode.Code.DEADLINE_EXCEEDED,
        StatusCode.Code.UNAVAILABLE,
        StatusCode.Code.RESOURCE_EXHAUSTED,
        StatusCode.Code.ABORTED
    );
    
    private final int maxAttempts;
    private final long initialBackoffMillis;
    private final double backoffMultiplier;
    private final long maxBackoffMillis;
    
    public FirestoreRetryPolicy() {
        this(3, 100, 2.0, 1000);
    }
    
    public FirestoreRetryPolicy(int maxAttempts, long initialBackoffMillis, double backoffMultiplier, long maxBackoffMillis) {
        this.maxAttempts = maxAttempts;
        this.initialBackoffMillis = initialBackoffMillis;
        this.backoffMultiplier = backoffMultiplier;
        this.maxBackoffMillis = maxBackoffMillis;
    }
    
    public boolean shouldRetry(Exception exception, int attemptNumber) {
        if (attemptNumber >= maxAttempts) {
            return false;
        }
        
        if (exception instanceof ApiException) {
            ApiException apiException = (ApiException) exception;
            StatusCode.Code code = apiException.getStatusCode().getCode();
            return RETRYABLE_CODES.contains(code);
        }
        
        // Retry on InterruptedException and ExecutionException (wrapped Firestore exceptions)
        return exception instanceof InterruptedException || 
               exception.getCause() instanceof ApiException;
    }
    
    public void waitBeforeRetry(int attemptNumber) throws InterruptedException {
        long backoffMillis = calculateBackoff(attemptNumber);
        log.debug("Retrying after {}ms (attempt {}/{})", backoffMillis, attemptNumber + 1, maxAttempts);
        Thread.sleep(backoffMillis);
    }
    
    private long calculateBackoff(int attemptNumber) {
        long backoff = (long) (initialBackoffMillis * Math.pow(backoffMultiplier, attemptNumber));
        backoff = Math.min(backoff, maxBackoffMillis);
        
        // Add jitter to prevent thundering herd
        long jitter = ThreadLocalRandom.current().nextLong(0, backoff / 4);
        return backoff + jitter;
    }
    
    public int getMaxAttempts() {
        return maxAttempts;
    }
}

