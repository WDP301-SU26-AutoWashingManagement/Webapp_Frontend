import { toast } from 'sonner'

const TOAST_OPTIONS = {
  duration: 4500,
  closeButton: true,
}

export function showToast(message, type = 'info') {
  if (!message) return

  const fn = toast[type] ?? toast
  fn(message, TOAST_OPTIONS)
}

export function showError(message) {
  showToast(message, 'error')
}

export function showSuccess(message) {
  showToast(message, 'success')
}

export function showInfo(message) {
  showToast(message, 'info')
}
