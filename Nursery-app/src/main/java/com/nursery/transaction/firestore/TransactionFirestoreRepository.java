package com.nursery.transaction.firestore;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.nursery.common.firestore.BaseFirestoreRepository;
import com.nursery.common.firestore.FirestoreConverter;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.common.firestore.pagination.PageResult;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class TransactionFirestoreRepository extends BaseFirestoreRepository<TransactionDocument> {
    
    public TransactionFirestoreRepository(Firestore firestore) {
        super(firestore);
    }
    
    @Override
    protected String getCollectionName() {
        return "transactions";
    }
    
    @Override
    protected Class<TransactionDocument> getDocumentClass() {
        return TransactionDocument.class;
    }
    
    public List<TransactionDocument> findByBreedIdAndNotDeleted(String breedId) {
        Query query = buildQuery()
            .whereEqualTo("breedId", breedId)
            .whereEqualTo("isDeleted", false);
        List<TransactionDocument> results = executeQuery(query);
        // Sort in memory since Firestore composite index might not exist
        return results.stream()
            .sorted((a, b) -> {
                if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                return b.getCreatedAt().compareTo(a.getCreatedAt()); // DESC order
            })
            .collect(java.util.stream.Collectors.toList());
    }
    
    public List<TransactionDocument> findByNurseryIdAndNotDeleted(String nurseryId) {
        Query query = buildQuery()
            .whereEqualTo("nurseryId", nurseryId)
            .whereEqualTo("isDeleted", false);
        List<TransactionDocument> results = executeQuery(query);
        // Sort in memory
        return results.stream()
            .sorted((a, b) -> {
                if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                return b.getCreatedAt().compareTo(a.getCreatedAt()); // DESC order
            })
            .collect(java.util.stream.Collectors.toList());
    }
    
    public List<TransactionDocument> findRecentTransactions(String nurseryId, LocalDateTime since) {
        // Convert LocalDateTime to Firestore Timestamp
        com.google.cloud.Timestamp sinceTimestamp = com.google.cloud.Timestamp.of(
            java.util.Date.from(since.atZone(java.time.ZoneId.systemDefault()).toInstant())
        );
        
        Query query = buildQuery()
            .whereEqualTo("nurseryId", nurseryId)
            .whereEqualTo("isDeleted", false)
            .whereGreaterThanOrEqualTo("createdAt", sinceTimestamp);
        List<TransactionDocument> results = executeQuery(query);
        // Sort in memory
        return results.stream()
            .sorted((a, b) -> {
                if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                return b.getCreatedAt().compareTo(a.getCreatedAt()); // DESC order
            })
            .collect(java.util.stream.Collectors.toList());
    }
    
    public List<TransactionDocument> findNonDeleted() {
        Query query = buildQuery().whereEqualTo("isDeleted", false);
        return executeQuery(query);
    }
    
    public boolean existsByIdAndNotDeleted(String id) {
        Query query = buildQuery().whereEqualTo("id", id).whereEqualTo("isDeleted", false);
        List<TransactionDocument> results = executeQuery(query);
        return !results.isEmpty();
    }
    
    public PageResult<TransactionDocument> findByBreedIdAndNotDeletedPaginated(String breedId, PageRequest pageRequest) {
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
            
            List<TransactionDocument> documents = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                documents.add(FirestoreConverter.toDocument(document, getDocumentClass()));
            }
            
            // Get total count
            Query countQuery = buildQuery()
                .whereEqualTo("breedId", breedId)
                .whereEqualTo("isDeleted", false);
            List<TransactionDocument> allResults = executeQuery(countQuery);
            long totalElements = allResults.size();
            
            return PageResult.of(documents, pageRequest, totalElements);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Query interrupted", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to execute query", e);
        }
    }
    
    public PageResult<TransactionDocument> findByNurseryIdAndNotDeletedPaginated(String nurseryId, PageRequest pageRequest) {
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
            
            List<TransactionDocument> documents = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                documents.add(FirestoreConverter.toDocument(document, getDocumentClass()));
            }
            
            // Get total count
            Query countQuery = buildQuery()
                .whereEqualTo("nurseryId", nurseryId)
                .whereEqualTo("isDeleted", false);
            List<TransactionDocument> allResults = executeQuery(countQuery);
            long totalElements = allResults.size();
            
            return PageResult.of(documents, pageRequest, totalElements);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Query interrupted", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to execute query", e);
        }
    }
}

