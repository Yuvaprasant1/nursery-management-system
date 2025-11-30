package com.nursery.transaction.dto.request;

import com.nursery.transaction.enumeration.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TransactionRequestDTO {
    
    @NotNull(message = "Delta is required")
    private Integer delta;
    
    @NotNull(message = "Transaction type is required")
    private TransactionType type;
    
    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;
}

