package com.nursery.dashboard.service;

import com.nursery.transaction.enumeration.TransactionType;
import com.nursery.common.util.DateTimeUtil;
import com.nursery.dashboard.dto.response.DashboardSummaryDTO;
import com.nursery.transaction.dto.response.RecentTransactionDTO;
import com.nursery.transaction.firestore.TransactionDocument;
import com.nursery.transaction.firestore.TransactionFirestoreRepository;
import com.nursery.sapling.firestore.SaplingDocument;
import com.nursery.sapling.firestore.SaplingFirestoreRepository;
import com.nursery.breed.firestore.BreedDocument;
import com.nursery.breed.firestore.BreedFirestoreRepository;
import com.nursery.inventory.firestore.InventoryDocument;
import com.nursery.inventory.firestore.InventoryFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    
    private final TransactionFirestoreRepository transactionRepository;
    private final SaplingFirestoreRepository saplingRepository;
    private final BreedFirestoreRepository breedRepository;
    private final InventoryFirestoreRepository inventoryRepository;
    
    @Override
    public DashboardSummaryDTO getSummary(String nurseryId) {
        return getSummary(nurseryId, null);
    }
    
    @Override
    public DashboardSummaryDTO getSummary(String nurseryId, String period) {
        LocalDateTime endTime = DateTimeUtil.now();
        
        // Get all transactions for nursery (for all-time calculation)
        List<TransactionDocument> allTransactions = transactionRepository.findByNurseryIdAndNotDeleted(nurseryId);
        
        // Calculate sales for different time periods
        Long salesLast48Hours = calculateSalesInPeriod(allTransactions, endTime.minusHours(48), endTime);
        Long salesLastMonth = calculateSalesInPeriod(allTransactions, endTime.minusDays(30), endTime);
        Long salesLastYear = calculateSalesInPeriod(allTransactions, endTime.minusDays(365), endTime);
        Long salesAllTime = calculateSalesInPeriod(allTransactions, LocalDateTime.of(1970, 1, 1, 0, 0), endTime);
        
        // Total sapling count (active saplings in nursery)
        List<SaplingDocument> saplings = saplingRepository.findByNurseryIdAndNotDeleted(nurseryId);
        Long totalSaplingCount = (long) saplings.size();
        
        // Total inventory quantity (sum of all inventory quantities)
        List<InventoryDocument> inventories = inventoryRepository.findByNurseryId(nurseryId);
        Long totalInventoryQuantity = inventories.stream()
            .mapToLong(inv -> inv.getQuantity() != null ? inv.getQuantity() : 0L)
            .sum();
        
        return DashboardSummaryDTO.builder()
            .totalSaplingCount(totalSaplingCount)
            .totalInventoryQuantity(totalInventoryQuantity)
            .salesLast48Hours(salesLast48Hours)
            .salesLastMonth(salesLastMonth)
            .salesLastYear(salesLastYear)
            .salesAllTime(salesAllTime)
            .build();
    }
    
    private Long calculateSalesInPeriod(List<TransactionDocument> allTransactions, LocalDateTime startTime, LocalDateTime endTime) {
        return allTransactions.stream()
            .filter(t -> {
                LocalDateTime createdAt = t.getCreatedAt();
                return createdAt != null && 
                       !createdAt.isBefore(startTime) && 
                       !createdAt.isAfter(endTime) &&
                       t.getType() == TransactionType.SELL;
            })
            .mapToLong(t -> Math.abs(t.getDelta() != null ? t.getDelta() : 0))
            .sum();
    }
    
    @Override
    public List<RecentTransactionDTO> getRecentTransactions(String nurseryId) {
        LocalDateTime endTime = DateTimeUtil.now();
        LocalDateTime startTime = endTime.minusHours(48);
        
        List<TransactionDocument> transactions = transactionRepository.findRecentTransactions(nurseryId, startTime);
        
        // Fetch breed names for all unique breed IDs
        Map<String, String> breedNames = transactions.stream()
            .map(TransactionDocument::getBreedId)
            .distinct()
            .collect(Collectors.toMap(
                breedId -> breedId,
                breedId -> breedRepository.findById(breedId)
                    .map(BreedDocument::getBreedName)
                    .orElse("Unknown")
            ));
        
        final Map<String, String> breedNameMap = breedNames;
        return transactions.stream()
            .map(doc -> toRecentTransactionDTO(doc, breedNameMap.get(doc.getBreedId())))
            .collect(Collectors.toList());
    }
    
    private RecentTransactionDTO toRecentTransactionDTO(TransactionDocument doc, String breedName) {
        RecentTransactionDTO dto = new RecentTransactionDTO();
        dto.setId(doc.getId());
        dto.setBreedId(doc.getBreedId());
        dto.setBreedName(breedName != null ? breedName : "Unknown");
        dto.setDelta(doc.getDelta());
        dto.setType(doc.getType());
        dto.setReason(doc.getReason());
        dto.setUserPhone(doc.getUserPhone());
        dto.setIsDeleted(doc.getIsDeleted());
        dto.setCreatedAt(doc.getCreatedAt());
        return dto;
    }
}
