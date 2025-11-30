package com.nursery.breed.exception.handler;

import com.nursery.common.dto.ApiResponse;
import com.nursery.breed.exception.BreedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Exception handler for Breed package
 * Handles all breed-related exceptions
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.nursery.breed")
public class BreedExceptionHandler {
    
    @ExceptionHandler(BreedException.class)
    public ResponseEntity<ApiResponse<?>> handleBreedException(BreedException ex) {
        log.error("Breed error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(ex.getMessage()));
    }
}



