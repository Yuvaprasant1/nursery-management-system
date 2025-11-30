package com.nursery.inventory.exception;

import com.nursery.common.exception.BusinessException;

public class InventoryException extends BusinessException {
    
    public InventoryException(String message) {
        super(message);
    }
    
    public InventoryException(String message, Throwable cause) {
        super(message, cause);
    }
}



