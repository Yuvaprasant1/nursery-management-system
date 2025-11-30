package com.nursery.breed.firestore;

import com.nursery.breed.enumeration.BreedMode;
import com.nursery.common.firestore.BaseSoftDeletableDocument;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BreedDocument extends BaseSoftDeletableDocument {
    
    private String nurseryId;
    
    private String saplingId;
    
    private String breedName;
    
    private BreedMode mode;
    
    private Integer itemsPerSlot = 1;
    
    private String imageUrl;
}

