'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchFormProps {
  initialQuery?: string
  disabled?: boolean
}

export function SearchForm({ initialQuery = '', disabled = false }: SearchFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [isSearching, setIsSearching] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || disabled) return

    setIsSearching(true)
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    // Reset after navigation
    setTimeout(() => setIsSearching(false), 500)
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter phone number or @instagram..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={disabled || isSearching || !query.trim()}>
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Searches are encrypted and anonymous. The identifier you search is hashed before lookup.
      </p>
    </form>
  )
}
