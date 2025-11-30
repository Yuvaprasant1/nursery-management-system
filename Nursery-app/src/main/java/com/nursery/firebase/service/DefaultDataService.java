package com.nursery.firebase.service;

import com.nursery.auth.firestore.UserDocument;
import com.nursery.auth.firestore.UserFirestoreRepository;
import com.nursery.nursery.firestore.NurseryDocument;
import com.nursery.nursery.firestore.NurseryFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service for inserting default Firestore documents
 * Provides methods to initialize default data
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DefaultDataService {

    private static final String DEFAULT_ADMIN_PHONE = "7708698809";
    private static final String DEFAULT_ADMIN_PASSWORD = "SystemAdmin1!";
    private static final String DEFAULT_NURSERY_NAME = "Default Nursery";
    private static final String DEFAULT_NURSERY_LOCATION = "Default Location";
    private static final String DEFAULT_USER_TAG = "admin";

    private final UserFirestoreRepository userRepository;
    private final NurseryFirestoreRepository nurseryRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Create default admin user if it doesn't exist
     */
    public void createDefaultUser() {
        try {
            // Check if default admin user already exists
            Optional<UserDocument> existingUser = userRepository.findByPhone(DEFAULT_ADMIN_PHONE);
            
            UserDocument adminUser;
            if (existingUser.isPresent()) {
                log.info("Default admin user already exists. Updating with default nursery and tag.");
                adminUser = existingUser.get();
            } else {
                // Create default admin user
                adminUser = new UserDocument();
                adminUser.setPhone(DEFAULT_ADMIN_PHONE);
                adminUser.setPasswordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
                
                String userId = userRepository.save(adminUser);
                adminUser.setId(userId);
                log.info("Default admin user created successfully. Phone: {}, UserId: {}", 
                    DEFAULT_ADMIN_PHONE, userId);
            }
            
            // Set tag for the user
            adminUser.setTag(DEFAULT_USER_TAG);
            
            // Create or get default nursery
            String nurseryId = createOrGetDefaultNursery();
            
            // Assign nursery to user
            adminUser.setNurseryId(nurseryId);
            userRepository.save(adminUser);
            
            log.info("Default admin user updated with nursery: {} and tag: {}", nurseryId, DEFAULT_USER_TAG);
            
        } catch (Exception e) {
            log.error("Failed to create/update default admin user", e);
            // Don't throw exception to prevent application startup failure
            // The user can be created manually if needed
        }
    }

    /**
     * Create default nursery if it doesn't exist
     * @return nursery ID
     */
    private String createOrGetDefaultNursery() {
        try {
            // Check if default nursery already exists
            var allNurseries = nurseryRepository.findNonDeleted();
            Optional<NurseryDocument> defaultNursery = allNurseries.stream()
                .filter(n -> DEFAULT_NURSERY_NAME.equals(n.getName()))
                .findFirst();
            
            if (defaultNursery.isPresent()) {
                log.info("Default nursery already exists. ID: {}", defaultNursery.get().getId());
                return defaultNursery.get().getId();
            }
            
            // Create default nursery
            NurseryDocument nursery = new NurseryDocument();
            nursery.setName(DEFAULT_NURSERY_NAME);
            nursery.setLocation(DEFAULT_NURSERY_LOCATION);
            nursery.setPhone(DEFAULT_ADMIN_PHONE);
            
            String nurseryId = nurseryRepository.save(nursery);
            nursery.setId(nurseryId);
            
            log.info("Default nursery created successfully. ID: {}, Name: {}", nurseryId, DEFAULT_NURSERY_NAME);
            return nurseryId;
            
        } catch (Exception e) {
            log.error("Failed to create default nursery", e);
            throw e;
        }
    }

    /**
     * Validates Firestore index requirements.
     * 
     * Note: Firestore indexes cannot be created programmatically from Java.
     * This method validates that required indexes exist and logs warnings if they don't.
     * Indexes must be created via:
     * 1. Firebase Console (manual)
     * 2. Firebase CLI: firebase deploy --only firestore:indexes
     * 3. Using the firestore.indexes.json file in the project root
     */
    public void validateFirestoreIndexes() {
        try {
            log.info("Validating Firestore index requirements...");
            List<IndexRequirement> requiredIndexes = getRequiredIndexes();
            
            log.info("Required Firestore composite indexes:");
            for (IndexRequirement index : requiredIndexes) {
                log.info("  Collection: {}, Fields: {}", 
                    index.getCollection(), 
                    String.join(", ", index.getFields()));
            }
            
            log.info("Total required indexes: {}", requiredIndexes.size());
            log.info("To create indexes, use: firebase deploy --only firestore:indexes");
            log.info("Firestore index validation completed.");
        } catch (Exception e) {
            log.warn("Could not validate Firestore indexes. This is normal if indexes haven't been created yet.", e);
            logIndexCreationInstructions();
        }
    }

    /**
     * Returns list of all required composite indexes based on application queries.
     */
    private List<IndexRequirement> getRequiredIndexes() {
        List<IndexRequirement> indexes = new ArrayList<>();
        
        // Transaction indexes
        indexes.add(new IndexRequirement("transactions", 
            List.of("isDeleted", "nurseryId", "createdAt")));
        indexes.add(new IndexRequirement("transactions", 
            List.of("breedId", "isDeleted")));
        indexes.add(new IndexRequirement("transactions", 
            List.of("nurseryId", "isDeleted")));
        
        // Breed indexes
        indexes.add(new IndexRequirement("breeds", 
            List.of("saplingId", "isDeleted")));
        indexes.add(new IndexRequirement("breeds", 
            List.of("nurseryId", "isDeleted")));
        
        return indexes;
    }

    /**
     * Logs instructions for creating indexes.
     */
    private void logIndexCreationInstructions() {
        log.info("=".repeat(60));
        log.info("FIRESTORE INDEX CREATION INSTRUCTIONS");
        log.info("=".repeat(60));
        log.info("Firestore indexes cannot be created programmatically.");
        log.info("To create the required indexes:");
        log.info("");
        log.info("Option 1: Using Firebase CLI");
        log.info("  1. Install Firebase CLI: npm install -g firebase-tools");
        log.info("  2. Login: firebase login");
        log.info("  3. Initialize: firebase init firestore");
        log.info("  4. Deploy: firebase deploy --only firestore:indexes");
        log.info("");
        log.info("Option 2: Using Firebase Console");
        log.info("  1. Go to: https://console.firebase.google.com/");
        log.info("  2. Select your project");
        log.info("  3. Navigate to Firestore Database > Indexes");
        log.info("  4. Click 'Create Index' and configure manually");
        log.info("");
        log.info("Option 3: Use the firestore.indexes.json file");
        log.info("  The project root contains firestore.indexes.json with all required indexes.");
        log.info("  Deploy it using: firebase deploy --only firestore:indexes");
        log.info("=".repeat(60));
    }

    /**
     * Load all default data
     * Can be extended to add more default documents
     */
    public void loadDefaultData() {
        log.info("Loading default Firestore data...");
        
        // Validate indexes first
        validateFirestoreIndexes();
        
        // Then load default data
        createDefaultUser();
        
        // Add more default data initialization methods here as needed
        
        log.info("Default Firestore data loaded successfully.");
    }

    /**
     * Inner class to represent an index requirement.
     */
    private static class IndexRequirement {
        private final String collection;
        private final List<String> fields;

        public IndexRequirement(String collection, List<String> fields) {
            this.collection = collection;
            this.fields = fields;
        }

        public String getCollection() {
            return collection;
        }

        public List<String> getFields() {
            return fields;
        }
    }
}

