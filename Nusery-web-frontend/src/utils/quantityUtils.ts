import { TransactionType } from '@/enums'

/**
 * Calculate the upcoming inventory quantity based on a transaction change
 * 
 * @param currentQuantity - Current inventory quantity
 * @param transactionType - Type of transaction (PLANTED, SELL, ADJUST)
 * @param quantity - The quantity value (always positive for PLANTED/SELL, can be negative for ADJUST)
 * @param currentDelta - Optional: current delta of the transaction being edited
 * @returns Object with upcomingQuantity and isValid flag
 */
export function calculateUpcomingQuantity(
  currentQuantity: number,
  transactionType: TransactionType,
  quantity: number | undefined | null,
  currentDelta?: number
): { upcomingQuantity: number | null; isValid: boolean } {
  // Handle undefined/null quantity
  if (quantity === undefined || quantity === null) {
    return { upcomingQuantity: currentQuantity, isValid: false }
  }

  const qty = typeof quantity === 'number' && !Number.isNaN(quantity) ? quantity : 0

  // If editing an existing transaction, calculate the delta change
  if (currentDelta !== undefined) {
    let newDelta: number
    
    switch (transactionType) {
      case TransactionType.SELL:
        newDelta = -Math.abs(qty)
        break
      case TransactionType.PLANTED:
        newDelta = Math.abs(qty)
        break
      case TransactionType.ADJUST:
        newDelta = qty // Can be positive or negative
        break
      default:
        newDelta = currentDelta
    }
    
    const deltaChange = newDelta - currentDelta
    const upcomingQuantity = currentQuantity + deltaChange
    
    return {
      upcomingQuantity,
      isValid: upcomingQuantity >= 0
    }
  }

  // For new transactions
  let upcomingQuantity: number
  
  switch (transactionType) {
    case TransactionType.PLANTED:
      upcomingQuantity = currentQuantity + qty
      break
    case TransactionType.SELL:
      upcomingQuantity = currentQuantity - qty
      break
    case TransactionType.ADJUST:
      upcomingQuantity = currentQuantity + qty // qty can be positive or negative
      break
    default:
      upcomingQuantity = currentQuantity
  }

  return {
    upcomingQuantity,
    isValid: upcomingQuantity >= 0
  }
}

