package com.nursery.nursery.exception.handler;

import com.nursery.common.dto.ApiResponse;
import com.nursery.nursery.exception.NurseryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Exception handler for Nursery package
 * Handles all nursery-related exceptions
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.nursery.nursery")
public class NurseryExceptionHandler {
    
    @ExceptionHandler(NurseryException.class)
    public ResponseEntity<ApiResponse<?>> handleNurseryException(NurseryException ex) {
        log.error("Nursery error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(ex.getMessage()));
    }
}



