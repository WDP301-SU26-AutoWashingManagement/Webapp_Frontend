import { toast } from 'sonner'

const TOAST_OPTIONS = {
  duration: 1000,
  closeButton: true,
} as const

type ToastType = 'success' | 'error' | 'info' | 'warning'

export function showToast(message: string, type: ToastType = 'info'): void {
  if (!message) return
  toast[type](message, TOAST_OPTIONS)
}

export function showError(message: string): void {
  showToast(message, 'error')
}

export function showSuccess(message: string): void {
  showToast(message, 'success')
}

export function showInfo(message: string): void {
  showToast(message, 'info')
}
