package com.nursery.auth.exception.handler;

import com.nursery.common.dto.ApiResponse;
import com.nursery.auth.exception.AuthException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Exception handler for Auth package
 * Handles all authentication-related exceptions
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.nursery.auth")
public class AuthExceptionHandler {
    
    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ApiResponse<?>> handleAuthException(AuthException ex) {
        log.error("Auth error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.error(ex.getMessage()));
    }
}



