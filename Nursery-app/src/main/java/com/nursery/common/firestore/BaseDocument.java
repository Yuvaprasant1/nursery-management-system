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
    
    private String createdBy;
    
    private LocalDateTime updatedAt;
    
    private String updatedBy;
    
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (createdBy == null) {
            createdBy = SecurityUtil.getCurrentUserIdAsString();
        }
        if (updatedBy == null) {
            updatedBy = SecurityUtil.getCurrentUserIdAsString();
        }
    }
    
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        updatedBy = SecurityUtil.getCurrentUserIdAsString();
    }
}

