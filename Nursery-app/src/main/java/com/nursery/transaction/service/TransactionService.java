package com.nursery.transaction.service;

import com.nursery.common.dto.PaginatedResponseDTO;
import com.nursery.common.firestore.pagination.PageRequest;
import com.nursery.transaction.dto.request.TransactionRequestDTO;
import com.nursery.transaction.dto.response.TransactionResponseDTO;

import java.util.List;

public interface TransactionService {
    TransactionResponseDTO createTransaction(String breedId, TransactionRequestDTO request);
    TransactionResponseDTO updateTransaction(String transactionId, TransactionRequestDTO request);
    void softDeleteTransaction(String transactionId);
    void undoTransaction(String transactionId);
    List<TransactionResponseDTO> findAll(String breedId);
    PaginatedResponseDTO<TransactionResponseDTO> findAllPaginated(String breedId, String nurseryId, String saplingId, PageRequest pageRequest);
    TransactionResponseDTO findById(String id);
}

