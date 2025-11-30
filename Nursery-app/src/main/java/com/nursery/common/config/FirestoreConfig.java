package com.nursery.common.config;

import com.nursery.common.firestore.retry.FirestoreRetryPolicy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Firestore configuration class
 * Provides FirestoreRetryPolicy and timeout configuration beans
 * Note: Firestore client bean is created in FirebaseConfig with FirestoreOptions
 */
@Slf4j
@Configuration
public class FirestoreConfig {

    @Value("${firestore.retry.max-attempts:3}")
    private int maxRetryAttempts;
    
    @Value("${firestore.retry.initial-backoff-ms:100}")
    private long initialBackoffMs;
    
    @Value("${firestore.retry.backoff-multiplier:2.0}")
    private double backoffMultiplier;
    
    @Value("${firestore.retry.max-backoff-ms:1000}")
    private long maxBackoffMs;

    @Value("${firestore.timeout.seconds:30}")
    private int timeoutSeconds;

    /**
     * Firestore retry policy bean
     * Configures retry behavior for Firestore operations
     */
    @Bean
    public FirestoreRetryPolicy firestoreRetryPolicy() {
        log.info("Creating FirestoreRetryPolicy with maxAttempts={}, initialBackoff={}ms, multiplier={}, maxBackoff={}ms",
            maxRetryAttempts, initialBackoffMs, backoffMultiplier, maxBackoffMs);
        return new FirestoreRetryPolicy(maxRetryAttempts, initialBackoffMs, backoffMultiplier, maxBackoffMs);
    }

    /**
     * Firestore timeout duration bean
     * Can be injected into repositories and services for timeout handling
     */
    @Bean
    public Duration firestoreTimeout() {
        Duration timeout = Duration.ofSeconds(timeoutSeconds);
        log.info("Firestore timeout configured: {} seconds", timeoutSeconds);
        return timeout;
    }
}

