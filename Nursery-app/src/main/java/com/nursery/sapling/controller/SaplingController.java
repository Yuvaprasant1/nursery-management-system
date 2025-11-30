package com.nursery.sapling.controller;

import com.nursery.common.dto.ApiResponse;
import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.sapling.dto.request.SaplingRequestDTO;
import com.nursery.sapling.dto.response.SaplingResponseDTO;
import com.nursery.sapling.service.SaplingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/saplings")
@RequiredArgsConstructor
public class SaplingController {
    
    private final SaplingService saplingService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<?>> findAll(
            @RequestParam(required = true, name = "nurseryId") String nurseryId,
            @RequestParam(required = false, name = "search") String search,
            @RequestParam(required = false, name = "page") Integer page,
            @RequestParam(required = false, name = "size") Integer size) {
        
        // If pagination parameters are provided, use paginated endpoint
        if (page != null || size != null) {
            int pageNumber = (page != null && page >= 0) ? page : 0;
            int pageSize = (size != null && size > 0) ? size : 20;
            PageRequest pageRequest = PageRequest.of(pageNumber, pageSize);
            PaginatedResponseDTO<SaplingResponseDTO> paginatedResult = saplingService.findAllPaginated(nurseryId, search, pageRequest);
            return ResponseEntity.ok(ApiResponse.success(paginatedResult));
        }
        
        // Otherwise, return all results (backward compatibility)
        List<SaplingResponseDTO> saplings = saplingService.findAll(nurseryId, search);
        return ResponseEntity.ok(ApiResponse.success(saplings));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SaplingResponseDTO>> findById(@PathVariable("id") String id) {
        SaplingResponseDTO sapling = saplingService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(sapling));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<SaplingResponseDTO>> create(@Valid @RequestBody SaplingRequestDTO request) {
        SaplingResponseDTO sapling = saplingService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Sapling created successfully", sapling));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SaplingResponseDTO>> update(
            @PathVariable("id") String id,
            @Valid @RequestBody SaplingRequestDTO request) {
        SaplingResponseDTO sapling = saplingService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Sapling updated successfully", sapling));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable("id") String id) {
        saplingService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Sapling deleted successfully", null));
    }
}

