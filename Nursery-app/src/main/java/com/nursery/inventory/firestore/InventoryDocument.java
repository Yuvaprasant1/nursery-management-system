package com.nursery.inventory.firestore;

import com.nursery.common.firestore.BaseDocument;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InventoryDocument extends BaseDocument {
    
    private String nurseryId;
    
    private String breedId;
    
    private Integer quantity = 0;
}

