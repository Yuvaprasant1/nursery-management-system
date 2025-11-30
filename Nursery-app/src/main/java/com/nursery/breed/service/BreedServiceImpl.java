package com.nursery.breed.service;

import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.exception.EntityNotFoundException;
import com.nursery.common.exception.ValidationException;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.common.firestore.pagination.PageResult;
import com.nursery.nursery.service.NurseryService;
import com.nursery.sapling.firestore.SaplingDocument;
import com.nursery.sapling.service.SaplingService;
import com.nursery.stock.service.StockService;
import com.nursery.transaction.firestore.TransactionFirestoreRepository;
import com.nursery.breed.dto.request.BreedRequestDTO;
import com.nursery.breed.dto.response.BreedResponseDTO;
import com.nursery.breed.firestore.BreedDocument;
import com.nursery.breed.firestore.BreedFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BreedServiceImpl implements BreedService {
    
    private final BreedFirestoreRepository repository;
    private final NurseryService nurseryService;
    private final SaplingService saplingService;
    private final StockService stockService;
    private final TransactionFirestoreRepository transactionRepository;
    private final com.nursery.inventory.firestore.InventoryFirestoreRepository inventoryRepository;
    
    @Override
    public List<BreedResponseDTO> findAll(String nurseryId, String saplingId) {
        List<BreedDocument> breeds;
        
        if (saplingId != null && !saplingId.isEmpty()) {
            breeds = repository.findBySaplingIdAndNotDeleted(saplingId);
        } else {
            breeds = repository.findByNurseryIdAndNotDeleted(nurseryId);
        }
        
        return breeds.stream()
            .sorted(Comparator.comparing(BreedDocument::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public PaginatedResponseDTO<BreedResponseDTO> findAllPaginated(String nurseryId, String saplingId, PageRequest pageRequest) {
        PageResult<BreedDocument> pageResult;
        
        if (saplingId != null && !saplingId.isEmpty()) {
            pageResult = repository.findBySaplingIdAndNotDeletedPaginated(saplingId, pageRequest);
        } else {
            pageResult = repository.findByNurseryIdAndNotDeletedPaginated(nurseryId, pageRequest);
        }
        
        List<BreedResponseDTO> content = pageResult.getContent().stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
        
        return PaginatedResponseDTO.<BreedResponseDTO>builder()
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
    public BreedResponseDTO findById(String id) {
        BreedDocument breed = findByIdEntity(id);
        return toResponseDTO(breed);
    }
    
    @Override
    public BreedResponseDTO create(BreedRequestDTO request) {
        // Validate nursery and sapling exist (before transaction)
        nurseryService.validateExists(request.getNurseryId());
        saplingService.validateExists(request.getSaplingId());

        // Validate sapling belongs to nursery
        SaplingDocument sapling = saplingService.findByIdEntity(request.getSaplingId());
        if (!sapling.getNurseryId().equals(request.getNurseryId())) {
            throw new ValidationException("Sapling does not belong to the specified nursery");
        }
        
        // Check duplicate breed name
        List<BreedDocument> existing = repository.findBySaplingIdAndNotDeleted(request.getSaplingId());
        boolean duplicateExists = existing.stream()
            .anyMatch(b -> b.getBreedName().equals(request.getBreedName()));
        if (duplicateExists) {
            throw new ValidationException("Breed name already exists for this sapling");
        }
        
        // Use transaction for atomic breed and inventory creation
        // IMPORTANT: All reads must be done before any writes
        // Note: This method only does writes (no reads), so it's already compliant
        return repository.runInTransaction(transaction -> {
            // ========== PHASE 1: ALL READS FIRST ==========
            // No reads needed - we already validated everything before transaction
            
            // ========== PHASE 2: ALL WRITES AFTER READS ==========
            BreedDocument breed = toDocument(request);
            
            // Save breed within transaction
            String id = repository.save(breed, transaction);
            breed.setId(id);
            
            // Create inventory for this breed within transaction
            com.nursery.inventory.firestore.InventoryDocument inventory = new com.nursery.inventory.firestore.InventoryDocument();
            inventory.setNurseryId(request.getNurseryId());
            inventory.setBreedId(id);
            inventory.setQuantity(0);
            inventoryRepository.save(inventory, transaction);
            
            log.info("Created breed: {} with inventory (atomic)", id);
            return toResponseDTO(breed);
        });
    }
    
    @Override
    public BreedResponseDTO update(String id, BreedRequestDTO request) {
        BreedDocument breed = findByIdEntity(id);
        
        // Validate sapling exists and belongs to nursery
        saplingService.validateExists(request.getSaplingId());
        SaplingDocument sapling = saplingService.findByIdEntity(request.getSaplingId());
        if (!sapling.getNurseryId().equals(request.getNurseryId())) {
            throw new ValidationException("Sapling does not belong to the specified nursery");
        }
        
        // Check duplicate name (excluding current breed)
        List<BreedDocument> existingBreeds = repository.findBySaplingIdAndNotDeleted(request.getSaplingId());
        boolean duplicateExists = existingBreeds.stream()
            .anyMatch(b -> b.getBreedName().equals(request.getBreedName()) && !b.getId().equals(id));
        if (duplicateExists) {
            throw new ValidationException("Breed name already exists for this sapling");
        }
        
        breed.setBreedName(request.getBreedName());
        breed.setMode(request.getMode());
        breed.setItemsPerSlot(request.getItemsPerSlot());
        breed.setImageUrl(request.getImageUrl());
        
        repository.save(breed);
        log.info("Updated breed: {}", id);
        return toResponseDTO(breed);
    }
    
    @Override
    public void softDelete(String id) {
        BreedDocument breed = findByIdEntity(id);
        breed.softDelete();
        repository.save(breed);
        log.info("Soft deleted breed: {}", id);
    }
    
    @Override
    public void validateExists(String id) {
        if (!repository.existsByIdAndNotDeleted(id)) {
            throw new EntityNotFoundException("Breed", id);
        }
    }
    
    @Override
    public BreedDocument findByIdEntity(String id) {
        return repository.findById(id)
            .filter(b -> !Boolean.TRUE.equals(b.getIsDeleted()))
            .orElseThrow(() -> new EntityNotFoundException("Breed", id));
    }
    
    @Override
    public boolean hasActiveBreeds(String saplingId) {
        // Delegate to repository - kept for backward compatibility
        return repository.existsBySaplingIdAndIsDeletedFalse(saplingId);
    }
    
    @Override
    public boolean hasTransactions(String breedId) {
        List<com.nursery.transaction.firestore.TransactionDocument> transactions = 
            transactionRepository.findByBreedIdAndNotDeleted(breedId);
        return !transactions.isEmpty();
    }
    
    private BreedDocument toDocument(BreedRequestDTO dto) {
        BreedDocument doc = new BreedDocument();
        doc.setNurseryId(dto.getNurseryId());
        doc.setSaplingId(dto.getSaplingId());
        doc.setBreedName(dto.getBreedName());
        doc.setMode(dto.getMode());
        doc.setItemsPerSlot(dto.getItemsPerSlot());
        doc.setImageUrl(dto.getImageUrl());
        return doc;
    }
    
    private BreedResponseDTO toResponseDTO(BreedDocument doc) {
        BreedResponseDTO dto = new BreedResponseDTO();
        dto.setId(doc.getId());
        dto.setNurseryId(doc.getNurseryId());
        dto.setSaplingId(doc.getSaplingId());
        dto.setBreedName(doc.getBreedName());
        dto.setMode(doc.getMode());
        dto.setItemsPerSlot(doc.getItemsPerSlot());
        dto.setImageUrl(doc.getImageUrl());
        dto.setCreatedAt(doc.getCreatedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        return dto;
    }
}
