package com.nursery.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private Long totalSaplingCount;
    private Long totalInventoryQuantity;
    
    // Sales breakdown by time period
    private Long salesLast48Hours;
    private Long salesLastMonth;
    private Long salesLastYear;
    private Long salesAllTime;
}

