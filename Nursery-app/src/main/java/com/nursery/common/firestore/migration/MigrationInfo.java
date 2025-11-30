package com.nursery.common.firestore.migration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.InputStream;

/**
 * Represents a migration file with its metadata
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MigrationInfo {
    
    private String migrationId;
    private String filename;
    private String description;
    private InputStream content;
    private String checksum;
    
    /**
     * Extract migration ID from filename (e.g., V001__create_users.json -> 001)
     */
    public static String extractMigrationId(String filename) {
        if (filename == null || !filename.matches("^V\\d+__.*")) {
            throw new IllegalArgumentException("Invalid migration filename format: " + filename + 
                ". Expected format: V{number}__{description}.{extension}");
        }
        return filename.substring(1, filename.indexOf("__"));
    }
    
    /**
     * Extract description from filename (e.g., V001__create_users.json -> create_users)
     */
    public static String extractDescription(String filename) {
        if (filename == null || !filename.matches("^V\\d+__.*")) {
            throw new IllegalArgumentException("Invalid migration filename format: " + filename);
        }
        int start = filename.indexOf("__") + 2;
        int end = filename.lastIndexOf(".");
        return end > start ? filename.substring(start, end) : filename.substring(start);
    }
}

