package com.nursery.nursery.service;

import com.nursery.nursery.dto.request.NurseryRequestDTO;
import com.nursery.nursery.dto.response.NurseryResponseDTO;
import com.nursery.nursery.firestore.NurseryDocument;

import java.util.List;

public interface NurseryService {
    List<NurseryResponseDTO> findAll();
    NurseryResponseDTO findById(String id);
    NurseryResponseDTO create(NurseryRequestDTO request);
    NurseryResponseDTO update(String id, NurseryRequestDTO request);
    void softDelete(String id);
    void validateExists(String id);
    NurseryDocument findByIdEntity(String id);
}

