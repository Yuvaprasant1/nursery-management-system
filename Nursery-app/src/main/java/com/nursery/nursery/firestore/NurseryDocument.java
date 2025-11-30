package com.nursery.nursery.firestore;

import com.nursery.common.firestore.BaseSoftDeletableDocument;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NurseryDocument extends BaseSoftDeletableDocument {
    
    private String name;
    
    private String location;
    
    private String phone;
}

