package com.nursery.transaction.firestore;

import com.nursery.common.firestore.BaseSoftDeletableDocument;
import com.nursery.transaction.enumeration.TransactionType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TransactionDocument extends BaseSoftDeletableDocument {
    
    private String nurseryId;
    
    private String breedId;
    
    private Integer delta;
    
    private TransactionType type;
    
    private String reason;
    
    private String userPhone;
    
    private String reversedByTxnId;
    
    private Boolean isUndo = false;
}

