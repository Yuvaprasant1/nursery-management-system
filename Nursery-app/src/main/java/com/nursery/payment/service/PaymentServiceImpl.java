package com.nursery.payment.service;

import com.nursery.common.exception.EntityNotFoundException;
import com.nursery.common.exception.ValidationException;
import com.nursery.common.util.SecurityUtil;
import com.nursery.payment.dto.request.PaymentRequestDTO;
import com.nursery.payment.dto.response.PaymentResponseDTO;
import com.nursery.payment.firestore.PaymentDocument;
import com.nursery.payment.firestore.PaymentFirestoreRepository;
import com.nursery.transaction.firestore.TransactionDocument;
import com.nursery.transaction.firestore.TransactionFirestoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    
    private final PaymentFirestoreRepository paymentRepository;
    private final TransactionFirestoreRepository transactionRepository;
    
    @Override
    public PaymentResponseDTO createPayment(String transactionId, PaymentRequestDTO request) {
        log.debug("Creating payment for transactionId={}, amount={}", transactionId, request.getAmount());
        
        // Validate amount
        validateAmount(request.getAmount());
        
        // Validate transaction exists and is not deleted
        TransactionDocument transaction = validateAndGetTransaction(transactionId);
        
        // Validate transactionId matches request
        if (!transactionId.equals(request.getTransactionId())) {
            log.warn("Transaction ID mismatch: path={}, request={}", transactionId, request.getTransactionId());
            throw new ValidationException("Transaction ID in path must match request body");
        }
        
        // Create payment document
        PaymentDocument paymentDoc = buildPaymentDocument(transaction, request);
        paymentDoc.setUserPhone(SecurityUtil.getCurrentUserPhone());
        
        // Save payment
        String paymentId = paymentRepository.save(paymentDoc);
        paymentDoc.setId(paymentId);
        
        log.info("Created payment: id={}, transactionId={}, amount={}, type={}", 
            paymentId, transactionId, request.getAmount(), request.getType());
        return toResponseDTO(paymentDoc);
    }
    
    @Override
    public PaymentResponseDTO updatePayment(String paymentId, PaymentRequestDTO request) {
        log.debug("Updating payment: id={}, amount={}", paymentId, request.getAmount());
        
        // Validate amount
        validateAmount(request.getAmount());
        
        // Find existing payment
        PaymentDocument payment = validateAndGetPayment(paymentId);
        
        // Validate and update transaction reference if changed
        if (!payment.getTransactionId().equals(request.getTransactionId())) {
            String oldTransactionId = payment.getTransactionId();
            TransactionDocument newTransaction = validateAndGetTransaction(request.getTransactionId());
            payment.setTransactionId(request.getTransactionId());
            payment.setNurseryId(newTransaction.getNurseryId());
            payment.setBreedId(newTransaction.getBreedId());
            log.debug("Updated payment transaction reference: oldTransactionId={}, newTransactionId={}", 
                oldTransactionId, request.getTransactionId());
        }
        
        // Update payment fields
        updatePaymentFields(payment, request);
        
        // Save updated payment
        paymentRepository.save(payment);
        
        log.info("Updated payment: id={}, transactionId={}, amount={}, type={}", 
            paymentId, payment.getTransactionId(), request.getAmount(), request.getType());
        return toResponseDTO(payment);
    }
    
    @Override
    public List<PaymentResponseDTO> findByTransactionId(String transactionId) {
        log.debug("Finding payments for transactionId={}", transactionId);
        
        // Validate transaction exists
        validateAndGetTransaction(transactionId);
        
        List<PaymentResponseDTO> payments = paymentRepository.findByTransactionIdAndNotDeleted(transactionId).stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
        
        log.debug("Found {} payments for transactionId={}", payments.size(), transactionId);
        return payments;
    }
    
    @Override
    public PaymentResponseDTO findById(String id) {
        log.debug("Finding payment by id={}", id);
        PaymentDocument payment = validateAndGetPayment(id);
        return toResponseDTO(payment);
    }
    
    @Override
    public void softDeletePayment(String id) {
        log.debug("Soft deleting payment: id={}", id);
        
        PaymentDocument payment = validateAndGetPayment(id);
        payment.softDelete();
        paymentRepository.save(payment);
        
        log.info("Soft deleted payment: id={}, transactionId={}", id, payment.getTransactionId());
    }
    
    /**
     * Validates that the payment amount is greater than zero.
     * 
     * @param amount the amount to validate
     * @throws ValidationException if amount is null, zero, or negative
     */
    private void validateAmount(BigDecimal amount) {
        if (amount == null) {
            throw new ValidationException("Payment amount cannot be null");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Payment amount must be greater than zero");
        }
    }
    
    /**
     * Validates and retrieves a transaction by ID.
     * 
     * @param transactionId the transaction ID
     * @return the transaction document
     * @throws EntityNotFoundException if transaction not found or is deleted
     */
    private TransactionDocument validateAndGetTransaction(String transactionId) {
        return transactionRepository.findById(transactionId)
            .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
            .orElseThrow(() -> {
                log.warn("Transaction not found or deleted: transactionId={}", transactionId);
                return new EntityNotFoundException("Transaction", transactionId);
            });
    }
    
    /**
     * Validates and retrieves a payment by ID.
     * 
     * @param paymentId the payment ID
     * @return the payment document
     * @throws EntityNotFoundException if payment not found or is deleted
     */
    private PaymentDocument validateAndGetPayment(String paymentId) {
        return paymentRepository.findById(paymentId)
            .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
            .orElseThrow(() -> {
                log.warn("Payment not found or deleted: paymentId={}", paymentId);
                return new EntityNotFoundException("Payment", paymentId);
            });
    }
    
    /**
     * Builds a new payment document from transaction and request data.
     * 
     * @param transaction the transaction document
     * @param request the payment request DTO
     * @return the payment document
     */
    private PaymentDocument buildPaymentDocument(TransactionDocument transaction, PaymentRequestDTO request) {
        PaymentDocument paymentDoc = new PaymentDocument();
        paymentDoc.setTransactionId(transaction.getId());
        paymentDoc.setNurseryId(transaction.getNurseryId());
        paymentDoc.setBreedId(transaction.getBreedId());
        paymentDoc.setType(request.getType());
        paymentDoc.setAmount(request.getAmount());
        paymentDoc.setDescription(request.getDescription());
        return paymentDoc;
    }
    
    /**
     * Updates payment document fields from request DTO.
     * 
     * @param payment the payment document to update
     * @param request the payment request DTO
     */
    private void updatePaymentFields(PaymentDocument payment, PaymentRequestDTO request) {
        payment.setType(request.getType());
        payment.setAmount(request.getAmount());
        payment.setDescription(request.getDescription());
    }
    
    /**
     * Converts a payment document to a response DTO.
     * 
     * @param doc the payment document
     * @return the payment response DTO
     */
    private PaymentResponseDTO toResponseDTO(PaymentDocument doc) {
        PaymentResponseDTO dto = new PaymentResponseDTO();
        dto.setId(doc.getId());
        dto.setTransactionId(doc.getTransactionId());
        dto.setNurseryId(doc.getNurseryId());
        dto.setBreedId(doc.getBreedId());
        dto.setType(doc.getType());
        dto.setAmount(doc.getAmount());
        dto.setDescription(doc.getDescription());
        dto.setUserPhone(doc.getUserPhone());
        dto.setIsDeleted(doc.getIsDeleted());
        dto.setCreatedAt(doc.getCreatedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        return dto;
    }
}

