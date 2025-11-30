package com.nursery.breed.firestore;

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

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class BreedFirestoreRepository extends BaseFirestoreRepository<BreedDocument> {
    
    public BreedFirestoreRepository(Firestore firestore) {
        super(firestore);
    }
    
    @Override
    protected String getCollectionName() {
        return "breeds";
    }
    
    @Override
    protected Class<BreedDocument> getDocumentClass() {
        return BreedDocument.class;
    }
    
    public List<BreedDocument> findBySaplingIdAndNotDeleted(String saplingId) {
        Query query = buildQuery()
            .whereEqualTo("saplingId", saplingId)
            .whereEqualTo("isDeleted", false);
        return executeQuery(query);
    }
    
    public List<BreedDocument> findByNurseryIdAndNotDeleted(String nurseryId) {
        Query query = buildQuery()
            .whereEqualTo("nurseryId", nurseryId)
            .whereEqualTo("isDeleted", false);
        return executeQuery(query);
    }
    
    public List<BreedDocument> findNonDeleted() {
        Query query = buildQuery().whereEqualTo("isDeleted", false);
        return executeQuery(query);
    }
    
    public boolean existsByIdAndNotDeleted(String id) {
        Query query = buildQuery().whereEqualTo("id", id).whereEqualTo("isDeleted", false);
        List<BreedDocument> results = executeQuery(query);
        return !results.isEmpty();
    }
    
    public boolean existsBySaplingIdAndIsDeletedFalse(String saplingId) {
        Query query = buildQuery()
            .whereEqualTo("saplingId", saplingId)
            .whereEqualTo("isDeleted", false);
        List<BreedDocument> results = executeQuery(query);
        return !results.isEmpty();
    }
    
    public PageResult<BreedDocument> findBySaplingIdAndNotDeletedPaginated(String saplingId, PageRequest pageRequest) {
        Query query = buildQuery()
            .whereEqualTo("saplingId", saplingId)
            .whereEqualTo("isDeleted", false)
            .orderBy("updatedAt", Query.Direction.DESCENDING)
            .limit(pageRequest.getEffectiveSize());
        
        if (pageRequest.getOffset() > 0) {
            query = query.offset(pageRequest.getOffset());
        }
        
        try {
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot querySnapshot = future.get();
            
            List<BreedDocument> documents = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                documents.add(FirestoreConverter.toDocument(document, getDocumentClass()));
            }
            
            // Get total count for this query (simplified - in production, you might want to cache this)
            Query countQuery = buildQuery()
                .whereEqualTo("saplingId", saplingId)
                .whereEqualTo("isDeleted", false);
            List<BreedDocument> allResults = executeQuery(countQuery);
            long totalElements = allResults.size();
            
            return PageResult.of(documents, pageRequest, totalElements);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Query interrupted", e);
        } catch (ExecutionException e) {
            throw new RuntimeException("Failed to execute query", e);
        }
    }
    
    public PageResult<BreedDocument> findByNurseryIdAndNotDeletedPaginated(String nurseryId, PageRequest pageRequest) {
        Query query = buildQuery()
            .whereEqualTo("nurseryId", nurseryId)
            .whereEqualTo("isDeleted", false)
            .orderBy("updatedAt", Query.Direction.DESCENDING)
            .limit(pageRequest.getEffectiveSize());
        
        if (pageRequest.getOffset() > 0) {
            query = query.offset(pageRequest.getOffset());
        }
        
        try {
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot querySnapshot = future.get();
            
            List<BreedDocument> documents = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                documents.add(FirestoreConverter.toDocument(document, getDocumentClass()));
            }
            
            // Get total count for this query
            Query countQuery = buildQuery()
                .whereEqualTo("nurseryId", nurseryId)
                .whereEqualTo("isDeleted", false);
            List<BreedDocument> allResults = executeQuery(countQuery);
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

