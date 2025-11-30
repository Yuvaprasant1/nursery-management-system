package com.nursery.dashboard.service;

import com.nursery.dashboard.dto.response.DashboardSummaryDTO;
import com.nursery.transaction.dto.response.RecentTransactionDTO;

import java.util.List;

public interface DashboardService {
    DashboardSummaryDTO getSummary(String nurseryId);
    DashboardSummaryDTO getSummary(String nurseryId, String period);
    List<RecentTransactionDTO> getRecentTransactions(String nurseryId);
}

