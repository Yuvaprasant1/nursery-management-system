package com.nursery.auth.firestore;

import com.nursery.common.firestore.BaseSoftDeletableDocument;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDocument extends BaseSoftDeletableDocument {
    
    private String phone;
    
    private String passwordHash;
    
    private String token;
    
    private String nurseryId;
    
    private String tag;
}

