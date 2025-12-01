package com.nursery.payment.dto.request;

import com.nursery.payment.enumeration.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequestDTO {
    
    @NotNull(message = "Transaction ID is required")
    private String transactionId;
    
    @NotNull(message = "Payment type is required")
    private PaymentType type;
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;
    
    private String description;
}

