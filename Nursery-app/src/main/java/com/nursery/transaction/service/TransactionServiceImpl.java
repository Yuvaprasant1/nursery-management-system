package com.nursery.transaction.service;

import com.nursery.common.firestore.BaseDocument;
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
        
        // Validate delta based on transaction type
        validateTransactionRequest(request);
        
        // Calculate effective delta based on transaction type
        int effectiveDelta = calculateEffectiveDelta(request);
        
        // Get inventory ID before transaction (needed if inventory exists)
        final String inventoryId;
        Optional<com.nursery.inventory.firestore.InventoryDocument> existingInventory = 
            inventoryRepository.findByBreedId(breedId);
        inventoryId = existingInventory.map(BaseDocument::getId).orElse(null);
        
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

    @Override
    public TransactionResponseDTO updateTransaction(String transactionId, TransactionRequestDTO request) {
        // Read transaction before starting transaction (validation)
        TransactionDocument existingTransaction = repository.findById(transactionId)
            .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
            .orElseThrow(() -> new EntityNotFoundException("Transaction", transactionId));
        
        // Prevent editing of COMPENSATION transactions
        if (existingTransaction.getType() == TransactionType.COMPENSATION) {
            throw new ValidationException("COMPENSATION transactions cannot be edited");
        }
        
        // Breed cannot be changed - it's part of transaction identity
        // Note: TransactionRequestDTO doesn't include breedId, so it cannot be changed
        
        // Validate delta based on transaction type
        validateTransactionRequest(request);
        
        // Get inventory ID before transaction
        com.nursery.inventory.firestore.InventoryDocument inventory = inventoryService.findByBreedIdEntity(existingTransaction.getBreedId());
        String inventoryId = inventory.getId();
        
        // Calculate old and new effective deltas
        int oldEffectiveDelta = existingTransaction.getDelta() != null ? existingTransaction.getDelta() : 0;
        int newEffectiveDelta = calculateEffectiveDelta(request);
        
        // Use Firestore transaction for atomic update
        return repository.runInTransaction(txn -> {
            // ========== PHASE 1: ALL READS FIRST ==========
            // Re-read transaction within transaction for consistency
            TransactionDocument transactionInTxn = repository.findById(transactionId, txn)
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .orElseThrow(() -> new EntityNotFoundException("Transaction", transactionId));
            
            // Read inventory within transaction
            com.nursery.inventory.firestore.InventoryDocument inventoryInTxn = inventoryRepository.findById(inventoryId, txn)
                .orElseThrow(() -> new EntityNotFoundException("Inventory", inventoryId));
            
            // Calculate delta change: reverse old delta and apply new delta
            int deltaChange = newEffectiveDelta - oldEffectiveDelta;
            int newQuantity = inventoryInTxn.getQuantity() + deltaChange;
            
            // Validate inventory won't go negative
            if (newQuantity < 0) {
                throw new ValidationException("Insufficient inventory. Current quantity: " + inventoryInTxn.getQuantity() + 
                    ", change: " + deltaChange);
            }
            
            // ========== PHASE 2: ALL WRITES AFTER READS ==========
            // Update transaction document
            transactionInTxn.setType(request.getType());
            transactionInTxn.setDelta(newEffectiveDelta);
            transactionInTxn.setReason(request.getReason());
            repository.save(transactionInTxn, txn);
            
            // Update inventory
            inventoryInTxn.setQuantity(newQuantity);
            inventoryRepository.save(inventoryInTxn, txn);
            
            log.info("Updated transaction: {} for breed: {} (delta change: {} -> {})", 
                transactionId, existingTransaction.getBreedId(), oldEffectiveDelta, newEffectiveDelta);
            return toResponseDTO(transactionInTxn);
        });
    }

    private void validateTransactionRequest(TransactionRequestDTO request) {
        if (request.getDelta() == null) {
            throw new ValidationException("Delta is required");
        }
        TransactionType type = request.getType();
        if (type == null) {
            throw new ValidationException("Transaction type is required");
        }
        
        // ADJUST type allows both positive and negative values
        // Other types (SELL, PLANTED) only allow positive values (no negative or zero)
        if (type != TransactionType.ADJUST && request.getDelta() <= 0) {
            throw new ValidationException("Transaction type " + type + " only accepts positive delta values");
        }
    }
    
    private int calculateEffectiveDelta(TransactionRequestDTO request) {
        int delta = request.getDelta();
        TransactionType type = request.getType();

        return switch (type) {
            case SELL -> -Math.abs(delta);
            case PLANTED -> Math.abs(delta);
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
    public PaginatedResponseDTO<TransactionResponseDTO> findAllPaginated(
            String breedId,
            String nurseryId,
            String saplingId,
            PageRequest pageRequest
    ) {
        PageResult<TransactionDocument> pageResult;

        boolean hasBreed = breedId != null && !breedId.isEmpty();
        boolean hasSapling = saplingId != null && !saplingId.isEmpty();

        if (hasBreed && hasSapling) {
            // Both sapling and breed selected: validate the relationship first
            com.nursery.breed.firestore.BreedDocument breed =
                breedRepository.findById(breedId).orElse(null);

            if (breed == null || breed.getSaplingId() == null || !saplingId.equals(breed.getSaplingId())) {
                // Breed does not belong to the sapling -> no matching transactions
                pageResult = PageResult.of(java.util.Collections.emptyList(), pageRequest, 0);
            } else {
                pageResult = repository.findByBreedIdAndNotDeletedPaginated(breedId, pageRequest);
            }
        } else if (hasBreed) {
            // Only breed provided: filter by breed
            pageResult = repository.findByBreedIdAndNotDeletedPaginated(breedId, pageRequest);
        } else if (hasSapling) {
            // Only sapling provided: find all breeds for this sapling, then filter by those breeds
            List<com.nursery.breed.firestore.BreedDocument> breedsForSapling =
                breedRepository.findBySaplingIdAndNotDeleted(saplingId);

            if (breedsForSapling.isEmpty()) {
                pageResult = PageResult.of(java.util.Collections.emptyList(), pageRequest, 0);
            } else {
                List<String> breedIds = breedsForSapling.stream()
                    .map(com.nursery.breed.firestore.BreedDocument::getId)
                    .collect(Collectors.toList());
                pageResult = repository.findByBreedIdsAndNotDeletedPaginated(breedIds, pageRequest);
            }
        } else if (nurseryId != null && !nurseryId.isEmpty()) {
            // Fallback to nursery-wide transactions
            pageResult = repository.findByNurseryIdAndNotDeletedPaginated(nurseryId, pageRequest);
        } else {
            throw new ValidationException("Either breedId, saplingId or nurseryId must be provided");
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
