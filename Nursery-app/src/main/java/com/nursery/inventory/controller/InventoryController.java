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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {
    
    private final InventoryService inventoryService;
    private final TransactionService transactionService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<?>> findAll(
            @RequestParam(required = true, name = "nurseryId") String nurseryId,
            @RequestParam(required = false, name = "page") Integer page,
            @RequestParam(required = false, name = "size") Integer size) {
        
        // If pagination parameters are provided, use paginated endpoint
        if (page != null || size != null) {
            int pageNumber = (page != null && page >= 0) ? page : 0;
            int pageSize = (size != null && size > 0) ? size : 20;
            PageRequest pageRequest = PageRequest.of(pageNumber, pageSize);
            PaginatedResponseDTO<InventoryResponseDTO> paginatedResult = inventoryService.findAllPaginated(nurseryId, pageRequest);
            return ResponseEntity.ok(ApiResponse.success(paginatedResult));
        }
        
        // Otherwise, return all results (backward compatibility)
        List<InventoryResponseDTO> inventories = inventoryService.findAll(nurseryId);
        return ResponseEntity.ok(ApiResponse.success(inventories));
    }
    
    @GetMapping("/breed/{breedId}")
    public ResponseEntity<ApiResponse<InventoryResponseDTO>> findByBreedId(@PathVariable("breedId") String breedId) {
        InventoryResponseDTO inventory = inventoryService.findByBreedId(breedId);
        return ResponseEntity.ok(ApiResponse.success(inventory));
    }
    
    @PostMapping("/{breedId}/transaction")
    public ResponseEntity<ApiResponse<TransactionResponseDTO>> createTransaction(
            @PathVariable("breedId") String breedId,
            @Valid @RequestBody TransactionRequestDTO request) {
        TransactionResponseDTO transaction = transactionService.createTransaction(breedId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Transaction created successfully", transaction));
    }
}

