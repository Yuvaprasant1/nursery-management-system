package com.nursery.dashboard.controller;

import com.nursery.common.dto.ApiResponse;
import com.nursery.dashboard.dto.response.DashboardSummaryDTO;
import com.nursery.transaction.dto.response.RecentTransactionDTO;
import com.nursery.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    
    private final DashboardService dashboardService;
    
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDTO>> getSummary(
            @RequestParam(required = true, name = "nurseryId") String nurseryId,
            @RequestParam(required = false, name = "period") String period) {
        DashboardSummaryDTO summary = dashboardService.getSummary(nurseryId, period);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
    
    @GetMapping("/recent-transactions")
    public ResponseEntity<ApiResponse<List<RecentTransactionDTO>>> getRecentTransactions(
            @RequestParam(required = true, name = "nurseryId") String nurseryId) {
        List<RecentTransactionDTO> transactions = dashboardService.getRecentTransactions(nurseryId);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }
}

