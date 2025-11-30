package com.nursery.common.firestore.transaction;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import com.nursery.common.firestore.exception.FirestoreConnectionException;
import com.nursery.common.firestore.retry.FirestoreRetryPolicy;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.concurrent.*;
import java.util.function.Function;

@Slf4j
public class FirestoreTransactionManager {
    
    private final Firestore firestore;
    private final FirestoreRetryPolicy retryPolicy;
    private final Duration timeout;
    
    public FirestoreTransactionManager(Firestore firestore, FirestoreRetryPolicy retryPolicy) {
        this(firestore, retryPolicy, Duration.ofSeconds(30));
    }
    
    public FirestoreTransactionManager(Firestore firestore, FirestoreRetryPolicy retryPolicy, Duration timeout) {
        this.firestore = firestore;
        this.retryPolicy = retryPolicy;
        this.timeout = timeout != null ? timeout : Duration.ofSeconds(30);
    }
    
    /**
     * Unwraps ExecutionException to get the original exception
     */
    private Throwable unwrapExecutionException(ExecutionException e) {
        Throwable cause = e.getCause();
        if (cause instanceof RuntimeException && cause.getCause() != null) {
            // ExecutionException -> RuntimeException -> OriginalException
            return cause.getCause();
        }
        return cause != null ? cause : e;
    }
    
    public <T> T runInTransaction(Function<Transaction, T> transactionFunction) {
        int attempt = 0;
        ExecutionException lastException = null;
        
        while (attempt < retryPolicy.getMaxAttempts()) {
            try {
                // Use CompletableFuture with timeout for transaction execution
                CompletableFuture<T> future = CompletableFuture.supplyAsync(() -> {
                    try {
                        return firestore.runTransaction((Transaction.Function<T>) transaction -> {
                            try {
                                return transactionFunction.apply(transaction);
                            } catch (RuntimeException e) {
                                // Re-throw RuntimeException as-is to preserve exception type
                                throw e;
                            } catch (Exception e) {
                                // Wrap checked exceptions in RuntimeException (required by Firestore API)
                                throw new RuntimeException(e);
                            }
                        }).get();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Transaction interrupted", e);
                    } catch (ExecutionException e) {
                        throw new RuntimeException("Transaction execution failed", e);
                    }
                });
                
                // Apply timeout to the transaction
                return future.get(timeout.toSeconds(), TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                log.warn("Transaction timed out after {} seconds (attempt {}/{})", 
                    timeout.toSeconds(), attempt + 1, retryPolicy.getMaxAttempts());
                lastException = new ExecutionException(
                    new FirestoreConnectionException(
                        String.format("Transaction timed out after %d seconds", timeout.toSeconds()), e));
                
                // Retry on timeout if we have attempts left
                if (attempt < retryPolicy.getMaxAttempts() - 1) {
                    try {
                        retryPolicy.waitBeforeRetry(attempt);
                        attempt++;
                        continue;
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Transaction retry interrupted", ie);
                    }
                } else {
                    throw new RuntimeException("Transaction timed out after " + retryPolicy.getMaxAttempts() + " attempts", e);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Transaction interrupted", e);
            } catch (ExecutionException e) {
                lastException = e;
                // Unwrap to get the original exception
                Throwable originalException = unwrapExecutionException(e);
                
                // Determine if we should retry based on the original exception
                Exception exceptionForRetry = originalException instanceof Exception 
                    ? (Exception) originalException 
                    : e;
                
                if (retryPolicy.shouldRetry(exceptionForRetry, attempt)) {
                    try {
                        retryPolicy.waitBeforeRetry(attempt);
                        attempt++;
                        continue;
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Transaction retry interrupted", ie);
                    }
                } else {
                    // Re-throw the original exception, preserving its type
                    if (originalException instanceof RuntimeException) {
                        throw (RuntimeException) originalException;
                    } else if (originalException instanceof Exception) {
                        throw new RuntimeException((Exception) originalException);
                    } else {
                        throw new RuntimeException("Transaction failed", e);
                    }
                }
            }
        }
        
        // If we exhausted retries, try to preserve the original exception
        if (lastException != null) {
            Throwable originalException = unwrapExecutionException(lastException);
            if (originalException instanceof RuntimeException) {
                throw (RuntimeException) originalException;
            }
        }
        
        throw new RuntimeException("Transaction failed after " + retryPolicy.getMaxAttempts() + " attempts", lastException);
    }
}

