import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, CalendarDays } from 'lucide-react'

interface ReactAriaCalendarProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  minDate?: string // YYYY-MM-DD
  maxDate?: string // YYYY-MM-DD
}

interface CalendarDay {
  dateString: string
  dayNum: number
  isCurrentMonth: boolean
  isDisabled: boolean
  isToday: boolean
  isSelected: boolean
}

export default function ReactAriaCalendar({
  value,
  onChange,
  minDate,
  maxDate,
}: ReactAriaCalendarProps) {
  // Parse initial date or default to current date
  const initialDate = useMemo(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) return d
    }
    return new Date()
  }, [value])

  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth())
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear())

  // Sync with value changes from outside (e.g. AI Recommendations)
  useEffect(() => {
    if (value) {
      const parts = value.split('-')
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10) - 1
        if (!isNaN(y) && !isNaN(m)) {
          setCurrentYear(y)
          setCurrentMonth(m)
        }
      }
    }
  }, [value])

  const getLocalDateString = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const date = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${date}`
  }

  const todayStr = useMemo(() => getLocalDateString(new Date()), [])

  const isDateDisabled = (dateStr: string) => {
    if (minDate && dateStr < minDate) return true
    if (maxDate && dateStr > maxDate) return true
    return false
  }

  // Generate calendar grid cells
  const cells = useMemo(() => {
    const tempDay = new Date(currentYear, currentMonth, 1).getDay()
    // Convert Sunday (0) to index 6, Monday (1) to 0, etc.
    const firstDayIndex = tempDay === 0 ? 6 : tempDay - 1

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

    const list: CalendarDay[] = []

    // 1. Previous month days (dimmed)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDayNum = daysInPrevMonth - i
      let prevYear = currentYear
      let prevMonth = currentMonth - 1
      if (prevMonth < 0) {
        prevMonth = 11
        prevYear -= 1
      }
      const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDayNum).padStart(2, '0')}`
      list.push({
        dateString,
        dayNum: prevDayNum,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(dateString),
        isToday: dateString === todayStr,
        isSelected: dateString === value,
      })
    }

    // 2. Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      list.push({
        dateString,
        dayNum: i,
        isCurrentMonth: true,
        isDisabled: isDateDisabled(dateString),
        isToday: dateString === todayStr,
        isSelected: dateString === value,
      })
    }

    // 3. Next month days (dimmed)
    const remaining = list.length % 7
    if (remaining > 0) {
      const nextMonthDaysToShow = 7 - remaining
      for (let i = 1; i <= nextMonthDaysToShow; i++) {
        let nextYear = currentYear
        let nextMonth = currentMonth + 1
        if (nextMonth > 11) {
          nextMonth = 0
          nextYear += 1
        }
        const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        list.push({
          dateString,
          dayNum: i,
          isCurrentMonth: false,
          isDisabled: isDateDisabled(dateString),
          isToday: dateString === todayStr,
          isSelected: dateString === value,
        })
      }
    }

    return list
  }, [currentMonth, currentYear, value, minDate, maxDate, todayStr])

  const prevMonth = () => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }

  const nextMonth = () => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }

  const handleSelectToday = () => {
    if (!isDateDisabled(todayStr)) {
      onChange(todayStr)
    } else {
      // If today is disabled, navigate view to today's month anyway
      const parts = todayStr.split('-')
      setCurrentYear(Number(parts[0]))
      setCurrentMonth(Number(parts[1]) - 1)
    }
  }

  const handleClear = () => {
    onChange('')
  }

  // Navigation button states
  const prevMonthDisabled = useMemo(() => {
    if (!minDate) return false
    const [minY, minM] = minDate.split('-').map(Number)
    return currentYear < minY || (currentYear === minY && currentMonth <= minM - 1)
  }, [currentYear, currentMonth, minDate])

  const nextMonthDisabled = useMemo(() => {
    if (!maxDate) return false
    const [maxY, maxM] = maxDate.split('-').map(Number)
    return currentYear > maxY || (currentYear === maxY && currentMonth >= maxM - 1)
  }, [currentYear, currentMonth, maxDate])

  return (
    <div className="w-full max-w-[340px] mx-auto bg-transparent p-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <button
          type="button"
          onClick={prevMonth}
          disabled={prevMonthDisabled}
          className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
          title="Tháng trước"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>

        <span className="text-[15px] font-bold text-slate-800 tracking-tight capitalize">
          tháng {currentMonth + 1} năm {currentYear}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          disabled={nextMonthDisabled}
          className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
          title="Tháng sau"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-y-1 mb-3 text-center">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
          <div key={day} className="text-[11px] font-bold uppercase tracking-wider text-slate-400/80 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center justify-items-center mb-4">
        {cells.map((cell) => {
          return (
            <button
              key={cell.dateString}
              type="button"
              disabled={cell.isDisabled}
              onClick={() => onChange(cell.dateString)}
              className={`
                group relative w-10 h-10 flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none select-none hover:scale-105 active:scale-95
                ${cell.isSelected
                  ? 'bg-gradient-to-br from-[#0ea5b7] to-[#0c8fa0] text-white shadow-md shadow-cyan-100/50 font-bold scale-105'
                  : cell.isDisabled
                    ? cell.isCurrentMonth
                      ? 'text-slate-300 pointer-events-none cursor-default font-normal'
                      : 'text-slate-200 pointer-events-none cursor-default font-normal'
                    : cell.isToday
                      ? 'bg-cyan-50/60 text-[#0ea5b7] border border-cyan-100/80 cursor-pointer hover:bg-cyan-100/50'
                      : cell.isCurrentMonth
                        ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                        : 'text-slate-400 hover:bg-slate-50 cursor-pointer'
                }
              `}
            >
              {/* Day number */}
              <span className={cell.isToday ? '-mt-1' : ''}>
                {cell.dayNum}
              </span>

              {/* Dot indicator under day number */}
              {cell.isToday && (
                <span
                  className={`
                    absolute bottom-1.5 w-1 h-1 rounded-full transition-colors
                    ${cell.isSelected
                      ? 'bg-white'
                      : cell.isDisabled
                        ? 'bg-slate-300'
                        : 'bg-[#0ea5b7]'
                    }
                  `}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Footer Actions (Today & Clear) */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100/80 px-2 mt-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={!value}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <RotateCcw size={12} />
          Xóa chọn
        </button>

        <button
          type="button"
          onClick={handleSelectToday}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0ea5b7] hover:text-[#0c8fa0] hover:underline transition cursor-pointer"
        >
          <CalendarDays size={12} />
          Hôm nay
        </button>
      </div>
    </div>
  )
}
