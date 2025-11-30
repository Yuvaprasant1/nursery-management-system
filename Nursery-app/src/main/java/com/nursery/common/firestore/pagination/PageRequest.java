package com.nursery.common.firestore.pagination;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageRequest {
    
    @Builder.Default
    private int page = 0;
    
    @Builder.Default
    private int size = 20;
    
    private String cursor; // For cursor-based pagination
    
    @Builder.Default
    private int maxSize = 1000; // Firestore recommended limit
    
    public int getOffset() {
        return page * size;
    }
    
    public int getEffectiveSize() {
        return Math.min(size, maxSize);
    }
    
    public static PageRequest of(int page, int size) {
        return PageRequest.builder()
            .page(page)
            .size(size)
            .build();
    }
    
    public static PageRequest first(int size) {
        return PageRequest.builder()
            .page(0)
            .size(size)
            .build();
    }
}

