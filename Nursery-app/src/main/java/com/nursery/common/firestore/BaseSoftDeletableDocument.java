package com.nursery.common.firestore;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public abstract class BaseSoftDeletableDocument extends BaseDocument {
    
    private Boolean isDeleted = false;
    
    private Long deletedBy;
    
    private LocalDateTime deletedAt;
    
    public void softDelete() {
        setIsDeleted(true);
        setDeletedBy(com.nursery.common.util.SecurityUtil.getCurrentUserId());
        setDeletedAt(LocalDateTime.now());
        onUpdate();
    }
}

