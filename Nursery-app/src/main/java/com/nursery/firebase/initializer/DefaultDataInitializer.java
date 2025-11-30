package com.nursery.firebase.initializer;

import com.nursery.firebase.service.DefaultDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Initializes default Firestore data and validates indexes on application startup
 * Delegates to DefaultDataService for business logic
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(1) // Run early to validate indexes before data operations
public class DefaultDataInitializer implements CommandLineRunner {

    private final DefaultDataService defaultDataService;

    @Override
    public void run(String... args) {
        try {
            log.info("Starting Firestore initialization...");
            defaultDataService.loadDefaultData();
            log.info("Firestore initialization completed successfully.");
        } catch (Exception e) {
            log.error("Failed to initialize Firestore data", e);
            // Don't throw exception to prevent application startup failure
        }
    }
}

