package com.nursery.common.util;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DateTimeUtil {
    
    public static LocalDateTime now() {
        return LocalDateTime.now();
    }
    
    public static LocalDateTime startOfDay(LocalDateTime date) {
        return date.toLocalDate().atStartOfDay();
    }
    
    public static LocalDateTime endOfDay(LocalDateTime date) {
        return date.toLocalDate().atTime(23, 59, 59, 999999999);
    }
    
    public static LocalDateTime startOfToday() {
        return LocalDateTime.now().toLocalDate().atStartOfDay();
    }
    
    public static LocalDateTime endOfToday() {
        return LocalDateTime.now().toLocalDate().atTime(23, 59, 59, 999999999);
    }
}

