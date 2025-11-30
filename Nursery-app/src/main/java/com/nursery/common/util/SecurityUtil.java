package com.nursery.common.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class SecurityUtil {
    
    public static String getCurrentUserPhone() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getName().equals("anonymousUser")) {
                // Phone is stored in authentication details as a Map
                Object details = authentication.getDetails();
                if (details instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> detailsMap = (Map<String, Object>) details;
                    Object phone = detailsMap.get("phone");
                    if (phone != null) {
                        return phone.toString();
                    }
                }
            }
        } catch (Exception e) {
            // Ignore if security context not available
        }
        return "SYSTEM";
    }

    public static Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getName().equals("anonymousUser")) {
                String userIdStr = authentication.getName();
                try {
                    return Long.parseLong(userIdStr);
                } catch (NumberFormatException e) {
                    // If it's not a number (Firestore String ID), return null or handle differently
                    return null;
                }
            }
        } catch (Exception e) {
            // Ignore if security context not available
        }
        return 0L;
    }
    
    public static String getCurrentUserIdAsString() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getName().equals("anonymousUser")) {
                return authentication.getName();
            }
        } catch (Exception e) {
            // Ignore if security context not available
        }
        return "SYSTEM";
    }
}

