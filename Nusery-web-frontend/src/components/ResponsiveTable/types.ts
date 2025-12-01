import { ReactNode } from 'react'

export interface TableColumn<T = any> {
  key: string
  header: string
  accessor?: (row: T) => ReactNode
  render?: (value: any, row: T) => ReactNode
  hideOnMobile?: boolean
  className?: string
}

export interface TableAction<T = any> {
  label: string
  icon?: ReactNode
  onClick: (row: T) => void
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  showLabel?: boolean
}
