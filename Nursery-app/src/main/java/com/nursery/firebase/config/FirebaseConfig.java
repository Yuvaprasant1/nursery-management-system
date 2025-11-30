package com.nursery.firebase.config;

import com.google.api.gax.retrying.RetrySettings;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StringUtils;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Firebase configuration class
 * Initializes FirebaseApp and exposes Firestore bean with proper configuration
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    private static final String FIREBASE_SERVICE_KEY_PATH = "firebase-service-key.json";
    private static final String DEFAULT_APP_NAME = FirebaseApp.DEFAULT_APP_NAME;

    @Value("${firestore.project-id}")
    private String projectId;

    @Value("${firestore.credentials-path:}")
    private String credentialsPath;

    @Value("${firestore.timeout.seconds:30}")
    private int timeoutSeconds;

    private Firestore firestoreInstance;

    /**
     * Initialize FirebaseApp if no existing instances
     * Loads credentials from firestore.credentials-path, environment variable, or classpath
     */
    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        // Check if FirebaseApp already exists
        try {
            FirebaseApp existingApp = FirebaseApp.getInstance(DEFAULT_APP_NAME);
            log.info("FirebaseApp already initialized: {}", existingApp.getName());
            return existingApp;
        } catch (IllegalStateException e) {
            // No existing instance, proceed with initialization
            log.info("Initializing FirebaseApp...");
        }

        GoogleCredentials credentials = loadCredentials();
        
        if (credentials == null) {
            throw new IOException("Firebase credentials not found. " +
                "Please set GOOGLE_APPLICATION_CREDENTIALS environment variable, " +
                "firestore.credentials-path property, or place firebase-service-key.json in classpath.");
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .setProjectId(projectId)
                .build();

        FirebaseApp app = FirebaseApp.initializeApp(options, DEFAULT_APP_NAME);
        log.info("FirebaseApp initialized successfully: {}", app.getName());
        return app;
    }

    /**
     * Load credentials from environment variable, properties, or classpath
     */
    private GoogleCredentials loadCredentials() throws IOException {
        // Priority 1: Environment variable (recommended for production)
        String envCredentialsPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
        if (StringUtils.hasText(envCredentialsPath)) {
            log.info("Loading Firebase credentials from environment variable: GOOGLE_APPLICATION_CREDENTIALS");
            try (InputStream serviceAccount = new FileInputStream(envCredentialsPath)) {
                return GoogleCredentials.fromStream(serviceAccount);
            }
        }
        
        // Priority 2: Properties file path
        if (StringUtils.hasText(credentialsPath)) {
            log.info("Loading Firebase credentials from properties: {}", credentialsPath);
            try (InputStream serviceAccount = new FileInputStream(credentialsPath)) {
                return GoogleCredentials.fromStream(serviceAccount);
            }
        }
        
        // Priority 3: Classpath fallback
        log.info("Loading Firebase credentials from classpath: {}", FIREBASE_SERVICE_KEY_PATH);
        ClassPathResource resource = new ClassPathResource(FIREBASE_SERVICE_KEY_PATH);
        
        if (!resource.exists()) {
            log.warn("Firebase service key not found in classpath. " +
                "Please set GOOGLE_APPLICATION_CREDENTIALS environment variable or firestore.credentials-path property.");
            return null;
        }
        
        try (InputStream serviceAccount = resource.getInputStream()) {
            return GoogleCredentials.fromStream(serviceAccount);
        }
    }

    /**
     * Expose singleton Firestore bean with proper configuration
     * Uses FirestoreOptions for timeout, retry, and connection settings
     */
    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) throws IOException {
        GoogleCredentials credentials = loadCredentials();
        
        if (credentials == null) {
            // Fallback to default FirestoreClient if credentials not available
            log.warn("Using default FirestoreClient without custom configuration");
            firestoreInstance = FirestoreClient.getFirestore();
            return firestoreInstance;
        }

        // Configure retry settings with exponential backoff
        // Note: RetrySettings uses org.threeten.bp.Duration, not java.time.Duration
        RetrySettings retrySettings = RetrySettings.newBuilder()
            .setInitialRetryDelay(org.threeten.bp.Duration.ofMillis(100))
            .setRetryDelayMultiplier(2.0)
            .setMaxRetryDelay(org.threeten.bp.Duration.ofMillis(1000))
            .setMaxAttempts(3)
            .setTotalTimeout(org.threeten.bp.Duration.ofSeconds(timeoutSeconds))
            .build();

        // Configure FirestoreOptions with proper settings
        FirestoreOptions firestoreOptions = FirestoreOptions.newBuilder()
            .setProjectId(projectId)
            .setCredentials(credentials)
            .setRetrySettings(retrySettings)
            .build();

        firestoreInstance = firestoreOptions.getService();
        log.info("Firestore bean created for project: {} with timeout: {}s", projectId, timeoutSeconds);
        return firestoreInstance;
    }

    /**
     * Gracefully close Firestore client on application shutdown
     * Prevents resource leaks and ensures proper cleanup
     */
    @PreDestroy
    public void cleanup() {
        if (firestoreInstance != null) {
            try {
                log.info("Closing Firestore client...");
                firestoreInstance.close();
                log.info("Firestore client closed successfully");
            } catch (Exception e) {
                log.error("Error closing Firestore client", e);
            }
        }
    }
}

