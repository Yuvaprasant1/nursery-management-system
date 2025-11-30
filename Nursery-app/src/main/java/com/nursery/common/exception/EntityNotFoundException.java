package com.nursery.common.exception;

public class EntityNotFoundException extends BusinessException {
    
    public EntityNotFoundException(String message) {
        super(message);
    }
    
    public EntityNotFoundException(String entityName, Long id) {
        super(String.format("%s with id %d not found", entityName, id));
    }
    
    public EntityNotFoundException(String entityName, String id) {
        super(String.format("%s with id %s not found", entityName, id));
    }
}

