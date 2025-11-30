package com.nursery.sapling.service;

import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.sapling.dto.request.SaplingRequestDTO;
import com.nursery.sapling.dto.response.SaplingResponseDTO;
import com.nursery.sapling.firestore.SaplingDocument;

import java.util.List;

public interface SaplingService {
    List<SaplingResponseDTO> findAll(String nurseryId, String search);
    PaginatedResponseDTO<SaplingResponseDTO> findAllPaginated(String nurseryId, String search, PageRequest pageRequest);
    SaplingResponseDTO findById(String id);
    SaplingResponseDTO create(SaplingRequestDTO request);
    SaplingResponseDTO update(String id, SaplingRequestDTO request);
    void softDelete(String id);
    void validateExists(String id);
    SaplingDocument findByIdEntity(String id);
}

