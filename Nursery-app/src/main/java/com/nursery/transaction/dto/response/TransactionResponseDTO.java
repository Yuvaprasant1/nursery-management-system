package com.nursery.transaction.dto.response;

import com.nursery.transaction.enumeration.TransactionType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TransactionResponseDTO {
    private String id;
    private String nurseryId;
    private String breedId;
    private Integer delta;
    private TransactionType type;
    private String reason;
    private String userPhone;
    private String reversedByTxnId;
    private Boolean isUndo;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

