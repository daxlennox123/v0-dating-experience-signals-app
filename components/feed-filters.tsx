'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

const colorFilters = [
  { value: 'all', label: 'All' },
  { value: 'green', label: 'Positive', colorClass: 'bg-[var(--signal-green)]' },
  { value: 'yellow', label: 'Caution', colorClass: 'bg-[var(--signal-yellow)]' },
  { value: 'red', label: 'Warning', colorClass: 'bg-[var(--signal-red)]' },
]

export function FeedFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentColor = searchParams.get('color') || 'all'

  function setFilter(color: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (color === 'all') {
      params.delete('color')
    } else {
      params.set('color', color)
    }
    router.push(`/feed?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      {colorFilters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentColor === filter.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter(filter.value)}
          className="shrink-0 gap-2"
        >
          {filter.colorClass && (
            <span className={`w-2 h-2 rounded-full ${filter.colorClass}`} />
          )}
          {filter.label}
        </Button>
      ))}
    </div>
  )
}
