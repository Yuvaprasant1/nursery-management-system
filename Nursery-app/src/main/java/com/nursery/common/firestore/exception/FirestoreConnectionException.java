package com.nursery.common.firestore.exception;

public class FirestoreConnectionException extends FirestoreException {
    
    public FirestoreConnectionException(String message) {
        super(message);
    }
    
    public FirestoreConnectionException(String message, Throwable cause) {
        super(message, cause);
    }
}

