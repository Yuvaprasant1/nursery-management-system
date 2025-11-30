package com.nursery.theme.firestore;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.nursery.common.firestore.BaseFirestoreRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ThemeFirestoreRepository extends BaseFirestoreRepository<ThemeDocument> {
    
    public ThemeFirestoreRepository(Firestore firestore) {
        super(firestore);
    }
    
    @Override
    protected String getCollectionName() {
        return "themes";
    }
    
    @Override
    protected Class<ThemeDocument> getDocumentClass() {
        return ThemeDocument.class;
    }
    
    public Optional<ThemeDocument> findByNurseryId(String nurseryId) {
        Query query = buildQuery().whereEqualTo("nurseryId", nurseryId);
        List<ThemeDocument> results = executeQuery(query);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }
    
    public boolean existsByNurseryId(String nurseryId) {
        Query query = buildQuery().whereEqualTo("nurseryId", nurseryId);
        List<ThemeDocument> results = executeQuery(query);
        return !results.isEmpty();
    }
}

