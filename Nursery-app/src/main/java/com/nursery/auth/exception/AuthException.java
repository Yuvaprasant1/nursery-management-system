package com.nursery.auth.exception;

import com.nursery.common.exception.BusinessException;

public class AuthException extends BusinessException {
    
    public AuthException(String message) {
        super(message);
    }
    
    public AuthException(String message, Throwable cause) {
        super(message, cause);
    }
}



