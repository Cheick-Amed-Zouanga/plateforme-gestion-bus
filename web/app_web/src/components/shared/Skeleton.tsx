import React from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-slate-200 animate-pulse rounded',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="p-6 border border-slate-200 rounded-lg space-y-3">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 border border-slate-200 rounded-lg flex gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonAvatar() {
  return <Skeleton className="h-10 w-10 rounded-full" />
}

export function SkeletonButton() {
  return <Skeleton className="h-10 w-32 rounded-lg" />
}

export function SkeletonInput() {
  return <Skeleton className="h-10 w-full rounded-lg" />
}
