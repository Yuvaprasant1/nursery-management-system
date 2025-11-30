package com.nursery.transaction.controller;

import com.nursery.common.dto.ApiResponse;
import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.firestore.pagination.PageRequest;
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
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {
    
    private final TransactionService transactionService;
    
    @PostMapping("/breed/{breedId}")
    public ResponseEntity<ApiResponse<TransactionResponseDTO>> createTransaction(
            @PathVariable("breedId") String breedId,
            @Valid @RequestBody TransactionRequestDTO request) {
        TransactionResponseDTO transaction = transactionService.createTransaction(breedId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Transaction created successfully", transaction));
    }
    
    @PostMapping("/{id}/undo")
    public ResponseEntity<ApiResponse<Void>> undoTransaction(@PathVariable("id") String id) {
        transactionService.undoTransaction(id);
        return ResponseEntity.ok(ApiResponse.success("Transaction undone successfully", null));
    }
    
    @PostMapping("/{id}/soft-delete")
    public ResponseEntity<ApiResponse<Void>> softDeleteTransaction(@PathVariable("id") String id) {
        transactionService.softDeleteTransaction(id);
        return ResponseEntity.ok(ApiResponse.success("Transaction deleted successfully", null));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<?>> findAll(
            @RequestParam(required = false, name = "breedId") String breedId,
            @RequestParam(required = false, name = "nurseryId") String nurseryId,
            @RequestParam(required = false, name = "page") Integer page,
            @RequestParam(required = false, name = "size") Integer size) {
        
        // If pagination parameters are provided, use paginated endpoint
        if (page != null || size != null) {
            int pageNumber = (page != null && page >= 0) ? page : 0;
            int pageSize = (size != null && size > 0) ? size : 20;
            PageRequest pageRequest = PageRequest.of(pageNumber, pageSize);
            PaginatedResponseDTO<TransactionResponseDTO> paginatedResult = transactionService.findAllPaginated(breedId, nurseryId, pageRequest);
            return ResponseEntity.ok(ApiResponse.success(paginatedResult));
        }
        
        // Otherwise, return all results (backward compatibility)
        List<TransactionResponseDTO> transactions;
        if (breedId != null) {
            transactions = transactionService.findAll(breedId);
        } else {
            transactions = List.of(); // Return empty list if no breedId provided
        }
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }
    
    @GetMapping("/breed/{breedId}")
    public ResponseEntity<ApiResponse<List<TransactionResponseDTO>>> findByBreedId(@PathVariable("breedId") String breedId) {
        List<TransactionResponseDTO> transactions = transactionService.findAll(breedId);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponseDTO>> findById(@PathVariable("id") String id) {
        TransactionResponseDTO transaction = transactionService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(transaction));
    }
}

