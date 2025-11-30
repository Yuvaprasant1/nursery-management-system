package com.nursery.common.firestore;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.nursery.common.firestore.batch.BatchWriteResult;
import com.nursery.common.firestore.exception.*;
import com.nursery.common.firestore.metrics.FirestoreMetrics;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.common.firestore.pagination.PageResult;
import com.nursery.common.firestore.query.QueryOptions;
import com.nursery.common.firestore.retry.FirestoreRetryPolicy;
import com.nursery.common.firestore.transaction.FirestoreTransactionManager;
import com.nursery.common.firestore.validation.FirestoreValidator;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.*;
import java.util.function.Function;

@Slf4j
public abstract class BaseFirestoreRepository<T extends BaseDocument> {
    
    // Shared executor service for async operations across all repository instances
    private static final ExecutorService SHARED_EXECUTOR = createSharedExecutor();
    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(30);
    
    protected final Firestore firestore;
    private final FirestoreRetryPolicy retryPolicy;
    private final FirestoreTransactionManager transactionManager;
    private final ExecutorService executorService;
    private final Duration timeout;
    
    /**
     * Create shared executor service for async Firestore operations
     * Uses a thread pool with core size based on CPU count
     */
    private static ExecutorService createSharedExecutor() {
        int corePoolSize = Math.max(2, Runtime.getRuntime().availableProcessors());
        int maxPoolSize = corePoolSize * 2;
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            corePoolSize,
            maxPoolSize,
            60L,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(100),
            r -> {
                Thread t = new Thread(r, "firestore-async-" + System.currentTimeMillis());
                t.setDaemon(true);
                return t;
            }
        );
        
        // Add shutdown hook for graceful cleanup
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            log.info("Shutting down Firestore async executor...");
            executor.shutdown();
            try {
                if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
            log.info("Firestore async executor shut down");
        }));
        
        return executor;
    }
    
    protected BaseFirestoreRepository(Firestore firestore) {
        this(firestore, new FirestoreRetryPolicy(), SHARED_EXECUTOR, DEFAULT_TIMEOUT);
    }
    
    protected BaseFirestoreRepository(Firestore firestore, FirestoreRetryPolicy retryPolicy) {
        this(firestore, retryPolicy, SHARED_EXECUTOR, DEFAULT_TIMEOUT);
    }
    
    protected BaseFirestoreRepository(Firestore firestore, FirestoreRetryPolicy retryPolicy, 
                                     ExecutorService executorService, Duration timeout) {
        this.firestore = firestore;
        this.retryPolicy = retryPolicy;
        this.executorService = executorService != null ? executorService : SHARED_EXECUTOR;
        this.timeout = timeout != null ? timeout : DEFAULT_TIMEOUT;
        this.transactionManager = new FirestoreTransactionManager(firestore, retryPolicy, this.timeout);
    }
    
    protected abstract String getCollectionName();
    
    protected abstract Class<T> getDocumentClass();
    
    public String save(T document) {
        return executeWithRetry("save", () -> {
            Instant start = Instant.now();
            try {
                FirestoreValidator.validateCollectionName(getCollectionName());
                
                document.onCreate();
                Map<String, Object> data = FirestoreConverter.toMap(document);
                FirestoreValidator.validateDocumentSize(document, data);
                
                String documentId = document.getId();
                if (documentId == null || documentId.isEmpty()) {
                    DocumentReference docRef = firestore.collection(getCollectionName()).document();
                    documentId = docRef.getId();
                    document.setId(documentId);
                    data.put("id", documentId);
                } else {
                    FirestoreValidator.validateDocumentId(documentId);
                    document.onUpdate();
                    data = FirestoreConverter.toMap(document);
                }
                
                DocumentReference docRef = firestore.collection(getCollectionName()).document(documentId);
                ApiFuture<WriteResult> result = docRef.set(data, SetOptions.merge());
                getWithTimeout(result, "save");
                
                FirestoreMetrics.recordWriteOperation(getCollectionName(), "save", Duration.between(start, Instant.now()));
                log.debug("Saved document {} with ID: {}", getCollectionName(), documentId);
                return documentId;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "save", Duration.between(start, Instant.now()), e);
                throw new com.nursery.common.firestore.exception.FirestoreConnectionException("Save operation interrupted", e);
            } catch (ExecutionException e) {
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "save", Duration.between(start, Instant.now()), e);
                throw mapException("Failed to save document", e);
            }
        });
    }
    
    public CompletableFuture<String> saveAsync(T document) {
        return CompletableFuture.supplyAsync(() -> save(document), executorService);
    }
    
    /**
     * Save document within a Firestore transaction (for atomic operations)
     * This method must be called from within a runInTransaction callback
     */
    public String save(T document, Transaction transaction) {
        if (transaction == null) {
            throw new IllegalArgumentException("Transaction cannot be null. Use save(document) for non-transactional operations.");
        }
        
        try {
            FirestoreValidator.validateCollectionName(getCollectionName());
            
            String documentId = document.getId();
            if (documentId == null || documentId.isEmpty()) {
                // Generate ID for new document
                DocumentReference docRef = firestore.collection(getCollectionName()).document();
                documentId = docRef.getId();
                document.setId(documentId);
                document.onCreate();
            } else {
                FirestoreValidator.validateDocumentId(documentId);
                document.onUpdate();
            }
            
            Map<String, Object> data = FirestoreConverter.toMap(document);
            FirestoreValidator.validateDocumentSize(document, data);
            
            DocumentReference docRef = firestore.collection(getCollectionName()).document(documentId);
            transaction.set(docRef, data, SetOptions.merge());
            
            log.debug("Queued save in transaction for document {} with ID: {}", getCollectionName(), documentId);
            return documentId;
        } catch (Exception e) {
            throw new com.nursery.common.firestore.exception.FirestoreException("Failed to save document in transaction", e);
        }
    }
    
    /**
     * Find document by ID within a Firestore transaction (for atomic reads)
     * This method must be called from within a runInTransaction callback
     */
    public Optional<T> findById(String id, Transaction transaction) {
        if (transaction == null) {
            throw new IllegalArgumentException("Transaction cannot be null. Use findById(id) for non-transactional operations.");
        }
        
        try {
            FirestoreValidator.validateDocumentId(id);
            DocumentReference docRef = firestore.collection(getCollectionName()).document(id);
            DocumentSnapshot document = getWithTimeout(transaction.get(docRef), "findById in transaction");
            
            if (document.exists()) {
                return Optional.of(FirestoreConverter.toDocument(document, getDocumentClass()));
            }
            return Optional.empty();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new com.nursery.common.firestore.exception.FirestoreConnectionException("Find operation interrupted in transaction", e);
        } catch (ExecutionException e) {
            throw mapException("Failed to find document in transaction", e);
        }
    }
    
    public Optional<T> findById(String id) {
        return executeWithRetry("findById", () -> {
            Instant start = Instant.now();
            try {
                FirestoreValidator.validateDocumentId(id);
                DocumentReference docRef = firestore.collection(getCollectionName()).document(id);
                ApiFuture<DocumentSnapshot> future = docRef.get();
                DocumentSnapshot document = getWithTimeout(future, "findById");
                
                FirestoreMetrics.recordReadOperation(getCollectionName(), "findById", Duration.between(start, Instant.now()));
                
                if (document.exists()) {
                    return Optional.of(FirestoreConverter.toDocument(document, getDocumentClass()));
                }
                return Optional.empty();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "findById", Duration.between(start, Instant.now()), e);
                throw new com.nursery.common.firestore.exception.FirestoreConnectionException("Find operation interrupted", e);
            } catch (ExecutionException e) {
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "findById", Duration.between(start, Instant.now()), e);
                throw mapException("Failed to find document", e);
            }
        });
    }
    
    public CompletableFuture<Optional<T>> findByIdAsync(String id) {
        return CompletableFuture.supplyAsync(() -> findById(id), executorService);
    }
    
    public List<T> findAll() {
        return findAll(QueryOptions.defaultOptions());
    }
    
    public List<T> findAll(QueryOptions options) {
        return executeWithRetry("findAll", () -> {
            Instant start = Instant.now();
            try {
                Query query = buildQuery();
                if (options.getOrderByField() != null) {
                    query = query.orderBy(options.getOrderByField(), 
                        options.isAscending() ? Query.Direction.ASCENDING : Query.Direction.DESCENDING);
                }
                query = query.limit(options.getEffectiveLimit());
                
                ApiFuture<QuerySnapshot> future = query.get();
                QuerySnapshot querySnapshot = getWithTimeout(future, "findAll");
                
                List<T> documents = new ArrayList<>();
                for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                    documents.add(FirestoreConverter.toDocument(document, getDocumentClass()));
                }
                
                FirestoreMetrics.recordReadOperation(getCollectionName(), "findAll", Duration.between(start, Instant.now()));
                return documents;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "findAll", Duration.between(start, Instant.now()), e);
                throw new com.nursery.common.firestore.exception.FirestoreConnectionException("Find all operation interrupted", e);
            } catch (ExecutionException e) {
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "findAll", Duration.between(start, Instant.now()), e);
                throw mapException("Failed to find documents", e);
            }
        });
    }
    
    public PageResult<T> findAll(PageRequest pageRequest) {
        return executeWithRetry("findAllPaginated", () -> {
            Instant start = Instant.now();
            try {
                Query query = buildQuery();
                query = query.limit(pageRequest.getEffectiveSize());
                
                if (pageRequest.getCursor() != null) {
                    // Cursor-based pagination
                    DocumentSnapshot cursorDoc = getWithTimeout(
                        firestore.collection(getCollectionName())
                            .document(pageRequest.getCursor())
                            .get(),
                        "findAllPaginated cursor"
                    );
                    if (cursorDoc.exists()) {
                        query = query.startAfter(cursorDoc);
                    }
                } else if (pageRequest.getOffset() > 0) {
                    // Offset-based pagination (less efficient)
                    query = query.offset(pageRequest.getOffset());
                }
                
                ApiFuture<QuerySnapshot> future = query.get();
                QuerySnapshot querySnapshot = getWithTimeout(future, "findAll");
                
                List<T> documents = new ArrayList<>();
                String nextCursor = null;
                for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                    documents.add(FirestoreConverter.toDocument(document, getDocumentClass()));
                }
                
                if (documents.size() == pageRequest.getEffectiveSize()) {
                    QueryDocumentSnapshot lastDoc = querySnapshot.getDocuments().get(querySnapshot.size() - 1);
                    nextCursor = lastDoc.getId();
                }
                
                FirestoreMetrics.recordReadOperation(getCollectionName(), "findAllPaginated", Duration.between(start, Instant.now()));
                return PageResult.of(documents, pageRequest, nextCursor);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "findAllPaginated", Duration.between(start, Instant.now()), e);
                throw new com.nursery.common.firestore.exception.FirestoreConnectionException("Find all paginated operation interrupted", e);
            } catch (ExecutionException e) {
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "findAllPaginated", Duration.between(start, Instant.now()), e);
                throw mapException("Failed to find documents", e);
            }
        });
    }
    
    public CompletableFuture<List<T>> findAllAsync() {
        return CompletableFuture.supplyAsync(() -> findAll(), executorService);
    }
    
    public void deleteById(String id) {
        executeWithRetry("deleteById", () -> {
            Instant start = Instant.now();
            try {
                FirestoreValidator.validateDocumentId(id);
                DocumentReference docRef = firestore.collection(getCollectionName()).document(id);
                ApiFuture<WriteResult> result = docRef.delete();
                getWithTimeout(result, "deleteById");
                
                FirestoreMetrics.recordWriteOperation(getCollectionName(), "deleteById", Duration.between(start, Instant.now()));
                log.debug("Deleted document {} with ID: {}", getCollectionName(), id);
                return null;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "deleteById", Duration.between(start, Instant.now()), e);
                throw new com.nursery.common.firestore.exception.FirestoreConnectionException("Delete operation interrupted", e);
            } catch (ExecutionException e) {
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "deleteById", Duration.between(start, Instant.now()), e);
                throw mapException("Failed to delete document", e);
            }
        });
    }
    
    public CompletableFuture<Void> deleteByIdAsync(String id) {
        return CompletableFuture.runAsync(() -> deleteById(id), executorService);
    }
    
    public boolean existsById(String id) {
        return findById(id).isPresent();
    }
    
    public BatchWriteResult saveBatch(List<T> documents) {
        if (documents == null || documents.isEmpty()) {
            return BatchWriteResult.builder()
                .successCount(0)
                .failureCount(0)
                .successfulIds(new ArrayList<>())
                .errors(new ArrayList<>())
                .build();
        }
        
        if (documents.size() > 500) {
            throw new com.nursery.common.firestore.exception.FirestoreValidationException("Batch size exceeds Firestore limit of 500 operations");
        }
        
        return executeWithRetry("saveBatch", () -> {
            Instant start = Instant.now();
            try {
                WriteBatch batch = firestore.batch();
                List<String> successfulIds = new ArrayList<>();
                List<BatchWriteResult.BatchWriteError> errors = new ArrayList<>();
                
                for (T document : documents) {
                    try {
                        FirestoreValidator.validateCollectionName(getCollectionName());
                        document.onCreate();
                        Map<String, Object> data = FirestoreConverter.toMap(document);
                        FirestoreValidator.validateDocumentSize(document, data);
                        
                        String documentId = document.getId();
                        if (documentId == null || documentId.isEmpty()) {
                            DocumentReference docRef = firestore.collection(getCollectionName()).document();
                            documentId = docRef.getId();
                            document.setId(documentId);
                        } else {
                            FirestoreValidator.validateDocumentId(documentId);
                            document.onUpdate();
                            data = FirestoreConverter.toMap(document);
                        }
                        
                        DocumentReference docRef = firestore.collection(getCollectionName()).document(documentId);
                        batch.set(docRef, data, SetOptions.merge());
                        successfulIds.add(documentId);
                    } catch (Exception e) {
                        errors.add(BatchWriteResult.BatchWriteError.builder()
                            .documentId(document.getId())
                            .errorMessage(e.getMessage())
                            .cause(e)
                            .build());
                    }
                }
                
                ApiFuture<List<WriteResult>> result = batch.commit();
                getWithTimeout(result, "saveBatch");
                
                FirestoreMetrics.recordWriteOperation(getCollectionName(), "saveBatch", Duration.between(start, Instant.now()));
                
                return BatchWriteResult.builder()
                    .successCount(successfulIds.size())
                    .failureCount(errors.size())
                    .successfulIds(successfulIds)
                    .errors(errors)
                    .build();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "saveBatch", Duration.between(start, Instant.now()), e);
                throw new com.nursery.common.firestore.exception.FirestoreConnectionException("Batch save operation interrupted", e);
            } catch (ExecutionException e) {
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "saveBatch", Duration.between(start, Instant.now()), e);
                throw mapException("Failed to save batch", e);
            }
        });
    }
    
    public BatchWriteResult deleteBatch(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return BatchWriteResult.builder()
                .successCount(0)
                .failureCount(0)
                .successfulIds(new ArrayList<>())
                .errors(new ArrayList<>())
                .build();
        }
        
        if (ids.size() > 500) {
            throw new com.nursery.common.firestore.exception.FirestoreValidationException("Batch size exceeds Firestore limit of 500 operations");
        }
        
        return executeWithRetry("deleteBatch", () -> {
            Instant start = Instant.now();
            try {
                WriteBatch batch = firestore.batch();
                List<String> successfulIds = new ArrayList<>();
                List<BatchWriteResult.BatchWriteError> errors = new ArrayList<>();
                
                for (String id : ids) {
                    try {
                        FirestoreValidator.validateDocumentId(id);
                        DocumentReference docRef = firestore.collection(getCollectionName()).document(id);
                        batch.delete(docRef);
                        successfulIds.add(id);
                    } catch (Exception e) {
                        errors.add(BatchWriteResult.BatchWriteError.builder()
                            .documentId(id)
                            .errorMessage(e.getMessage())
                            .cause(e)
                            .build());
                    }
                }
                
                ApiFuture<List<WriteResult>> result = batch.commit();
                getWithTimeout(result, "saveBatch");
                
                FirestoreMetrics.recordWriteOperation(getCollectionName(), "deleteBatch", Duration.between(start, Instant.now()));
                
                return BatchWriteResult.builder()
                    .successCount(successfulIds.size())
                    .failureCount(errors.size())
                    .successfulIds(successfulIds)
                    .errors(errors)
                    .build();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "deleteBatch", Duration.between(start, Instant.now()), e);
                throw new com.nursery.common.firestore.exception.FirestoreConnectionException("Batch delete operation interrupted", e);
            } catch (ExecutionException e) {
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "deleteBatch", Duration.between(start, Instant.now()), e);
                throw mapException("Failed to delete batch", e);
            }
        });
    }
    
    public <R> R runInTransaction(Function<Transaction, R> transactionFunction) {
        return transactionManager.runInTransaction(transactionFunction);
    }
    
    protected Query buildQuery() {
        return firestore.collection(getCollectionName());
    }
    
    protected List<T> executeQuery(Query query) {
        return executeQuery(query, QueryOptions.defaultOptions());
    }
    
    protected List<T> executeQuery(Query query, QueryOptions options) {
        final QueryOptions finalOptions = options;
        return executeWithRetry("executeQuery", () -> {
            Instant start = Instant.now();
            try {
                Query finalQuery = query;
                if (finalOptions.getOrderByField() != null) {
                    finalQuery = finalQuery.orderBy(finalOptions.getOrderByField(),
                        finalOptions.isAscending() ? Query.Direction.ASCENDING : Query.Direction.DESCENDING);
                }
                finalQuery = finalQuery.limit(finalOptions.getEffectiveLimit());
                
                ApiFuture<QuerySnapshot> future = finalQuery.get();
                QuerySnapshot querySnapshot = getWithTimeout(future, "executeQuery");
                
                List<T> documents = new ArrayList<>();
                for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                    documents.add(FirestoreConverter.toDocument(document, getDocumentClass()));
                }
                
                FirestoreMetrics.recordReadOperation(getCollectionName(), "executeQuery", Duration.between(start, Instant.now()));
                return documents;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "executeQuery", Duration.between(start, Instant.now()), e);
                throw new FirestoreConnectionException("Query execution interrupted", e);
            } catch (ExecutionException e) {
                FirestoreMetrics.recordFailedOperation(getCollectionName(), "executeQuery", Duration.between(start, Instant.now()), e);
                throw mapException("Failed to execute query", e);
            }
        });
    }
    
    /**
     * Get result from ApiFuture with timeout handling
     * Throws FirestoreConnectionException on timeout
     */
    private <R> R getWithTimeout(ApiFuture<R> future, String operation) throws InterruptedException, ExecutionException {
        try {
            return future.get(timeout.toSeconds(), TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            throw new FirestoreConnectionException(
                String.format("Operation '%s' timed out after %d seconds", operation, timeout.toSeconds()), e);
        }
    }
    
    private <R> R executeWithRetry(String operation, java.util.function.Supplier<R> supplier) {
        int attempt = 0;
        Exception lastException = null;
        
        while (attempt < retryPolicy.getMaxAttempts()) {
            try {
                try (MDC.MDCCloseable ignored = MDC.putCloseable("firestore.operation", operation);
                     MDC.MDCCloseable ignored2 = MDC.putCloseable("firestore.collection", getCollectionName());
                     MDC.MDCCloseable ignored3 = MDC.putCloseable("firestore.attempt", String.valueOf(attempt + 1))) {
                    return supplier.get();
                }
            } catch (com.nursery.common.firestore.exception.FirestoreException e) {
                // Don't retry Firestore exceptions (validation, not found, etc.)
                throw e;
            } catch (Exception e) {
                lastException = e;
                if (retryPolicy.shouldRetry(e, attempt)) {
                    try {
                        retryPolicy.waitBeforeRetry(attempt);
                        attempt++;
                        continue;
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new com.nursery.common.firestore.exception.FirestoreConnectionException("Operation interrupted during retry", ie);
                    }
                } else {
                    throw mapException("Operation failed", e);
                }
            }
        }
        
        throw mapException("Operation failed after " + retryPolicy.getMaxAttempts() + " attempts", lastException);
    }
    
    private com.nursery.common.firestore.exception.FirestoreException mapException(String message, Exception e) {
        if (e instanceof ExecutionException) {
            Throwable cause = e.getCause();
            if (cause instanceof com.google.api.gax.rpc.ApiException) {
                com.google.api.gax.rpc.ApiException apiException = (com.google.api.gax.rpc.ApiException) cause;
                com.google.api.gax.rpc.StatusCode.Code code = apiException.getStatusCode().getCode();
                
                switch (code) {
                    case NOT_FOUND:
                        return new com.nursery.common.firestore.exception.FirestoreDocumentNotFoundException(getCollectionName(), "unknown");
                    case DEADLINE_EXCEEDED:
                    case UNAVAILABLE:
                    case RESOURCE_EXHAUSTED:
                        return new com.nursery.common.firestore.exception.FirestoreConnectionException(message, e);
                    case INVALID_ARGUMENT:
                    case FAILED_PRECONDITION:
                        return new com.nursery.common.firestore.exception.FirestoreValidationException(message, e);
                    default:
                        return new com.nursery.common.firestore.exception.FirestoreException(message, e);
                }
            }
        }
        
        if (e instanceof com.nursery.common.firestore.exception.FirestoreException) {
            return (com.nursery.common.firestore.exception.FirestoreException) e;
        }
        
        return new com.nursery.common.firestore.exception.FirestoreException(message, e);
    }
}
