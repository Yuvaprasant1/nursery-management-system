package com.nursery.inventory.exception.handler;

import com.nursery.common.dto.ApiResponse;
import com.nursery.inventory.exception.InventoryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Exception handler for Inventory package
 * Handles all inventory-related exceptions
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.nursery.inventory")
public class InventoryExceptionHandler {
    
    @ExceptionHandler(InventoryException.class)
    public ResponseEntity<ApiResponse<?>> handleInventoryException(InventoryException ex) {
        log.error("Inventory error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(ex.getMessage()));
    }
}



