package com.nursery.stock.service;

import com.nursery.inventory.firestore.InventoryDocument;
import com.nursery.inventory.firestore.InventoryFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {
    
    private final InventoryFirestoreRepository inventoryRepository;
    
    @Override
    public InventoryDocument createInventoryForBreed(String breedId, String nurseryId) {
        InventoryDocument inventory = new InventoryDocument();
        inventory.setNurseryId(nurseryId);
        inventory.setBreedId(breedId);
        inventory.setQuantity(0);
        inventoryRepository.save(inventory);
        log.info("Created inventory for breed: {}", breedId);
        return inventory;
    }
    
    @Override
    public void saveInventory(InventoryDocument inventory) {
        inventoryRepository.save(inventory);
    }
}

