package com.nursery.sapling.exception;

import com.nursery.common.exception.BusinessException;

public class SaplingException extends BusinessException {
    
    public SaplingException(String message) {
        super(message);
    }
    
    public SaplingException(String message, Throwable cause) {
        super(message, cause);
    }
}

