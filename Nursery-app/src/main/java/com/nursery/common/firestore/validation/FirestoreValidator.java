package com.nursery.common.firestore.validation;

import com.nursery.common.firestore.BaseDocument;
import com.nursery.common.firestore.exception.FirestoreValidationException;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
public class FirestoreValidator {
    
    private static final long MAX_DOCUMENT_SIZE_BYTES = 1_000_000; // 1MB Firestore limit
    
    public static void validateDocumentSize(BaseDocument document, Map<String, Object> data) {
        long estimatedSize = estimateDocumentSize(data);
        if (estimatedSize > MAX_DOCUMENT_SIZE_BYTES) {
            throw new FirestoreValidationException(
                String.format("Document size (%d bytes) exceeds Firestore limit (%d bytes)", 
                    estimatedSize, MAX_DOCUMENT_SIZE_BYTES));
        }
    }
    
    public static void validateDocumentId(String id) {
        if (id == null || id.isEmpty()) {
            throw new FirestoreValidationException("Document ID cannot be null or empty");
        }
        if (id.length() > 1500) {
            throw new FirestoreValidationException("Document ID exceeds maximum length of 1500 characters");
        }
    }
    
    public static void validateCollectionName(String collectionName) {
        if (collectionName == null || collectionName.isEmpty()) {
            throw new FirestoreValidationException("Collection name cannot be null or empty");
        }
        if (collectionName.length() > 1500) {
            throw new FirestoreValidationException("Collection name exceeds maximum length of 1500 characters");
        }
    }
    
    private static long estimateDocumentSize(Map<String, Object> data) {
        if (data == null) {
            return 0;
        }
        
        long size = 0;
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            // Field name size
            size += entry.getKey().length();
            
            // Field value size (rough estimate)
            Object value = entry.getValue();
            if (value == null) {
                size += 1; // null marker
            } else if (value instanceof String) {
                size += ((String) value).length();
            } else if (value instanceof Number) {
                size += 8; // Assume 8 bytes for numbers
            } else if (value instanceof Boolean) {
                size += 1;
            } else if (value instanceof Map) {
                size += estimateDocumentSize((Map<String, Object>) value);
            } else {
                size += value.toString().length();
            }
        }
        
        return size;
    }
}

