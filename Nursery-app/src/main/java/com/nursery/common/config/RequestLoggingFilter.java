package com.nursery.common.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.util.UUID;

/**
 * Request/Response logging filter with correlation IDs
 * Logs all incoming requests and responses for production monitoring
 */
@Slf4j
@Component
@Order(2)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // Generate or extract correlation ID
        String correlationId = getOrGenerateCorrelationId(request);
        MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
        response.setHeader(CORRELATION_ID_HEADER, correlationId);

        long startTime = System.currentTimeMillis();
        
        // Wrap request/response to enable reading body multiple times
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        try {
            // Log incoming request
            logRequest(wrappedRequest, correlationId);
            
            filterChain.doFilter(wrappedRequest, wrappedResponse);
            
        } finally {
            // Log response
            long duration = System.currentTimeMillis() - startTime;
            logResponse(wrappedResponse, correlationId, duration);
            
            // Copy response body back to original response
            wrappedResponse.copyBodyToResponse();
            
            // Clear MDC
            MDC.clear();
        }
    }

    private String getOrGenerateCorrelationId(HttpServletRequest request) {
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = UUID.randomUUID().toString();
        }
        return correlationId;
    }

    private void logRequest(ContentCachingRequestWrapper request, String correlationId) {
        if (log.isDebugEnabled()) {
            log.debug("Incoming request [{}] {} {} from {} - Correlation ID: {}", 
                request.getMethod(),
                request.getRequestURI(),
                request.getQueryString() != null ? "?" + request.getQueryString() : "",
                request.getRemoteAddr(),
                correlationId
            );
        } else {
            log.info("Incoming request [{}] {} - Correlation ID: {}", 
                request.getMethod(),
                request.getRequestURI(),
                correlationId
            );
        }
    }

    private void logResponse(ContentCachingResponseWrapper response, String correlationId, long duration) {
        int status = response.getStatus();
        
        if (log.isDebugEnabled()) {
            log.debug("Outgoing response [{}] - Duration: {}ms - Correlation ID: {}", 
                status, duration, correlationId);
        } else {
            log.info("Outgoing response [{}] - Duration: {}ms - Correlation ID: {}", 
                status, duration, correlationId);
        }
    }
}

