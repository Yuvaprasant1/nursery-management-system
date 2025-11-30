package com.nursery.common.firestore.migration;

import com.nursery.common.firestore.BaseDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Document to track executed migrations in Firestore
 */

@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MigrationDocument extends BaseDocument {
    
    private String migrationId;
    private String filename;
    private String description;
    private Instant executedAt;
    private String executedBy;
    private Long executionTimeMs;
    private String checksum;
    private MigrationStatus status;
    private String errorMessage;
    
    public enum MigrationStatus {
        SUCCESS,
        FAILED,
        PENDING
    }
}

