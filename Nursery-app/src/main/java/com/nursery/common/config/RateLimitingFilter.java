package com.nursery.common.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Rate limiting filter to prevent abuse
 * Implements simple in-memory rate limiting per IP address
 * For production, consider using Redis-based rate limiting
 */
@Slf4j
@Component
@Order(3)
public class RateLimitingFilter extends OncePerRequestFilter {

    @Value("${rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${rate-limit.requests-per-minute:60}")
    private int requestsPerMinute;

    private final Cache<String, RateLimitInfo> rateLimitCache = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        if (!rateLimitEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip rate limiting for actuator endpoints
        if (request.getRequestURI().startsWith("/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientId = getClientIdentifier(request);
        RateLimitInfo rateLimitInfo = rateLimitCache.get(clientId, key -> new RateLimitInfo());

        synchronized (rateLimitInfo) {
            long now = System.currentTimeMillis();
            
            // Reset counter if a minute has passed
            if (now - rateLimitInfo.getFirstRequestTime() > 60_000) {
                rateLimitInfo.reset();
            }

            rateLimitInfo.incrementRequestCount();

            if (rateLimitInfo.getRequestCount() > requestsPerMinute) {
                log.warn("Rate limit exceeded for client: {} - {} requests in the last minute", 
                    clientId, rateLimitInfo.getRequestCount());
                
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write(
                    "{\"success\":false,\"message\":\"Rate limit exceeded. Please try again later.\"}"
                );
                return;
            }
        }

        // Add rate limit headers
        response.setHeader("X-RateLimit-Limit", String.valueOf(requestsPerMinute));
        response.setHeader("X-RateLimit-Remaining", 
            String.valueOf(Math.max(0, requestsPerMinute - rateLimitInfo.getRequestCount())));

        filterChain.doFilter(request, response);
    }

    private String getClientIdentifier(HttpServletRequest request) {
        // Try to get IP from X-Forwarded-For header (for load balancers/proxies)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        // Fallback to remote address
        return request.getRemoteAddr();
    }

    private static class RateLimitInfo {
        private int requestCount = 0;
        private long firstRequestTime = System.currentTimeMillis();

        public synchronized void incrementRequestCount() {
            requestCount++;
        }

        public synchronized void reset() {
            requestCount = 1;
            firstRequestTime = System.currentTimeMillis();
        }

        public int getRequestCount() {
            return requestCount;
        }

        public long getFirstRequestTime() {
            return firstRequestTime;
        }
    }
}

