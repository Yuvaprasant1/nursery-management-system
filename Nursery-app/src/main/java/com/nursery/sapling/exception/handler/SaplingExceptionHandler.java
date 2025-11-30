package com.nursery.sapling.exception.handler;

import com.nursery.common.dto.ApiResponse;
import com.nursery.sapling.exception.SaplingException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Exception handler for Sapling package
 * Handles all sapling-related exceptions
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.nursery.sapling")
public class SaplingExceptionHandler {
    
    @ExceptionHandler(SaplingException.class)
    public ResponseEntity<ApiResponse<?>> handleSaplingException(SaplingException ex) {
        log.error("Sapling error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(ex.getMessage()));
    }
}

