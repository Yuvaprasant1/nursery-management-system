package com.nursery.nursery.firestore;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.nursery.common.firestore.BaseFirestoreRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class NurseryFirestoreRepository extends BaseFirestoreRepository<NurseryDocument> {
    
    public NurseryFirestoreRepository(Firestore firestore) {
        super(firestore);
    }
    
    @Override
    protected String getCollectionName() {
        return "nurseries";
    }
    
    @Override
    protected Class<NurseryDocument> getDocumentClass() {
        return NurseryDocument.class;
    }
    
    public List<NurseryDocument> findNonDeleted() {
        Query query = buildQuery().whereEqualTo("isDeleted", false);
        return executeQuery(query);
    }
    
    public boolean existsByIdAndNotDeleted(String id) {
        Query query = buildQuery().whereEqualTo("id", id).whereEqualTo("isDeleted", false);
        List<NurseryDocument> results = executeQuery(query);
        return !results.isEmpty();
    }
}

