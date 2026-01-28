// Simple toast utility for non-hook contexts
// For components, use useToast from @/hooks/use-toast

let toastFn: ((props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void) | null = null

export function setToastFunction(fn: typeof toastFn) {
  toastFn = fn
}

export function showToast(title: string, variant?: 'default' | 'destructive') {
  if (toastFn) {
    toastFn({ title, variant })
  } else {
    console.warn('[v0] Toast function not initialized')
  }
}

export function showErrorToast(title: string) {
  showToast(title, 'destructive')
}

export function showSuccessToast(title: string) {
  showToast(title, 'default')
}
