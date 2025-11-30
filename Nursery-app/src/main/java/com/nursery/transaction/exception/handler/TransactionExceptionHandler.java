package com.nursery.transaction.exception.handler;

import com.nursery.common.dto.ApiResponse;
import com.nursery.transaction.exception.TransactionException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Exception handler for Transaction package
 * Handles all transaction-related exceptions
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.nursery.transaction")
public class TransactionExceptionHandler {
    
    @ExceptionHandler(TransactionException.class)
    public ResponseEntity<ApiResponse<?>> handleTransactionException(TransactionException ex) {
        log.error("Transaction error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(ex.getMessage()));
    }
}



