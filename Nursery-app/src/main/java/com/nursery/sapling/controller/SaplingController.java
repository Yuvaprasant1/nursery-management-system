package com.nursery.sapling.controller;

import com.nursery.common.dto.ApiResponse;
import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.sapling.dto.request.SaplingRequestDTO;
import com.nursery.sapling.dto.response.SaplingResponseDTO;
import com.nursery.sapling.service.SaplingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
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
        
        log.debug("REST request to get saplings: nurseryId={}, search='{}', page={}, size={}",
                nurseryId, search, page, size);
        
        // If pagination parameters are provided, use paginated endpoint
        if (page != null || size != null) {
            int pageNumber = (page != null && page >= 0) ? page : 0;
            int pageSize = (size != null && size > 0) ? size : 20;
            PageRequest pageRequest = PageRequest.of(pageNumber, pageSize);
            PaginatedResponseDTO<SaplingResponseDTO> paginatedResult = saplingService.findAllPaginated(nurseryId, search, pageRequest);
            log.debug("Returning paginated saplings result: totalElements={}, totalPages={}",
                    paginatedResult.getTotalElements(), paginatedResult.getTotalPages());
            return ResponseEntity.ok(ApiResponse.success(paginatedResult));
        }
        
        // Otherwise, return all results (backward compatibility)
        List<SaplingResponseDTO> saplings = saplingService.findAll(nurseryId, search);
        log.debug("Returning {} saplings (non-paginated)", saplings.size());
        return ResponseEntity.ok(ApiResponse.success(saplings));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SaplingResponseDTO>> findById(@PathVariable("id") String id) {
        log.debug("REST request to get sapling id={}", id);
        SaplingResponseDTO sapling = saplingService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(sapling));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<SaplingResponseDTO>> create(@Valid @RequestBody SaplingRequestDTO request) {
        log.debug("REST request to create sapling for nurseryId={}", request.getNurseryId());
        SaplingResponseDTO sapling = saplingService.create(request);
        log.info("Created sapling id={} for nurseryId={}", sapling.getId(), sapling.getNurseryId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Sapling created successfully", sapling));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SaplingResponseDTO>> update(
            @PathVariable("id") String id,
            @Valid @RequestBody SaplingRequestDTO request) {
        log.debug("REST request to update sapling id={}", id);
        SaplingResponseDTO sapling = saplingService.update(id, request);
        log.info("Updated sapling id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Sapling updated successfully", sapling));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable("id") String id) {
        log.debug("REST request to soft delete sapling id={}", id);
        saplingService.softDelete(id);
        log.info("Soft deleted sapling id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Sapling deleted successfully", null));
    }
}

