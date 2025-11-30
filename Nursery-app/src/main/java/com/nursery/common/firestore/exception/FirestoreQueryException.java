package com.nursery.common.firestore.exception;

public class FirestoreQueryException extends FirestoreException {
    
    public FirestoreQueryException(String message) {
        super(message);
    }
    
    public FirestoreQueryException(String message, Throwable cause) {
        super(message, cause);
    }
}

