package com.nursery.transaction.exception;

import com.nursery.common.exception.BusinessException;

public class TransactionException extends BusinessException {
    
    public TransactionException(String message) {
        super(message);
    }
    
    public TransactionException(String message, Throwable cause) {
        super(message, cause);
    }
}



