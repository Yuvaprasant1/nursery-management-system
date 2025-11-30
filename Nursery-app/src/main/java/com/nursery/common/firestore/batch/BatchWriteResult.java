package com.nursery.common.firestore.batch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchWriteResult {
    
    private int successCount;
    
    private int failureCount;
    
    private List<String> successfulIds;
    
    private List<BatchWriteError> errors;
    
    public boolean hasFailures() {
        return failureCount > 0;
    }
    
    public boolean isAllSuccessful() {
        return failureCount == 0;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchWriteError {
        private String documentId;
        private String errorMessage;
        private Throwable cause;
    }
}

