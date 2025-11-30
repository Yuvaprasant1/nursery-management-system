package com.nursery.auth.firestore;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.nursery.common.firestore.BaseFirestoreRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class UserFirestoreRepository extends BaseFirestoreRepository<UserDocument> {
    
    public UserFirestoreRepository(Firestore firestore) {
        super(firestore);
    }
    
    @Override
    protected String getCollectionName() {
        return "users";
    }
    
    @Override
    protected Class<UserDocument> getDocumentClass() {
        return UserDocument.class;
    }
    
    public Optional<UserDocument> findByPhone(String phone) {
        Query query = buildQuery()
            .whereEqualTo("phone", phone)
            .whereEqualTo("isDeleted", false);
        List<UserDocument> results = executeQuery(query);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }
    
    public Optional<UserDocument> findByPhoneAndNotDeleted(String phone) {
        return findByPhone(phone);
    }
    
    public boolean existsByPhone(String phone) {
        Query query = buildQuery()
            .whereEqualTo("phone", phone)
            .whereEqualTo("isDeleted", false);
        List<UserDocument> results = executeQuery(query);
        return !results.isEmpty();
    }
}

