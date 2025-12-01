'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/Card'
import { IconButton } from '@/components/IconButton'
import { TableColumn, TableAction } from './types'
import { cn } from '@/utils/cn'

interface ResponsiveTableRowProps<T = any> {
  row: T
  columns: TableColumn<T>[]
  actions?: TableAction<T>[]
  rowClassName?: string
}

export function ResponsiveTableRow<T = any>({
  row,
  columns,
  actions,
  rowClassName,
}: ResponsiveTableRowProps<T>) {
  return (
    <>
      {/* Mobile: Card Layout */}
      <div className="block sm:hidden">
        <Card className={cn('p-4 space-y-3', rowClassName)}>
          {columns
            .filter(col => !col.hideOnMobile)
            .map((column) => {
              const value = column.accessor ? column.accessor(row) : (row as any)[column.key]
              const renderedValue = column.render ? column.render(value, row) : value

              return (
                <div key={column.key} className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {column.header}
                  </span>
                  <span className={cn('text-sm text-gray-900', column.className)}>
                    {renderedValue || '—'}
                  </span>
                </div>
              )
            })}
          
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              {actions.map((action, idx) => (
                <IconButton
                  key={idx}
                  onClick={() => action.onClick(row)}
                  variant={action.variant || 'outline'}
                  size="sm"
                  label={action.label}
                  showLabel={action.showLabel !== false}
                  title={action.label}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Desktop: Table Row */}
      <tr className={cn('hidden sm:table-row hover:bg-gray-50 transition-colors', rowClassName)}>
        {columns.map((column) => {
          const value = column.accessor ? column.accessor(row) : (row as any)[column.key]
          const renderedValue = column.render ? column.render(value, row) : value

          return (
            <td
              key={column.key}
              className={cn(
                'px-4 py-3 whitespace-nowrap text-sm',
                column.className
              )}
            >
              {renderedValue || '—'}
            </td>
          )
        })}
        
        {actions && actions.length > 0 && (
          <td className="px-4 py-3 whitespace-nowrap text-sm">
            <div className="flex items-center gap-2">
              {actions.map((action, idx) => (
                <IconButton
                  key={idx}
                  onClick={() => action.onClick(row)}
                  variant={action.variant || 'outline'}
                  size="sm"
                  title={action.label}
                />
              ))}
            </div>
          </td>
        )}
      </tr>
    </>
  )
}
