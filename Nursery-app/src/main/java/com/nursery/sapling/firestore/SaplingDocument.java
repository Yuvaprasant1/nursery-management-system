package com.nursery.sapling.firestore;

import com.nursery.common.firestore.BaseSoftDeletableDocument;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SaplingDocument extends BaseSoftDeletableDocument {
    
    private String nurseryId;
    
    private String name;
    
    private String description;
    
    private String imageUrl;
}

