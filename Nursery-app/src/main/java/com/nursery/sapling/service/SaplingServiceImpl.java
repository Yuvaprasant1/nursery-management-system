package com.nursery.sapling.service;

import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.exception.EntityNotFoundException;
import com.nursery.common.exception.ValidationException;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.common.firestore.pagination.PageResult;
import com.nursery.nursery.service.NurseryService;
import com.nursery.breed.service.BreedQueryService;
import com.nursery.sapling.dto.request.SaplingRequestDTO;
import com.nursery.sapling.dto.response.SaplingResponseDTO;
import com.nursery.sapling.firestore.SaplingDocument;
import com.nursery.sapling.firestore.SaplingFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SaplingServiceImpl implements SaplingService {
    
    private final SaplingFirestoreRepository repository;
    private final NurseryService nurseryService;
    private final BreedQueryService breedQueryService;
    
    @Override
    public List<SaplingResponseDTO> findAll(String nurseryId, String search) {
        List<SaplingDocument> saplings = repository.findByNurseryIdAndNotDeleted(nurseryId);
        
        // Filter by search term if provided
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase().trim();
            saplings = saplings.stream()
                .filter(s -> s.getName().toLowerCase().contains(searchLower) ||
                           (s.getDescription() != null && s.getDescription().toLowerCase().contains(searchLower)))
                .collect(Collectors.toList());
        }
        
        return saplings.stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public PaginatedResponseDTO<SaplingResponseDTO> findAllPaginated(String nurseryId, String search, PageRequest pageRequest) {
        // Get all saplings first (for search filtering)
        List<SaplingDocument> allSaplings = repository.findByNurseryIdAndNotDeleted(nurseryId);
        
        // Filter by search term if provided
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase().trim();
            allSaplings = allSaplings.stream()
                .filter(s -> s.getName().toLowerCase().contains(searchLower) ||
                           (s.getDescription() != null && s.getDescription().toLowerCase().contains(searchLower)))
                .collect(Collectors.toList());
        }
        
        // Sort by updatedAt descending
        allSaplings = allSaplings.stream()
            .sorted((a, b) -> {
                if (a.getUpdatedAt() == null || b.getUpdatedAt() == null) return 0;
                return b.getUpdatedAt().compareTo(a.getUpdatedAt());
            })
            .collect(Collectors.toList());
        
        // Apply pagination
        long totalElements = allSaplings.size();
        int start = pageRequest.getOffset();
        int end = Math.min(start + pageRequest.getEffectiveSize(), allSaplings.size());
        List<SaplingDocument> paginatedSaplings = start < allSaplings.size() 
            ? allSaplings.subList(start, end)
            : new ArrayList<>();
        
        List<SaplingResponseDTO> content = paginatedSaplings.stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
        
        PageResult<SaplingDocument> pageResult = PageResult.of(paginatedSaplings, pageRequest, totalElements);
        
        return PaginatedResponseDTO.<SaplingResponseDTO>builder()
            .content(content)
            .totalElements(pageResult.getTotalElements())
            .totalPages(pageResult.getTotalPages())
            .size(pageResult.getSize())
            .number(pageResult.getPage())
            .hasNext(pageResult.isHasNext())
            .hasPrevious(pageResult.hasPrevious())
            .isFirst(pageResult.isFirst())
            .isLast(pageResult.isLast())
            .build();
    }
    
    @Override
    public SaplingResponseDTO findById(String id) {
        SaplingDocument sapling = findByIdEntity(id);
        return toResponseDTO(sapling);
    }
    
    @Override
    public SaplingResponseDTO create(SaplingRequestDTO request) {
        // Validate nursery exists
        nurseryService.validateExists(request.getNurseryId());
        
        // Check duplicate name
        List<SaplingDocument> existing = repository.findByNurseryIdAndNotDeleted(request.getNurseryId());
        boolean duplicateExists = existing.stream()
            .anyMatch(p -> p.getName().equals(request.getName()));
        if (duplicateExists) {
            throw new ValidationException("Sapling name already exists in this nursery");
        }
        
        SaplingDocument sapling = toDocument(request);
        String id = repository.save(sapling);
        log.info("Created sapling: {}", id);
        return toResponseDTO(sapling);
    }
    
    @Override
    public SaplingResponseDTO update(String id, SaplingRequestDTO request) {
        SaplingDocument sapling = findByIdEntity(id);
        
        // Validate nursery exists
        nurseryService.validateExists(request.getNurseryId());
        
        // Check duplicate name (excluding current sapling)
        List<SaplingDocument> existing = repository.findByNurseryIdAndNotDeleted(request.getNurseryId());
        boolean duplicateExists = existing.stream()
            .anyMatch(p -> p.getName().equals(request.getName()) && !p.getId().equals(id));
        if (duplicateExists) {
            throw new ValidationException("Sapling name already exists in this nursery");
        }
        
        sapling.setName(request.getName());
        sapling.setDescription(request.getDescription());
        sapling.setImageUrl(request.getImageUrl());
        repository.save(sapling);
        log.info("Updated sapling: {}", id);
        return toResponseDTO(sapling);
    }
    
    @Override
    public void softDelete(String id) {
        SaplingDocument sapling = findByIdEntity(id);
        
        // Check if has active breeds
        if (breedQueryService.hasActiveBreeds(id)) {
            throw new ValidationException("Cannot delete sapling with active breeds");
        }
        
        sapling.softDelete();
        repository.save(sapling);
        log.info("Soft deleted sapling: {}", id);
    }
    
    @Override
    public void validateExists(String id) {
        if (!repository.existsByIdAndNotDeleted(id)) {
            throw new EntityNotFoundException("Sapling", id);
        }
    }
    
    @Override
    public SaplingDocument findByIdEntity(String id) {
        return repository.findById(id)
            .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
            .orElseThrow(() -> new EntityNotFoundException("Sapling", id));
    }
    
    private SaplingDocument toDocument(SaplingRequestDTO dto) {
        SaplingDocument doc = new SaplingDocument();
        doc.setNurseryId(dto.getNurseryId());
        doc.setName(dto.getName());
        doc.setDescription(dto.getDescription());
        doc.setImageUrl(dto.getImageUrl());
        return doc;
    }
    
    private SaplingResponseDTO toResponseDTO(SaplingDocument doc) {
        SaplingResponseDTO dto = new SaplingResponseDTO();
        dto.setId(doc.getId());
        dto.setNurseryId(doc.getNurseryId());
        dto.setName(doc.getName());
        dto.setDescription(doc.getDescription());
        dto.setImageUrl(doc.getImageUrl());
        dto.setCreatedAt(doc.getCreatedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        return dto;
    }
}

