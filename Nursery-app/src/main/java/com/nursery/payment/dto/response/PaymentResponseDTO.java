package com.nursery.payment.dto.response;

import com.nursery.payment.enumeration.PaymentType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentResponseDTO {
    private String id;
    private String transactionId;
    private String nurseryId;
    private String breedId;
    private PaymentType type;
    private BigDecimal amount;
    private String description;
    private String userPhone;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

