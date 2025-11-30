package com.nursery.breed.exception;

import com.nursery.common.exception.BusinessException;

public class BreedException extends BusinessException {
    
    public BreedException(String message) {
        super(message);
    }
    
    public BreedException(String message, Throwable cause) {
        super(message, cause);
    }
}



