package com.nursery.nursery.exception;

import com.nursery.common.exception.BusinessException;

public class NurseryException extends BusinessException {
    
    public NurseryException(String message) {
        super(message);
    }
    
    public NurseryException(String message, Throwable cause) {
        super(message, cause);
    }
}



