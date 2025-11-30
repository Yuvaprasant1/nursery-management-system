package com.nursery.common.exception;

import com.nursery.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    
    /**
     * Recursively unwraps exception chain to find the root ValidationException, BusinessException, or EntityNotFoundException
     * Handles deeply nested exceptions like: RuntimeException -> ExecutionException -> RuntimeException -> ValidationException
     */
    private Throwable unwrapException(Throwable throwable) {
        if (throwable == null) {
            return null;
        }
        
        // If this is a known exception type, return it
        if (throwable instanceof BusinessException) {
            return throwable;
        }
        
        // Recursively check the cause (this will handle all nesting levels)
        Throwable cause = throwable.getCause();
        if (cause != null) {
            Throwable unwrapped = unwrapException(cause);
            if (unwrapped != null) {
                return unwrapped;
            }
        }
        
        // If no known exception found in the chain, return null
        return null;
    }
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleEntityNotFound(EntityNotFoundException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        log.error("Entity not found: {} | Correlation ID: {}", ex.getMessage(), correlationId);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .header(CORRELATION_ID_HEADER, correlationId)
            .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(ValidationException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        log.error("Validation error: {} | Correlation ID: {}", ex.getMessage(), correlationId);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .header(CORRELATION_ID_HEADER, correlationId)
            .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<?>> handleBusinessException(BusinessException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        log.error("Business error: {} | Correlation ID: {}", ex.getMessage(), correlationId);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .header(CORRELATION_ID_HEADER, correlationId)
            .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        log.error("Validation errors: {} | Correlation ID: {}", errors, correlationId);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .header(CORRELATION_ID_HEADER, correlationId)
            .body(new ApiResponse<>(false, "Validation failed", errors, java.time.LocalDateTime.now()));
    }
    
    @ExceptionHandler(com.nursery.common.firestore.exception.FirestoreException.class)
    public ResponseEntity<ApiResponse<?>> handleFirestoreException(
            com.nursery.common.firestore.exception.FirestoreException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        log.error("Firestore error: {} | Correlation ID: {}", ex.getMessage(), correlationId, ex);
        
        if (ex instanceof com.nursery.common.firestore.exception.FirestoreDocumentNotFoundException) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .header(CORRELATION_ID_HEADER, correlationId)
                .body(ApiResponse.error(ex.getMessage()));
        }
        
        if (ex instanceof com.nursery.common.firestore.exception.FirestoreValidationException) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .header(CORRELATION_ID_HEADER, correlationId)
                .body(ApiResponse.error(ex.getMessage()));
        }
        
        if (ex instanceof com.nursery.common.firestore.exception.FirestoreConnectionException) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .header(CORRELATION_ID_HEADER, correlationId)
                .body(ApiResponse.error("Database connection error. Please try again later."));
        }
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .header(CORRELATION_ID_HEADER, correlationId)
            .body(ApiResponse.error("Database error: " + ex.getMessage()));
    }
    
    /**
     * Handle ExecutionException (from Firestore transactions) and unwrap to find the actual exception
     */
    @ExceptionHandler(java.util.concurrent.ExecutionException.class)
    public ResponseEntity<ApiResponse<?>> handleExecutionException(
            java.util.concurrent.ExecutionException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        log.error("Execution exception: | Correlation ID: {}", correlationId, ex);
        
        // Recursively unwrap to find the root exception
        Throwable unwrapped = unwrapException(ex);
        if (unwrapped instanceof ValidationException) {
            return handleValidation((ValidationException) unwrapped, request);
        }
        if (unwrapped instanceof BusinessException) {
            return handleBusinessException((BusinessException) unwrapped, request);
        }

        // If we can't unwrap to a known exception, return generic error with the message
        Throwable cause = ex.getCause();
        String message = cause != null ? cause.getMessage() : ex.getMessage();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .header(CORRELATION_ID_HEADER, correlationId)
            .body(ApiResponse.error(message != null ? message : "An unexpected error occurred"));
    }
    
    /**
     * Handle RuntimeException and unwrap to find ValidationException or BusinessException
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<?>> handleRuntimeException(RuntimeException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        log.error("Runtime exception: | Correlation ID: {}", correlationId, ex);
        
        // If it's a Firestore exception, let the Firestore handler deal with it
        if (ex instanceof com.nursery.common.firestore.exception.FirestoreException) {
            return handleFirestoreException((com.nursery.common.firestore.exception.FirestoreException) ex, request);
        }
        
        // Recursively unwrap to find the root exception
        Throwable unwrapped = unwrapException(ex);
        if (unwrapped instanceof ValidationException) {
            return handleValidation((ValidationException) unwrapped, request);
        }
        if (unwrapped instanceof BusinessException) {
            return handleBusinessException((BusinessException) unwrapped, request);
        }

        // If message contains "Transaction failed", try to extract the actual error
        if (ex.getMessage() != null && ex.getMessage().contains("Transaction failed")) {
            Throwable cause = ex.getCause();
            if (cause != null) {
                Throwable deepUnwrapped = unwrapException(cause);
                if (deepUnwrapped instanceof ValidationException) {
                    return handleValidation((ValidationException) deepUnwrapped, request);
                }
                if (deepUnwrapped instanceof BusinessException) {
                    return handleBusinessException((BusinessException) deepUnwrapped, request);
                }
            }
        }
        
        // Otherwise, return generic error with the message
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .header(CORRELATION_ID_HEADER, correlationId)
            .body(ApiResponse.error(ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred"));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        log.error("Unexpected error: | Correlation ID: {}", correlationId, ex);
        
        // Recursively unwrap to find the root exception
        Throwable unwrapped = unwrapException(ex);
        if (unwrapped instanceof ValidationException) {
            return handleValidation((ValidationException) unwrapped, request);
        }
        if (unwrapped instanceof BusinessException) {
            return handleBusinessException((BusinessException) unwrapped, request);
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .header(CORRELATION_ID_HEADER, correlationId)
            .body(ApiResponse.error("An unexpected error occurred"));
    }
    
    private String getCorrelationId(HttpServletRequest request) {
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = MDC.get("correlationId");
        }
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = "unknown";
        }
        return correlationId;
    }
}

