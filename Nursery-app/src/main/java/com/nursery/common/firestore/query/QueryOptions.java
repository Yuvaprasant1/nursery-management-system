package com.nursery.common.firestore.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryOptions {
    
    @Builder.Default
    private Integer limit = null; // null means no limit (use default max)
    
    @Builder.Default
    private String orderByField = null;
    
    @Builder.Default
    private boolean ascending = true;
    
    @Builder.Default
    private Integer maxResults = 1000; // Firestore recommended limit
    
    public int getEffectiveLimit() {
        if (limit == null) {
            return maxResults;
        }
        return Math.min(limit, maxResults);
    }
    
    public static QueryOptions defaultOptions() {
        return QueryOptions.builder().build();
    }
    
    public static QueryOptions withLimit(int limit) {
        return QueryOptions.builder()
            .limit(limit)
            .build();
    }
    
    public static QueryOptions withOrderBy(String field, boolean ascending) {
        return QueryOptions.builder()
            .orderByField(field)
            .ascending(ascending)
            .build();
    }
}

