package com.nursery.transaction.service;

import com.nursery.transaction.enumeration.TransactionType;
import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.exception.EntityNotFoundException;
import com.nursery.common.exception.ValidationException;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.common.firestore.pagination.PageResult;
import com.nursery.common.util.SecurityUtil;
import com.nursery.breed.service.BreedService;
import com.nursery.inventory.service.InventoryService;
import com.nursery.transaction.dto.request.TransactionRequestDTO;
import com.nursery.transaction.dto.response.TransactionResponseDTO;
import com.nursery.transaction.firestore.TransactionDocument;
import com.nursery.transaction.firestore.TransactionFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {
    
    private final TransactionFirestoreRepository repository;
    private final BreedService breedService;
    private final InventoryService inventoryService;
    private final com.nursery.inventory.firestore.InventoryFirestoreRepository inventoryRepository;
    private final com.nursery.breed.firestore.BreedFirestoreRepository breedRepository;
    
    @Override
    public TransactionResponseDTO createTransaction(String breedId, TransactionRequestDTO request) {
        // Validate breed exists (read before transaction)
        com.nursery.breed.firestore.BreedDocument breed = breedService.findByIdEntity(breedId);
        
        // Calculate effective delta based on transaction type
        int effectiveDelta = calculateEffectiveDelta(request);
        
        // Get inventory ID before transaction (needed if inventory exists)
        final String inventoryId;
        Optional<com.nursery.inventory.firestore.InventoryDocument> existingInventory = 
            inventoryRepository.findByBreedId(breedId);
        if (existingInventory.isPresent()) {
            inventoryId = existingInventory.get().getId();
        } else {
            inventoryId = null;
        }
        
        // Use Firestore transaction for atomic operation with retry support
        // IMPORTANT: All reads must be done before any writes
        return repository.runInTransaction(transaction -> {
            // ========== PHASE 1: ALL READS FIRST ==========
            com.nursery.inventory.firestore.InventoryDocument inventory;
            if (inventoryId != null) {
                // Read existing inventory within transaction
                inventory = inventoryRepository.findById(inventoryId, transaction)
                    .orElseThrow(() -> new EntityNotFoundException("Inventory", inventoryId));
            } else {
                // Read breed to get nurseryId (for creating new inventory)
                com.nursery.breed.firestore.BreedDocument breedInTxn = breedRepository.findById(breedId, transaction)
                    .orElseThrow(() -> new EntityNotFoundException("Breed", breedId));
                
                // Create new inventory document (will be saved in write phase)
                inventory = new com.nursery.inventory.firestore.InventoryDocument();
                inventory.setNurseryId(breedInTxn.getNurseryId());
                inventory.setBreedId(breedId);
                inventory.setQuantity(0);
            }
            
            // Calculate new inventory quantity
            int newQuantity = inventory.getQuantity() + effectiveDelta;
            
            // Validate inventory won't go negative
            if (newQuantity < 0) {
                throw new ValidationException("Insufficient inventory. Current quantity: " + inventory.getQuantity());
            }

            // ========== PHASE 2: ALL WRITES AFTER READS ==========
            // Create transaction document
            TransactionDocument transactionDoc = toDocument(request, breed);
            transactionDoc.setDelta(effectiveDelta);
            transactionDoc.setUserPhone(SecurityUtil.getCurrentUserPhone());
            
            // Save transaction within transaction
            String transactionId = repository.save(transactionDoc, transaction);
            transactionDoc.setId(transactionId);
            
            // Update inventory within transaction
            inventory.setQuantity(newQuantity);
            inventoryRepository.save(inventory, transaction);
            
            log.info("Created transaction: {} for breed: {} (delta: {})", 
                transactionId, breedId, effectiveDelta);
            return toResponseDTO(transactionDoc);
        });
    }

    private int calculateEffectiveDelta(TransactionRequestDTO request) {
        if (request.getDelta() == null) {
            throw new ValidationException("Delta is required");
        }
        int delta = request.getDelta();
        TransactionType type = request.getType();

        if (type == null) {
            throw new ValidationException("Transaction type is required");
        }

        return switch (type) {
            case SELL -> -Math.abs(delta);
            case PLANTED, RECEIVE -> Math.abs(delta);
            case ADJUST -> delta;
            case COMPENSATION -> throw new ValidationException("COMPENSATION transactions cannot be created manually");
        };
    }
    
    @Override
    public void softDeleteTransaction(String transactionId) {
        // Read transaction before starting transaction (validation)
        TransactionDocument transaction = repository.findById(transactionId)
            .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
            .orElseThrow(() -> new EntityNotFoundException("Transaction", transactionId));
        
        // Prevent deletion of COMPENSATION transactions
        if (transaction.getType() == TransactionType.COMPENSATION) {
            throw new ValidationException("COMPENSATION transactions cannot be deleted");
        }
        
        // Get inventory ID before transaction (needed for transaction read)
        com.nursery.inventory.firestore.InventoryDocument inventory = inventoryService.findByBreedIdEntity(transaction.getBreedId());
        String inventoryId = inventory.getId();
        
        // Use single transaction for atomic delete and compensation
        // IMPORTANT: All reads must be done before any writes
        repository.runInTransaction(txn -> {
            // ========== PHASE 1: ALL READS FIRST ==========
            // Re-read transaction within transaction for consistency
            TransactionDocument transactionInTxn = repository.findById(transactionId, txn)
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .orElseThrow(() -> new EntityNotFoundException("Transaction", transactionId));
            
            // Read inventory within transaction
            com.nursery.inventory.firestore.InventoryDocument inventoryInTxn = inventoryRepository.findById(inventoryId, txn)
                .orElseThrow(() -> new EntityNotFoundException("Inventory", inventoryId));
            
            // ========== PHASE 2: ALL WRITES AFTER READS ==========
            // Mark transaction as deleted
            transactionInTxn.softDelete();
            repository.save(transactionInTxn, txn);
            
            // Create and save compensation transaction
            TransactionDocument compensation = new TransactionDocument();
            compensation.setNurseryId(transactionInTxn.getNurseryId());
            compensation.setBreedId(transactionInTxn.getBreedId());
            compensation.setDelta(transactionInTxn.getDelta() != null ? -transactionInTxn.getDelta() : 0);
            compensation.setType(TransactionType.COMPENSATION);
            compensation.setReason("Compensation for deleted transaction #" + transactionInTxn.getId());
            compensation.setUserPhone(SecurityUtil.getCurrentUserPhone());
            compensation.setReversedByTxnId(transactionInTxn.getId());
            compensation.setIsUndo(true);
            String compensationId = repository.save(compensation, txn);
            compensation.setId(compensationId);
            
            // Update inventory
            int newQuantity = inventoryInTxn.getQuantity() + compensation.getDelta();
            if (newQuantity < 0) {
                throw new ValidationException("Compensation would result in negative inventory");
            }
            inventoryInTxn.setQuantity(newQuantity);
            inventoryRepository.save(inventoryInTxn, txn);
            
            log.info("Soft deleted transaction: {} with compensation: {} (atomic)", transactionId, compensationId);
            return null;
        });
    }
    
    @Override
    public void undoTransaction(String transactionId) {
        softDeleteTransaction(transactionId);
    }
    
    @Override
    public List<TransactionResponseDTO> findAll(String breedId) {
        return repository.findByBreedIdAndNotDeleted(breedId).stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public PaginatedResponseDTO<TransactionResponseDTO> findAllPaginated(String breedId, String nurseryId, PageRequest pageRequest) {
        PageResult<TransactionDocument> pageResult;
        
        if (breedId != null && !breedId.isEmpty()) {
            pageResult = repository.findByBreedIdAndNotDeletedPaginated(breedId, pageRequest);
        } else if (nurseryId != null && !nurseryId.isEmpty()) {
            pageResult = repository.findByNurseryIdAndNotDeletedPaginated(nurseryId, pageRequest);
        } else {
            throw new ValidationException("Either breedId or nurseryId must be provided");
        }
        
        List<TransactionResponseDTO> content = pageResult.getContent().stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
        
        return PaginatedResponseDTO.<TransactionResponseDTO>builder()
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
    public TransactionResponseDTO findById(String id) {
        TransactionDocument transaction = repository.findById(id)
            .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
            .orElseThrow(() -> new EntityNotFoundException("Transaction", id));
        return toResponseDTO(transaction);
    }
    
    
    
    private TransactionDocument toDocument(TransactionRequestDTO dto, com.nursery.breed.firestore.BreedDocument breed) {
        TransactionDocument doc = new TransactionDocument();
        doc.setNurseryId(breed.getNurseryId());
        doc.setBreedId(breed.getId());
        doc.setType(dto.getType());
        doc.setReason(dto.getReason());
        return doc;
    }
    
    private TransactionResponseDTO toResponseDTO(TransactionDocument doc) {
        TransactionResponseDTO dto = new TransactionResponseDTO();
        dto.setId(doc.getId());
        dto.setNurseryId(doc.getNurseryId());
        dto.setBreedId(doc.getBreedId());
        dto.setDelta(doc.getDelta());
        dto.setType(doc.getType());
        dto.setReason(doc.getReason());
        dto.setUserPhone(doc.getUserPhone());
        dto.setReversedByTxnId(doc.getReversedByTxnId());
        dto.setIsUndo(doc.getIsUndo());
        dto.setIsDeleted(doc.getIsDeleted());
        dto.setCreatedAt(doc.getCreatedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        return dto;
    }
}
