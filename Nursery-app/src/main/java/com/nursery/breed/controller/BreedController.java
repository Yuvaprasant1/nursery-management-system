package com.nursery.breed.controller;

import com.nursery.common.dto.ApiResponse;
import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.breed.dto.request.BreedRequestDTO;
import com.nursery.breed.dto.response.BreedResponseDTO;
import com.nursery.breed.service.BreedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/breeds")
@RequiredArgsConstructor
public class BreedController {
    
    private final BreedService breedService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<?>> findAll(
            @RequestParam(required = true, name = "nurseryId") String nurseryId,
            @RequestParam(required = false, name = "saplingId") String saplingId,
            @RequestParam(required = false, name = "search") String search,
            @RequestParam(required = false, name = "page") Integer page,
            @RequestParam(required = false, name = "size") Integer size) {
        
        log.debug("REST request to get breeds: nurseryId={}, saplingId={}, search='{}', page={}, size={}",
                nurseryId, saplingId, search, page, size);
        
        // If pagination parameters are provided, use paginated endpoint
        if (page != null || size != null) {
            int pageNumber = (page != null && page >= 0) ? page : 0;
            int pageSize = (size != null && size > 0) ? size : 20;
            PageRequest pageRequest = PageRequest.of(pageNumber, pageSize);
            PaginatedResponseDTO<BreedResponseDTO> paginatedResult = breedService.findAllPaginated(nurseryId, saplingId, search, pageRequest);
            log.debug("Returning paginated breeds result: totalElements={}, totalPages={}",
                    paginatedResult.getTotalElements(), paginatedResult.getTotalPages());
            return ResponseEntity.ok(ApiResponse.success(paginatedResult));
        }
        
        // Otherwise, return all results (backward compatibility)
        List<BreedResponseDTO> breeds = breedService.findAll(nurseryId, saplingId, search);
        log.debug("Returning {} breeds (non-paginated)", breeds.size());
        return ResponseEntity.ok(ApiResponse.success(breeds));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BreedResponseDTO>> findById(@PathVariable("id") String id) {
        log.debug("REST request to get breed id={}", id);
        BreedResponseDTO breed = breedService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(breed));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<BreedResponseDTO>> create(@Valid @RequestBody BreedRequestDTO request) {
        log.debug("REST request to create breed for nurseryId={} saplingId={}",
                request.getNurseryId(), request.getSaplingId());
        BreedResponseDTO breed = breedService.create(request);
        log.info("Created breed id={} for nurseryId={} saplingId={}",
                breed.getId(), breed.getNurseryId(), breed.getSaplingId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Breed created successfully", breed));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BreedResponseDTO>> update(
            @PathVariable("id") String id,
            @Valid @RequestBody BreedRequestDTO request) {
        log.debug("REST request to update breed id={}", id);
        BreedResponseDTO breed = breedService.update(id, request);
        log.info("Updated breed id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Breed updated successfully", breed));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable("id") String id) {
        log.debug("REST request to soft delete breed id={}", id);
        breedService.softDelete(id);
        log.info("Soft deleted breed id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Breed deleted successfully", null));
    }
    
    @GetMapping("/{id}/has-transactions")
    public ResponseEntity<ApiResponse<Boolean>> hasTransactions(@PathVariable("id") String id) {
        log.debug("REST request to check if breed id={} has transactions", id);
        boolean hasTransactions = breedService.hasTransactions(id);
        return ResponseEntity.ok(ApiResponse.success(hasTransactions));
    }
}

