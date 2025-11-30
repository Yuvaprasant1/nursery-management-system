package com.nursery.transaction.dto.response;

import com.nursery.transaction.enumeration.TransactionType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RecentTransactionDTO {
    private String id;
    private String breedId;
    private String breedName;
    private Integer delta;
    private TransactionType type;
    private String reason;
    private String userPhone;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
}

