package com.nursery.dashboard.exception;

import com.nursery.common.exception.BusinessException;

public class DashboardException extends BusinessException {
    
    public DashboardException(String message) {
        super(message);
    }
    
    public DashboardException(String message, Throwable cause) {
        super(message, cause);
    }
}



