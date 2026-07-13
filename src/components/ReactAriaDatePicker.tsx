import { useState, useRef, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import ReactAriaCalendar from './ReactAriaCalendar'

interface ReactAriaDatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  minDate?: string // YYYY-MM-DD
  maxDate?: string // YYYY-MM-DD
  placeholder?: string
}

export default function ReactAriaDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Chọn ngày mang xe đến...',
}: ReactAriaDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Format YYYY-MM-DD to DD/MM/YYYY for display
  const displayValue = (() => {
    if (!value) return ''
    const parts = value.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return value
  })()

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleDateSelect = (dateStr: string) => {
    onChange(dateStr)
    setIsOpen(false) // Close popover on selection
  }

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {/* Input Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-cyan-400/60 px-4 py-3 text-sm font-medium text-slate-800 cursor-pointer shadow-sm transition duration-200"
      >
        <span className={displayValue ? 'text-slate-800 font-bold' : 'text-slate-400 font-normal'}>
          {displayValue || placeholder}
        </span>
        <Calendar size={18} className="text-slate-400 group-hover:text-cyan-500 transition duration-200" />
      </div>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-full max-w-[340px] bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <ReactAriaCalendar
            value={value}
            onChange={handleDateSelect}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}
    </div>
  )
}
