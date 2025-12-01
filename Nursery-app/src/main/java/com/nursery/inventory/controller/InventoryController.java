package com.nursery.inventory.controller;

import com.nursery.common.dto.ApiResponse;
import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.inventory.dto.response.InventoryResponseDTO;
import com.nursery.inventory.service.InventoryService;
import com.nursery.transaction.dto.request.TransactionRequestDTO;
import com.nursery.transaction.dto.response.TransactionResponseDTO;
import com.nursery.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {
    
    private final InventoryService inventoryService;
    private final TransactionService transactionService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<?>> findAll(
            @RequestParam(required = true, name = "nurseryId") String nurseryId,
            @RequestParam(required = false, name = "saplingId") String saplingId,
            @RequestParam(required = false, name = "search") String search,
            @RequestParam(required = false, name = "page") Integer page,
            @RequestParam(required = false, name = "size") Integer size) {
        
        log.debug("REST request to get inventory: nurseryId={}, saplingId={}, search='{}', page={}, size={}",
                nurseryId, saplingId, search, page, size);
        
        // If pagination parameters are provided, use paginated endpoint
        if (page != null || size != null) {
            int pageNumber = (page != null && page >= 0) ? page : 0;
            int pageSize = (size != null && size > 0) ? size : 20;
            PageRequest pageRequest = PageRequest.of(pageNumber, pageSize);
            PaginatedResponseDTO<InventoryResponseDTO> paginatedResult = inventoryService.findAllPaginated(nurseryId, saplingId, search, pageRequest);
            log.debug("Returning paginated inventory result: totalElements={}, totalPages={}",
                    paginatedResult.getTotalElements(), paginatedResult.getTotalPages());
            return ResponseEntity.ok(ApiResponse.success(paginatedResult));
        }
        
        // Otherwise, return all results (backward compatibility)
        List<InventoryResponseDTO> inventories = inventoryService.findAll(nurseryId, saplingId, search);
        log.debug("Returning {} inventory records (non-paginated)", inventories.size());
        return ResponseEntity.ok(ApiResponse.success(inventories));
    }
    
    @GetMapping("/breed/{breedId}")
    public ResponseEntity<ApiResponse<InventoryResponseDTO>> findByBreedId(@PathVariable("breedId") String breedId) {
        log.debug("REST request to get inventory by breedId={}", breedId);
        InventoryResponseDTO inventory = inventoryService.findByBreedId(breedId);
        return ResponseEntity.ok(ApiResponse.success(inventory));
    }
    
    @PostMapping("/{breedId}/transaction")
    public ResponseEntity<ApiResponse<TransactionResponseDTO>> createTransaction(
            @PathVariable("breedId") String breedId,
            @Valid @RequestBody TransactionRequestDTO request) {
        log.debug("REST request to create inventory transaction for breedId={}", breedId);
        TransactionResponseDTO transaction = transactionService.createTransaction(breedId, request);
        log.info("Created inventory transaction id={} for breedId={}", transaction.getId(), breedId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Transaction created successfully", transaction));
    }
}

