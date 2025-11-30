package com.nursery.inventory.firestore;

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
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class InventoryFirestoreRepository extends BaseFirestoreRepository<InventoryDocument> {
    
    public InventoryFirestoreRepository(Firestore firestore) {
        super(firestore);
    }
    
    @Override
    protected String getCollectionName() {
        return "inventory";
    }
    
    @Override
    protected Class<InventoryDocument> getDocumentClass() {
        return InventoryDocument.class;
    }
    
    public List<InventoryDocument> findByNurseryId(String nurseryId) {
        Query query = buildQuery().whereEqualTo("nurseryId", nurseryId);
        return executeQuery(query);
    }
    
    public Optional<InventoryDocument> findByBreedId(String breedId) {
        Query query = buildQuery().whereEqualTo("breedId", breedId);
        List<InventoryDocument> results = executeQuery(query);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }
    
    public boolean existsByBreedId(String breedId) {
        Query query = buildQuery().whereEqualTo("breedId", breedId);
        List<InventoryDocument> results = executeQuery(query);
        return !results.isEmpty();
    }
    
    public PageResult<InventoryDocument> findByNurseryIdPaginated(String nurseryId, PageRequest pageRequest) {
        Query query = buildQuery()
            .whereEqualTo("nurseryId", nurseryId)
            .orderBy("updatedAt", Query.Direction.DESCENDING)
            .limit(pageRequest.getEffectiveSize());
        
        if (pageRequest.getOffset() > 0) {
            query = query.offset(pageRequest.getOffset());
        }
        
        try {
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot querySnapshot = future.get();
            
            List<InventoryDocument> documents = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                documents.add(FirestoreConverter.toDocument(document, getDocumentClass()));
            }
            
            // Get total count
            Query countQuery = buildQuery().whereEqualTo("nurseryId", nurseryId);
            List<InventoryDocument> allResults = executeQuery(countQuery);
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

