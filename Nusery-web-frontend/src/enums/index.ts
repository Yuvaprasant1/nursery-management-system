/**
 * Application-wide enumerations
 * 
 * This file contains all string enumerations used throughout the application.
 * Using enums ensures type safety, consistency, and easier maintenance.
 */

/**
 * Transaction type enumeration
 * Represents the different types of inventory transactions
 */
export enum TransactionType {
  SELL = 'SELL',
  RECEIVE = 'RECEIVE',
  PLANTED = 'PLANTED',
  ADJUST = 'ADJUST',
  COMPENSATION = 'COMPENSATION',
}

/**
 * Toast type enumeration
 * Represents the different types of toast notifications
 */
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
}

/**
 * Confirmation dialog variant enumeration
 * Represents the different visual variants for confirmation dialogs
 */
export enum ConfirmationVariant {
  DANGER = 'danger',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * HTTP status code enumeration
 * Represents commonly used HTTP status codes in the application
 */
export enum HttpStatusCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Button action enumeration
 * Represents common button action labels used throughout the UI
 */
export enum ButtonAction {
  CANCEL = 'Cancel',
  CONFIRM = 'Confirm',
  DELETE = 'Delete',
  SUBMIT = 'Submit',
  SAVE = 'Save',
  EDIT = 'Edit',
  CREATE = 'Create',
  UPDATE = 'Update',
  BACK = 'Back',
  RETRY = 'Retry',
  TRY_AGAIN = 'Try Again',
  DELETING = 'Deleting...',
  LOADING = 'Loading...',
}

/**
 * Error message enumeration
 * Represents common error messages used throughout the application
 */
export enum ErrorMessage {
  NETWORK_ERROR = 'Network error. Please check your connection.',
  FAILED_TO_SEND_REQUEST = 'Failed to send request',
  UNAUTHORIZED_ACTION = 'You are not authorized to perform this action.',
  NO_PERMISSION = 'You do not have permission to access this resource.',
  RESOURCE_NOT_FOUND = 'The requested resource was not found.',
  VALIDATION_FAILED = 'Validation failed',
  SERVER_ERROR = 'Server error. Please try again later.',
  UNEXPECTED_ERROR = 'An unexpected error occurred.',
  UNEXPECTED_ERROR_RETRY = 'An unexpected error occurred. Please try again.',
  QUANTITY_MUST_BE_WHOLE_NUMBER = 'Quantity must be a whole number',
  ADJUSTMENT_QUANTITY_CANNOT_BE_ZERO = 'Adjustment quantity cannot be 0',
  QUANTITY_MUST_BE_GREATER_THAN_ZERO = 'Quantity must be greater than 0',
  BREED_ID_NOT_FOUND = 'Breed ID not found',
  BREED_INFORMATION_NOT_LOADED = 'Breed information not loaded',
  FAILED_TO_CREATE_TRANSACTION = 'Failed to create transaction',
  FAILED_TO_LOAD_INVENTORY = 'Failed to load inventory',
  INVENTORY_NOT_FOUND = 'Inventory not found. It will be created automatically when you create a transaction.',
}

/**
 * Success message enumeration
 * Represents common success messages used throughout the application
 */
export enum SuccessMessage {
  TRANSACTION_CREATED = 'Transaction created successfully!',
}

/**
 * UI text enumeration
 * Represents common UI text strings used throughout the application
 */
export enum UIText {
  SOMETHING_WENT_WRONG = 'Something went wrong',
  ERROR_OCCURRED = 'An error occurred while loading this content. Please try again.',
  BACK_TO_INVENTORY = '← Back to Inventory',
  CURRENT_QUANTITY = 'Current Quantity',
  UPCOMING_QUANTITY = 'Upcoming Quantity',
  CREATE_TRANSACTION = 'Create Transaction',
  TRANSACTION_TYPE = 'Transaction Type',
  QUANTITY = 'Quantity',
  ADJUSTMENT_AMOUNT = 'Adjustment Amount (Positive or Negative)',
  NOTES_OPTIONAL = 'Notes (Optional)',
  ADD_NOTES = 'Add any notes about this transaction...',
  ENTER_QUANTITY = 'Enter quantity',
  ADJUSTMENT_EXAMPLE = 'e.g., 10 or -5',
  RECEIVE_INCREASE = 'Receive (Increase)',
  PLANTED_INCREASE = 'Planted (Increase)',
  SELL_DECREASE = 'Sell (Decrease)',
  ADJUST_POSITIVE_OR_NEGATIVE = 'Adjust (Positive or Negative)',
  ADJUSTMENT_NOTE = 'Note: Enter positive value to increase inventory, negative value to decrease.',
  ADDING = 'Adding',
  REMOVING = 'Removing',
  UNITS = 'units',
  NEW_TOTAL = 'New total:',
  WOULD_RESULT_IN_NEGATIVE_INVENTORY = '⚠️ This would result in negative inventory',
  INSUFFICIENT_INVENTORY = 'Insufficient inventory. Current quantity:',
}

/**
 * Transaction type display labels
 * Maps transaction types to their display labels
 */
export const TransactionTypeLabels: Record<TransactionType, string> = {
  [TransactionType.SELL]: UIText.SELL_DECREASE,
  [TransactionType.RECEIVE]: UIText.RECEIVE_INCREASE,
  [TransactionType.PLANTED]: UIText.PLANTED_INCREASE,
  [TransactionType.ADJUST]: UIText.ADJUST_POSITIVE_OR_NEGATIVE,
  [TransactionType.COMPENSATION]: 'Compensation',
}

/**
 * Toast type display labels
 * Maps toast types to their display labels
 */
export const ToastTypeLabels: Record<ToastType, string> = {
  [ToastType.SUCCESS]: 'Success',
  [ToastType.ERROR]: 'Error',
  [ToastType.INFO]: 'Information',
}

/**
 * Confirmation variant display labels
 * Maps confirmation variants to their display labels
 */
export const ConfirmationVariantLabels: Record<ConfirmationVariant, string> = {
  [ConfirmationVariant.DANGER]: 'Danger',
  [ConfirmationVariant.WARNING]: 'Warning',
  [ConfirmationVariant.INFO]: 'Information',
}

