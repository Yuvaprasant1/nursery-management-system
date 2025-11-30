package com.nursery.breed.service;

import com.nursery.breed.firestore.BreedFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class BreedQueryServiceImpl implements BreedQueryService {
    
    private final BreedFirestoreRepository repository;
    
    @Override
    public boolean hasActiveBreeds(String saplingId) {
        return repository.existsBySaplingIdAndIsDeletedFalse(saplingId);
    }
}

