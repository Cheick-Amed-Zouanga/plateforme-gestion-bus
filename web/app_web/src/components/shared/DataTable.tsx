import React, { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  Plus,
  MoreHorizontal,
} from 'lucide-react'

export interface Column<T> {
  key: keyof T
  label: string
  width?: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  badge?: boolean
  badgeVariant?: 'default' | 'success' | 'warning' | 'destructive'
}

export interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[]
  data: T[]
  keyField?: keyof T
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onAdd?: () => void
  searchable?: boolean
  searchFields?: (keyof T)[]
  sortable?: boolean
  striped?: boolean
  hover?: boolean
  className?: string
  loading?: boolean
  emptyMessage?: string
  pageSize?: number
  pagination?: boolean
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
  onEdit,
  onDelete,
  onAdd,
  searchable = true,
  searchFields = columns.map(c => c.key),
  sortable = true,
  striped = true,
  hover = true,
  className,
  loading = false,
  emptyMessage = 'Aucune donnée trouvée',
  pageSize = 10,
  pagination = true,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T
    direction: 'asc' | 'desc'
  } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchQuery) return data

    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field]?.toString().toLowerCase() || ''
        return value.includes(searchQuery.toLowerCase())
      })
    )
  }, [data, searchQuery, searchFields])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig || !sortable) return filteredData

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig, sortable])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData

    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = useCallback(
    (key: keyof T) => {
      if (!sortable) return

      setSortConfig(prev => {
        if (prev?.key === key) {
          return prev.direction === 'asc'
            ? { key, direction: 'desc' }
            : null
        }
        return { key, direction: 'asc' }
      })
    },
    [sortable]
  )

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <div className="text-slate-500">Chargement...</div>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with search and add button */}
      <div className="flex items-center gap-3">
        {searchable && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950"
            />
          </div>
        )}
        <div className="flex-1" />
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {columns.map(col => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'text-left px-6 py-3 font-semibold text-slate-900',
                      col.width && `w-${col.width}`
                    )}
                  >
                    <button
                      onClick={() => handleSort(col.key)}
                      className={cn(
                        'flex items-center gap-2',
                        col.sortable && 'cursor-pointer hover:text-slate-700'
                      )}
                    >
                      {col.label}
                      {col.sortable &&
                        sortConfig?.key === col.key && (
                          <>
                            {sortConfig.direction === 'asc' ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </>
                        )}
                    </button>
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="text-center px-6 py-3 font-semibold text-slate-900">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                    className="text-center px-6 py-8 text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr
                    key={String(item[keyField])}
                    className={cn(
                      'border-b border-slate-200',
                      striped && idx % 2 === 0 && 'bg-slate-50',
                      hover && 'hover:bg-slate-100 transition-colors'
                    )}
                  >
                    {columns.map(col => (
                      <td
                        key={String(col.key)}
                        className="px-6 py-4 text-slate-900"
                      >
                        {col.render ? (
                          col.render(item[col.key], item)
                        ) : col.badge ? (
                          <Badge variant={col.badgeVariant || 'default'}>
                            {item[col.key]?.toString()}
                          </Badge>
                        ) : (
                          <span>{item[col.key]?.toString() || '—'}</span>
                        )}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1 hover:bg-slate-100 rounded transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4 text-slate-700" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Affichage {(currentPage - 1) * pageSize + 1} à{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} sur{' '}
            {sortedData.length} résultats
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'px-3 py-1 rounded transition-colors',
                    page === currentPage
                      ? 'bg-slate-900 text-white'
                      : 'hover:bg-slate-100'
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
