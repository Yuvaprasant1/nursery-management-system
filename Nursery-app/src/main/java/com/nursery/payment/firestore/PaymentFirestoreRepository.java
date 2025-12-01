package com.nursery.payment.firestore;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.nursery.common.firestore.BaseFirestoreRepository;
import com.nursery.common.firestore.FirestoreConverter;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.common.firestore.pagination.PageResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

/**
 * Repository for managing Payment documents in Firestore.
 * Provides methods for querying payments by transaction, nursery, and breed.
 */
@Slf4j
@Repository
public class PaymentFirestoreRepository extends BaseFirestoreRepository<PaymentDocument> {
    
    public PaymentFirestoreRepository(Firestore firestore) {
        super(firestore);
    }
    
    @Override
    protected String getCollectionName() {
        return "payments";
    }
    
    @Override
    protected Class<PaymentDocument> getDocumentClass() {
        return PaymentDocument.class;
    }
    
    /**
     * Finds all payments for a given transaction ID, including deleted ones.
     * 
     * @param transactionId the transaction ID
     * @return list of payment documents
     */
    public List<PaymentDocument> findByTransactionId(String transactionId) {
        log.debug("Finding payments by transactionId={}", transactionId);
        Query query = buildQuery().whereEqualTo("transactionId", transactionId);
        List<PaymentDocument> results = executeQuery(query);
        log.debug("Found {} payments for transactionId={}", results.size(), transactionId);
        return results;
    }
    
    /**
     * Finds all non-deleted payments for a given transaction ID.
     * 
     * @param transactionId the transaction ID
     * @return list of non-deleted payment documents
     */
    public List<PaymentDocument> findByTransactionIdAndNotDeleted(String transactionId) {
        log.debug("Finding non-deleted payments by transactionId={}", transactionId);
        Query query = buildQuery()
            .whereEqualTo("transactionId", transactionId)
            .whereEqualTo("isDeleted", false);
        List<PaymentDocument> results = executeQuery(query);
        log.debug("Found {} non-deleted payments for transactionId={}", results.size(), transactionId);
        return results;
    }
    
    /**
     * Finds paginated non-deleted payments for a given nursery ID, ordered by creation date descending.
     * 
     * @param nurseryId the nursery ID
     * @param pageRequest the pagination request
     * @return paginated result of payment documents
     * @throws RuntimeException if the query execution fails
     */
    public PageResult<PaymentDocument> findByNurseryIdAndNotDeletedPaginated(String nurseryId, PageRequest pageRequest) {
        log.debug("Finding paginated payments by nurseryId={}, page={}, size={}", 
            nurseryId, pageRequest.getPage(), pageRequest.getSize());
        
        Query query = buildQuery()
            .whereEqualTo("nurseryId", nurseryId)
            .whereEqualTo("isDeleted", false)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .limit(pageRequest.getEffectiveSize());
        
        if (pageRequest.getOffset() > 0) {
            query = query.offset(pageRequest.getOffset());
        }
        
        try {
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot querySnapshot = future.get();
            
            List<PaymentDocument> documents = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                documents.add(FirestoreConverter.toDocument(document, getDocumentClass()));
            }
            
            // Get total count for pagination
            // Note: This loads all matching documents to count them, which may be inefficient for large datasets
            // Consider implementing a counter collection for better performance in production
            Query countQuery = buildQuery()
                .whereEqualTo("nurseryId", nurseryId)
                .whereEqualTo("isDeleted", false);
            List<PaymentDocument> allResults = executeQuery(countQuery);
            long totalElements = allResults.size();
            
            log.debug("Found {} payments for nurseryId={} (page={}, total={})", 
                documents.size(), nurseryId, pageRequest.getPage(), totalElements);
            return PageResult.of(documents, pageRequest, totalElements);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Query interrupted while finding payments by nurseryId={}", nurseryId, e);
            throw new RuntimeException("Query interrupted while fetching payments", e);
        } catch (ExecutionException e) {
            log.error("Failed to execute query while finding payments by nurseryId={}", nurseryId, e);
            throw new RuntimeException("Failed to execute query for payments", e);
        }
    }
    
    /**
     * Finds paginated non-deleted payments for a given breed ID, ordered by creation date descending.
     * 
     * @param breedId the breed ID
     * @param pageRequest the pagination request
     * @return paginated result of payment documents
     * @throws RuntimeException if the query execution fails
     */
    public PageResult<PaymentDocument> findByBreedIdAndNotDeletedPaginated(String breedId, PageRequest pageRequest) {
        log.debug("Finding paginated payments by breedId={}, page={}, size={}", 
            breedId, pageRequest.getPage(), pageRequest.getSize());
        
        Query query = buildQuery()
            .whereEqualTo("breedId", breedId)
            .whereEqualTo("isDeleted", false)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .limit(pageRequest.getEffectiveSize());
        
        if (pageRequest.getOffset() > 0) {
            query = query.offset(pageRequest.getOffset());
        }
        
        try {
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot querySnapshot = future.get();
            
            List<PaymentDocument> documents = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                documents.add(FirestoreConverter.toDocument(document, getDocumentClass()));
            }
            
            // Get total count for pagination
            // Note: This loads all matching documents to count them, which may be inefficient for large datasets
            // Consider implementing a counter collection for better performance in production
            Query countQuery = buildQuery()
                .whereEqualTo("breedId", breedId)
                .whereEqualTo("isDeleted", false);
            List<PaymentDocument> allResults = executeQuery(countQuery);
            long totalElements = allResults.size();
            
            log.debug("Found {} payments for breedId={} (page={}, total={})", 
                documents.size(), breedId, pageRequest.getPage(), totalElements);
            return PageResult.of(documents, pageRequest, totalElements);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Query interrupted while finding payments by breedId={}", breedId, e);
            throw new RuntimeException("Query interrupted while fetching payments", e);
        } catch (ExecutionException e) {
            log.error("Failed to execute query while finding payments by breedId={}", breedId, e);
            throw new RuntimeException("Failed to execute query for payments", e);
        }
    }
}

