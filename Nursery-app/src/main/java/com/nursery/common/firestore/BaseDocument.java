package com.nursery.common.firestore;

import com.nursery.common.util.SecurityUtil;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public abstract class BaseDocument {
    
    private String id;
    
    private LocalDateTime createdAt;
    
    private Long createdBy;
    
    private LocalDateTime updatedAt;
    
    private Long updatedBy;
    
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (createdBy == null) {
            createdBy = SecurityUtil.getCurrentUserId();
        }
        if (updatedBy == null) {
            updatedBy = SecurityUtil.getCurrentUserId();
        }
    }
    
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        updatedBy = SecurityUtil.getCurrentUserId();
    }
}

