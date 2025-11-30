package com.nursery.common.firestore.migration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteBatch;
import com.nursery.common.firestore.exception.FirestoreException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/**
 * Executes Firestore migration operations from JSON files
 */
@Slf4j
@Component
public class MigrationExecutor {
    
    private final Firestore firestore;
    private final ObjectMapper objectMapper;
    
    public MigrationExecutor(Firestore firestore) {
        this.firestore = firestore;
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Execute migration operations from a migration file
     */
    public void execute(String migrationId, String description, String jsonContent) {
        try {
            List<MigrationOperation> operations = parseOperations(jsonContent);
            
            if (operations.isEmpty()) {
                log.warn("No operations found in migration {}", migrationId);
                return;
            }
            
            executeOperations(operations);
            log.info("Executed {} operation(s) for migration {}", operations.size(), migrationId);
            
        } catch (Exception e) {
            log.error("Failed to execute migration {}", migrationId, e);
            throw new FirestoreException("Migration execution failed: " + migrationId, e);
        }
    }
    
    /**
     * Execute list of operations using Firestore batches
     */
    private void executeOperations(List<MigrationOperation> operations) throws ExecutionException, InterruptedException {
        WriteBatch batch = firestore.batch();
        int count = 0;
        
        for (MigrationOperation op : operations) {
            switch (op.getType().toLowerCase()) {
                case "set":
                case "create":
                    batch.set(
                        firestore.collection(op.getCollection()).document(op.getDocumentId()),
                        op.getData()
                    );
                    count++;
                    break;
                    
                case "update":
                    batch.update(
                        firestore.collection(op.getCollection()).document(op.getDocumentId()),
                        op.getData()
                    );
                    count++;
                    break;
                    
                case "delete":
                    batch.delete(
                        firestore.collection(op.getCollection()).document(op.getDocumentId())
                    );
                    count++;
                    break;
                    
                default:
                    throw new IllegalArgumentException("Unknown operation type: " + op.getType());
            }
            
            // Firestore batch limit is 500 operations
            if (count >= 500) {
                batch.commit().get();
                batch = firestore.batch();
                count = 0;
            }
        }
        
        if (count > 0) {
            batch.commit().get();
        }
    }
    
    /**
     * Parse JSON content into migration operations
     * Expected format:
     * {
     *   "operations": [
     *     {
     *       "type": "set|update|delete",
     *       "collection": "collection_name",
     *       "documentId": "doc_id",
     *       "data": { ... }  // optional for delete
     *     }
     *   ]
     * }
     */
    private List<MigrationOperation> parseOperations(String jsonContent) {
        List<MigrationOperation> operations = new ArrayList<>();
        
        try {
            JsonNode root = objectMapper.readTree(jsonContent);
            JsonNode operationsNode = root.get("operations");
            
            if (operationsNode == null || !operationsNode.isArray()) {
                return operations;
            }
            
            for (JsonNode opNode : operationsNode) {
                MigrationOperation op = new MigrationOperation();
                op.setType(opNode.get("type").asText());
                op.setCollection(opNode.get("collection").asText());
                op.setDocumentId(opNode.get("documentId").asText());
                
                JsonNode dataNode = opNode.get("data");
                if (dataNode != null && dataNode.isObject()) {
                    Map<String, Object> data = objectMapper.convertValue(dataNode, Map.class);
                    op.setData(data);
                }
                
                operations.add(op);
            }
            
        } catch (Exception e) {
            throw new FirestoreException("Failed to parse migration JSON", e);
        }
        
        return operations;
    }
    
    /**
     * Migration operation model
     */
    private static class MigrationOperation {
        private String type;
        private String collection;
        private String documentId;
        private Map<String, Object> data;
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getCollection() { return collection; }
        public void setCollection(String collection) { this.collection = collection; }
        public String getDocumentId() { return documentId; }
        public void setDocumentId(String documentId) { this.documentId = documentId; }
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
    }
}
