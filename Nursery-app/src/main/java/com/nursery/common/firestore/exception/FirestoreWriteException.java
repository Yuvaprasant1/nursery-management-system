package com.nursery.common.firestore.exception;

public class FirestoreWriteException extends FirestoreException {
    
    public FirestoreWriteException(String message) {
        super(message);
    }
    
    public FirestoreWriteException(String message, Throwable cause) {
        super(message, cause);
    }
}

