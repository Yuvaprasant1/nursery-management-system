package com.nursery.common.firestore.exception;

import com.nursery.common.exception.BusinessException;

public class FirestoreException extends BusinessException {
    
    public FirestoreException(String message) {
        super(message);
    }
    
    public FirestoreException(String message, Throwable cause) {
        super(message, cause);
    }
}

