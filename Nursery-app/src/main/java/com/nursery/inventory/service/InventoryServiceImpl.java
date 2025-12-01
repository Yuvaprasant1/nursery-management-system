package com.nursery.inventory.service;

import com.google.cloud.firestore.Transaction;
import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.exception.EntityNotFoundException;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.common.firestore.pagination.PageResult;
import com.nursery.stock.service.StockService;
import com.nursery.breed.firestore.BreedFirestoreRepository;
import com.nursery.inventory.dto.response.InventoryResponseDTO;
import com.nursery.inventory.firestore.InventoryDocument;
import com.nursery.inventory.firestore.InventoryFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {
    
    private final InventoryFirestoreRepository repository;
    private final StockService stockService;
    private final BreedFirestoreRepository breedRepository;
    
    @Override
    public List<InventoryResponseDTO> findAll(String nurseryId, String saplingId, String search) {
        // Get breeds first (optimized approach - similar to BreedService)
        List<com.nursery.breed.firestore.BreedDocument> breeds;
        
        if (saplingId != null && !saplingId.isEmpty()) {
            breeds = breedRepository.findBySaplingIdAndNotDeleted(saplingId);
        } else {
            breeds = breedRepository.findByNurseryIdAndNotDeleted(nurseryId);
        }
        
        // Filter by search term if provided (search by breed name)
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase().trim();
            breeds = breeds.stream()
                .filter(b -> b.getBreedName().toLowerCase().contains(searchLower))
                .collect(Collectors.toList());
        }
        
        // Get breed IDs from filtered breeds
        List<String> breedIds = breeds.stream()
            .map(com.nursery.breed.firestore.BreedDocument::getId)
            .collect(Collectors.toList());
        
        // Get inventory by breed IDs (or by nurseryId if no breeds)
        List<InventoryDocument> inventories;
        if (!breedIds.isEmpty()) {
            inventories = repository.findByBreedIds(nurseryId, breedIds);
        } else {
            // No breeds match, return empty list
            inventories = new java.util.ArrayList<>();
        }
        
        // Sort by updatedAt descending (similar to BreedService)
        inventories = inventories.stream()
            .sorted((a, b) -> {
                if (a.getUpdatedAt() == null && b.getUpdatedAt() == null) return 0;
                if (a.getUpdatedAt() == null) return 1;
                if (b.getUpdatedAt() == null) return -1;
                return b.getUpdatedAt().compareTo(a.getUpdatedAt());
            })
            .collect(Collectors.toList());
        
        return inventories.stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public PaginatedResponseDTO<InventoryResponseDTO> findAllPaginated(String nurseryId, String saplingId, String search, PageRequest pageRequest) {
        // Get breeds first (optimized approach - similar to BreedService)
        List<com.nursery.breed.firestore.BreedDocument> breeds;
        
        if (saplingId != null && !saplingId.isEmpty()) {
            breeds = breedRepository.findBySaplingIdAndNotDeleted(saplingId);
        } else {
            breeds = breedRepository.findByNurseryIdAndNotDeleted(nurseryId);
        }
        
        // Filter by search term if provided (search by breed name)
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase().trim();
            breeds = breeds.stream()
                .filter(b -> b.getBreedName().toLowerCase().contains(searchLower))
                .collect(Collectors.toList());
        }
        
        // Get breed IDs from filtered breeds
        List<String> breedIds = breeds.stream()
            .map(com.nursery.breed.firestore.BreedDocument::getId)
            .collect(Collectors.toList());
        
        // Get inventory by breed IDs (or by nurseryId if no breeds)
        List<InventoryDocument> allInventories;
        if (!breedIds.isEmpty()) {
            allInventories = repository.findByBreedIds(nurseryId, breedIds);
        } else {
            // No breeds match, return empty list
            allInventories = new java.util.ArrayList<>();
        }
        
        // Sort by updatedAt descending (similar to BreedService)
        allInventories = allInventories.stream()
            .sorted((a, b) -> {
                if (a.getUpdatedAt() == null && b.getUpdatedAt() == null) return 0;
                if (a.getUpdatedAt() == null) return 1;
                if (b.getUpdatedAt() == null) return -1;
                return b.getUpdatedAt().compareTo(a.getUpdatedAt());
            })
            .collect(Collectors.toList());
        
        // Apply pagination
        long totalElements = allInventories.size();
        int start = pageRequest.getOffset();
        int end = Math.min(start + pageRequest.getEffectiveSize(), allInventories.size());
        List<InventoryDocument> paginatedInventories = start < allInventories.size() 
            ? allInventories.subList(start, end)
            : new java.util.ArrayList<>();
        
        List<InventoryResponseDTO> content = paginatedInventories.stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
        
        PageResult<InventoryDocument> pageResult = PageResult.of(paginatedInventories, pageRequest, totalElements);
        
        return PaginatedResponseDTO.<InventoryResponseDTO>builder()
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
    public InventoryResponseDTO findByBreedId(String breedId) {
        InventoryDocument inventory = findByBreedIdEntity(breedId);
        return toResponseDTO(inventory);
    }
    
    @Override
    public InventoryDocument getOrCreate(String breedId) {
        return repository.findByBreedId(breedId)
            .orElseGet(() -> {
                // Get breed to find nurseryId
                com.nursery.breed.firestore.BreedDocument breed = breedRepository.findById(breedId)
                    .orElseThrow(() -> new EntityNotFoundException("Breed", breedId));
                
                // Create inventory using stock service
                return stockService.createInventoryForBreed(breedId, breed.getNurseryId());
            });
    }
    
    @Override
    public InventoryDocument getOrCreate(String breedId, Transaction transaction) {
        if (transaction == null) {
            return getOrCreate(breedId);
        }
        
        // First, try to find existing inventory by breedId (outside transaction for query)
        // This is needed to get the inventory ID for transaction read
        Optional<InventoryDocument> existingInventory = repository.findByBreedId(breedId);
        final String inventoryId;
        if (existingInventory.isPresent()) {
            inventoryId = existingInventory.get().getId();
        } else {
            inventoryId = null;
        }
        
        // IMPORTANT: All reads must be done before any writes
        if (inventoryId != null) {
            // Read existing inventory within transaction
            return repository.findById(inventoryId, transaction)
                .orElse(existingInventory.get()); // Fallback if not found in transaction
        } else {
            // Read breed to get nurseryId (read phase)
            com.nursery.breed.firestore.BreedDocument breed = breedRepository.findById(breedId, transaction)
                .orElseThrow(() -> new EntityNotFoundException("Breed", breedId));
            
            // Create inventory document (write phase - after all reads)
            InventoryDocument inventory = new InventoryDocument();
            inventory.setNurseryId(breed.getNurseryId());
            inventory.setBreedId(breedId);
            inventory.setQuantity(0);
            
            // Save within transaction (write phase)
            repository.save(inventory, transaction);
            return inventory;
        }
    }
    
    @Override
    public InventoryDocument findByBreedIdEntity(String breedId) {
        return repository.findByBreedId(breedId)
            .orElseThrow(() -> new EntityNotFoundException("Inventory for breed", breedId));
    }
    
    @Override
    public InventoryDocument findByBreedIdEntity(String breedId, Transaction transaction) {
        if (transaction == null) {
            return findByBreedIdEntity(breedId);
        }
        
        // Find inventory by breedId (query outside transaction)
        InventoryDocument inventory = repository.findByBreedId(breedId)
            .orElseThrow(() -> new EntityNotFoundException("Inventory for breed", breedId));
        
        // Re-read within transaction by ID for consistency
        String inventoryId = inventory.getId();
        return repository.findById(inventoryId, transaction)
            .orElse(inventory); // Fallback if not found in transaction
    }
    
    @Override
    public void save(InventoryDocument inventory) {
        stockService.saveInventory(inventory);
    }
    
    @Override
    public void save(InventoryDocument inventory, Transaction transaction) {
        if (transaction == null) {
            save(inventory);
            return;
        }
        repository.save(inventory, transaction);
    }
    
    private InventoryResponseDTO toResponseDTO(InventoryDocument doc) {
        InventoryResponseDTO dto = new InventoryResponseDTO();
        dto.setId(doc.getId());
        dto.setNurseryId(doc.getNurseryId());
        dto.setBreedId(doc.getBreedId());
        dto.setQuantity(doc.getQuantity());
        dto.setCreatedAt(doc.getCreatedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        return dto;
    }
}
