import { useCallback, useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

const OTP_LENGTH = 6

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
}

export default function OtpInput({ value, onChange, disabled = false, id = 'otp-input' }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '')

  const focusIndex = (index: number) => {
    const el = inputsRef.current[index]
    if (el) {
      el.focus()
      el.select()
    }
  }

  const updateValue = useCallback(
    (nextDigits: string[]) => {
      onChange(nextDigits.join('').slice(0, OTP_LENGTH))
    },
    [onChange],
  )

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    updateValue(next)
    if (digit && index < OTP_LENGTH - 1) {
      focusIndex(index + 1)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (next[index]) {
        next[index] = ''
        updateValue(next)
      } else if (index > 0) {
        next[index - 1] = ''
        updateValue(next)
        focusIndex(index - 1)
      }
      return
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusIndex(index - 1)
      return
    }

    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault()
      focusIndex(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLDivElement | HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return

    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? '')
    updateValue(next)
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  useEffect(() => {
    if (!disabled) {
      focusIndex(0)
    }
  }, [disabled])

  return (
    <div
      className="flex justify-center gap-2 sm:gap-2.5"
      role="group"
      aria-label="Mã xác nhận 6 số"
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={digit}
          aria-label={`Số thứ ${index + 1}`}
          className={`h-12 w-10 rounded-lg border bg-slate-50/80 text-center font-sans text-lg font-semibold outline-none transition focus:border-[#0ea5b7] focus:bg-white focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 sm:h-14 sm:w-12 sm:text-xl ${
            digit ? 'border-[#0ea5b7] text-slate-900' : 'border-cyan-500/15 text-slate-900'
          }`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
}
