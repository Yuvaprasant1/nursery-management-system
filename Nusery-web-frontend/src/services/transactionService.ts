import { transactionApi } from '@/screens/transactions/api/transactionApi'
import { Transaction } from '@/screens/transactions/models/types'

/**
 * Transaction Service
 * Centralized service for transaction operations
 */
export const transactionService = {
  /**
   * Get all transactions, optionally filtered by breed ID
   */
  getTransactions: async (breedId?: string): Promise<Transaction[]> => {
    return transactionApi.getTransactions(breedId)
  },

  /**
   * Get transaction by ID
   */
  getTransaction: async (id: string): Promise<Transaction> => {
    return transactionApi.getTransaction(id)
  },

  /**
   * Undo a transaction
   */
  undoTransaction: async (id: string): Promise<void> => {
    return transactionApi.undoTransaction(id)
  },

  /**
   * Soft delete a transaction
   */
  softDeleteTransaction: async (id: string): Promise<void> => {
    return transactionApi.softDeleteTransaction(id)
  },
}

