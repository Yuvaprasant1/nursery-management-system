package com.nursery.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaginatedResponseDTO<T> {
    
    private List<T> content;
    
    private long totalElements;
    
    private int totalPages;
    
    private int size;
    
    private int number; // Current page number (0-indexed)
    
    private boolean hasNext;
    
    private boolean hasPrevious;
    
    private boolean isFirst;
    
    private boolean isLast;
}

