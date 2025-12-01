'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/Card'
import { ResponsiveTableRow } from './ResponsiveTableRow'
import { TableColumn, TableAction } from './types'
import { cn } from '@/utils/cn'

interface ResponsiveTableProps<T = any> {
  columns: TableColumn<T>[]
  data: T[]
  actions?: TableAction<T>[]
  emptyMessage?: string
  className?: string
  rowClassName?: string | ((row: T) => string)
  keyExtractor?: (row: T) => string | number
  loading?: boolean
  loadingComponent?: ReactNode
}

export function ResponsiveTable<T = any>({
  columns,
  data,
  actions,
  emptyMessage = 'No data available',
  className,
  rowClassName,
  keyExtractor,
  loading = false,
  loadingComponent,
}: ResponsiveTableProps<T>) {
  if (loading && loadingComponent) {
    return <>{loadingComponent}</>
  }

  if (data.length === 0) {
    return (
      <Card>
        <p className="text-gray-600 text-center py-8">{emptyMessage}</p>
      </Card>
    )
  }

  const getRowKey = (row: T, index: number): string | number => {
    if (keyExtractor) return keyExtractor(row)
    if ((row as any).id) return (row as any).id
    return index
  }

  const getRowClassName = (row: T): string => {
    if (typeof rowClassName === 'function') return rowClassName(row)
    return rowClassName || ''
  }

  const hasActions = actions && actions.length > 0

  return (
    <div className={cn('space-y-3 sm:space-y-0', className)}>
      {/* Mobile: Card List (automatically rendered by ResponsiveTableRow) */}
      {/* Desktop: Table */}
      <Card className="p-0 hidden sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                      column.className
                    )}
                  >
                    {column.header}
                  </th>
                ))}
                {hasActions && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <ResponsiveTableRow
                  key={getRowKey(row, index)}
                  row={row}
                  columns={columns}
                  actions={actions}
                  rowClassName={getRowClassName(row)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Stacked Cards */}
      <div className="block sm:hidden space-y-3">
        {data.map((row, index) => (
          <ResponsiveTableRow
            key={getRowKey(row, index)}
            row={row}
            columns={columns}
            actions={actions}
            rowClassName={getRowClassName(row)}
          />
        ))}
      </div>
    </div>
  )
}
