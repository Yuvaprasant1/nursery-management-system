package com.nursery.common.firestore.pagination;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {
    
    private List<T> content;
    
    private int page;
    
    private int size;
    
    private long totalElements;
    
    private boolean hasNext;
    
    private String nextCursor; // For cursor-based pagination
    
    public int getTotalPages() {
        return size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
    }
    
    public boolean hasPrevious() {
        return page > 0;
    }
    
    public boolean isFirst() {
        return !hasPrevious();
    }
    
    public boolean isLast() {
        return !hasNext;
    }
    
    public static <T> PageResult<T> of(List<T> content, PageRequest pageRequest, long totalElements) {
        return PageResult.<T>builder()
            .content(content)
            .page(pageRequest.getPage())
            .size(pageRequest.getEffectiveSize())
            .totalElements(totalElements)
            .hasNext(content.size() == pageRequest.getEffectiveSize() && 
                    (pageRequest.getPage() + 1) * pageRequest.getEffectiveSize() < totalElements)
            .build();
    }
    
    public static <T> PageResult<T> of(List<T> content, PageRequest pageRequest, String nextCursor) {
        return PageResult.<T>builder()
            .content(content)
            .page(pageRequest.getPage())
            .size(pageRequest.getEffectiveSize())
            .totalElements(content.size())
            .hasNext(nextCursor != null)
            .nextCursor(nextCursor)
            .build();
    }
}

