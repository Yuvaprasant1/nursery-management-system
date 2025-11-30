package com.nursery.dashboard.exception.handler;

import com.nursery.common.dto.ApiResponse;
import com.nursery.dashboard.exception.DashboardException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Exception handler for Dashboard package
 * Handles all dashboard-related exceptions
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.nursery.dashboard")
public class DashboardExceptionHandler {
    
    @ExceptionHandler(DashboardException.class)
    public ResponseEntity<ApiResponse<?>> handleDashboardException(DashboardException ex) {
        log.error("Dashboard error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(ex.getMessage()));
    }
}



