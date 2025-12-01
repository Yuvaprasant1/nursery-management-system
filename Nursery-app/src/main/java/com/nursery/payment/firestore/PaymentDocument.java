package com.nursery.payment.firestore;

import com.nursery.common.firestore.BaseSoftDeletableDocument;
import com.nursery.payment.enumeration.PaymentType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PaymentDocument extends BaseSoftDeletableDocument {
    
    private String transactionId;
    
    private String nurseryId;
    
    private String breedId;
    
    private PaymentType type;
    
    private BigDecimal amount;
    
    private String description;
    
    private String userPhone;
}

