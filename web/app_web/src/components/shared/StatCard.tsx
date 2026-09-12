import React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: number // percentage change
  trendLabel?: string
  description?: string
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple'
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  description,
  color = 'blue',
}: StatCardProps) {
  const isPositive = trend && trend > 0

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>

          {(trend !== undefined || description) && (
            <div className="flex items-center gap-2 mt-3">
              {trend !== undefined && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded',
                    isPositive
                      ? 'text-green-700 bg-green-50'
                      : 'text-red-700 bg-red-50'
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(trend)}%</span>
                </div>
              )}
              {description && (
                <p className="text-xs text-slate-500">{description}</p>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center text-xl',
              colorClasses[color]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
