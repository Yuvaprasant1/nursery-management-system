package com.nursery.common.util;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

/**
 * Audit logging utility for production-grade audit trails
 * Logs sensitive operations for compliance and security monitoring
 */
@Slf4j
public class AuditLogger {

    private static final String AUDIT_LOG_PREFIX = "[AUDIT]";
    private static final String USER_ID_KEY = "userId";
    private static final String OPERATION_KEY = "operation";

    /**
     * Log an audit event
     * @param operation The operation being performed (e.g., "USER_LOGIN", "DATA_DELETE")
     * @param userId The user performing the operation
     * @param details Additional details about the operation
     */
    public static void logAuditEvent(String operation, String userId, String details) {
        try (MDC.MDCCloseable ignored = MDC.putCloseable(USER_ID_KEY, userId);
             MDC.MDCCloseable ignored2 = MDC.putCloseable(OPERATION_KEY, operation)) {
            
            log.info("{} Operation: {} | User: {} | Details: {}", 
                AUDIT_LOG_PREFIX, operation, userId, details);
        }
    }

    /**
     * Log a security-related audit event
     * @param operation The security operation
     * @param userId The user performing the operation
     * @param details Additional details
     */
    public static void logSecurityEvent(String operation, String userId, String details) {
        try (MDC.MDCCloseable ignored = MDC.putCloseable(USER_ID_KEY, userId);
             MDC.MDCCloseable ignored2 = MDC.putCloseable(OPERATION_KEY, operation)) {
            
            log.warn("{} [SECURITY] Operation: {} | User: {} | Details: {}", 
                AUDIT_LOG_PREFIX, operation, userId, details);
        }
    }

    /**
     * Log a data access audit event
     * @param operation The data access operation
     * @param userId The user accessing the data
     * @param resourceType The type of resource being accessed
     * @param resourceId The ID of the resource
     */
    public static void logDataAccess(String operation, String userId, String resourceType, String resourceId) {
        try (MDC.MDCCloseable ignored = MDC.putCloseable(USER_ID_KEY, userId);
             MDC.MDCCloseable ignored2 = MDC.putCloseable(OPERATION_KEY, operation)) {
            
            log.info("{} [DATA_ACCESS] Operation: {} | User: {} | Resource: {} | ID: {}", 
                AUDIT_LOG_PREFIX, operation, userId, resourceType, resourceId);
        }
    }
}

