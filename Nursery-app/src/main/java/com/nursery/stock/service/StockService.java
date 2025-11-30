package com.nursery.stock.service;

import com.nursery.inventory.firestore.InventoryDocument;

public interface StockService {
    /**
     * Create inventory for a breed
     */
    InventoryDocument createInventoryForBreed(String breedId, String nurseryId);
    
    /**
     * Save inventory document
     */
    void saveInventory(InventoryDocument inventory);
}

