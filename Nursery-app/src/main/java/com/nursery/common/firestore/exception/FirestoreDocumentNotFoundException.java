package com.nursery.common.firestore.exception;

public class FirestoreDocumentNotFoundException extends FirestoreException {
    
    public FirestoreDocumentNotFoundException(String message) {
        super(message);
    }
    
    public FirestoreDocumentNotFoundException(String collectionName, String documentId) {
        super(String.format("Document with id %s not found in collection %s", documentId, collectionName));
    }
}

