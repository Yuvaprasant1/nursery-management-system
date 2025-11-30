package com.nursery.common.firestore.exception;

public class FirestoreValidationException extends FirestoreException {
    
    public FirestoreValidationException(String message) {
        super(message);
    }
    
    public FirestoreValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}

