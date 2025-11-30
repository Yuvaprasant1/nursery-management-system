package com.nursery.nursery.service;

import com.nursery.common.exception.EntityNotFoundException;
import com.nursery.nursery.dto.request.NurseryRequestDTO;
import com.nursery.nursery.dto.response.NurseryResponseDTO;
import com.nursery.nursery.firestore.NurseryDocument;
import com.nursery.nursery.firestore.NurseryFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NurseryServiceImpl implements NurseryService {
    
    private final NurseryFirestoreRepository repository;
    
    @Override
    public List<NurseryResponseDTO> findAll() {
        return repository.findNonDeleted().stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public NurseryResponseDTO findById(String id) {
        NurseryDocument nursery = findByIdEntity(id);
        return toResponseDTO(nursery);
    }
    
    @Override
    public NurseryResponseDTO create(NurseryRequestDTO request) {
        NurseryDocument nursery = toDocument(request);
        String id = repository.save(nursery);
        log.info("Created nursery: {}", id);
        return toResponseDTO(nursery);
    }
    
    @Override
    public NurseryResponseDTO update(String id, NurseryRequestDTO request) {
        NurseryDocument nursery = findByIdEntity(id);
        nursery.setName(request.getName());
        nursery.setLocation(request.getLocation());
        nursery.setPhone(request.getPhone());
        repository.save(nursery);
        log.info("Updated nursery: {}", id);
        return toResponseDTO(nursery);
    }
    
    @Override
    public void softDelete(String id) {
        NurseryDocument nursery = findByIdEntity(id);
        nursery.softDelete();
        repository.save(nursery);
        log.info("Soft deleted nursery: {}", id);
    }
    
    @Override
    public void validateExists(String id) {
        if (!repository.existsByIdAndNotDeleted(id)) {
            throw new EntityNotFoundException("Nursery", id);
        }
    }
    
    @Override
    public NurseryDocument findByIdEntity(String id) {
        return repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Nursery", id));
    }
    
    private NurseryDocument toDocument(NurseryRequestDTO dto) {
        NurseryDocument doc = new NurseryDocument();
        doc.setName(dto.getName());
        doc.setLocation(dto.getLocation());
        doc.setPhone(dto.getPhone());
        return doc;
    }
    
    private NurseryResponseDTO toResponseDTO(NurseryDocument doc) {
        NurseryResponseDTO dto = new NurseryResponseDTO();
        dto.setId(doc.getId());
        dto.setName(doc.getName());
        dto.setLocation(doc.getLocation());
        dto.setPhone(doc.getPhone());
        dto.setCreatedAt(doc.getCreatedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        return dto;
    }
}
