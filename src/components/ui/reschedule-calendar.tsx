"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Calendar } from "@/components/ui/calendar"

interface RescheduleCalendarProps {
  eventId?: string;
  email?: string;
  candidate?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function formatTime12(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`
}

interface Slot {
  value: string;
  label: string;
  hour: number;
  minute: number;
}

/* ─── Time Carousel ─── */
function TimeCarousel({
  slots,
  selected,
  onSelect,
}: {
  slots: Slot[];
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  const selIndex = selected ? slots.findIndex(s => s.value === selected) : -1

  function goNext() {
    if (selIndex < 0) { onSelect(slots[0].value); return }
    if (selIndex < slots.length - 1) onSelect(slots[selIndex + 1].value)
  }

  function goPrev() {
    if (selIndex < 0) { onSelect(slots[0].value); return }
    if (selIndex > 0) onSelect(slots[selIndex - 1].value)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goNext() }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goPrev() }
  }

  function handleWheel(e: React.WheelEvent) {
    if (e.deltaY < 0) goPrev()
    else goNext()
  }

  const selectedSlot = selected ? slots.find(s => s.value === selected) : null

  if (slots.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No available slots for this date
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center select-none">
        <div className="text-center">
          <p className="text-[13px] font-medium text-gray-400 mb-3">Choose a time slot</p>
          <button
            type="button"
            onClick={() => onSelect(slots[Math.floor(slots.length / 2)].value)}
            className="px-5 py-2.5 rounded-xl text-[12px] font-semibold text-white bg-gradient-to-r from-[#2563eb] to-[#3b82f6] hover:shadow-md hover:shadow-blue-200 transition-all duration-200 cursor-pointer"
          >
            Show available times
          </button>
        </div>
      </div>
    )
  }

  const visibleIndices: number[] = []
  for (let i = selIndex - 2; i <= selIndex + 2; i++) {
    if (i >= 0 && i < slots.length) visibleIndices.push(i)
  }

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center select-none outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      role="listbox"
      aria-label="Available time slots"
    >
      <div className="w-full max-w-[340px] flex flex-col items-center gap-3">
        {/* Slot count */}
        <p className="text-[10px] font-medium text-gray-400">
          {selIndex + 1} of {slots.length} slots
        </p>

        {/* Carousel row */}
        <div className="flex items-center justify-center gap-2 w-full">
          {/* Previous arrow */}
          <button
            type="button"
            onClick={goPrev}
            disabled={selIndex <= 0}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:text-[#2563eb] hover:border-[#2563eb] transition-all duration-200 cursor-pointer disabled:opacity-25 disabled:cursor-default"
            aria-label="Previous time"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Center: selected card */}
          <motion.div
            key={selected}
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28, mass: 0.8 }}
            className="flex-1 max-w-[180px]"
          >
            <div className="bg-gradient-to-br from-[#2563eb] to-[#3b82f6] rounded-xl shadow-md shadow-blue-200/30 px-3 py-3 text-center">
              <p className="text-[28px] font-bold text-white leading-tight">
                {selectedSlot!.label}
              </p>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-[9px] font-semibold text-white">30 min</span>
              </div>
            </div>
          </motion.div>

          {/* Next arrow */}
          <button
            type="button"
            onClick={goNext}
            disabled={selIndex >= slots.length - 1}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-400 hover:text-[#2563eb] hover:border-[#2563eb] transition-all duration-200 cursor-pointer disabled:opacity-25 disabled:cursor-default"
            aria-label="Next time"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Adjacent pill buttons */}
        <div className="flex items-center justify-center gap-2 flex-wrap min-h-[32px]">
          {visibleIndices.map((i) => {
            const slot = slots[i]
            const isSel = i === selIndex
            return (
              <motion.button
                key={slot.value}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: Math.abs(i - selIndex) * 0.03 }}
                type="button"
                onClick={() => onSelect(slot.value)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 cursor-pointer ${
                  isSel
                    ? 'bg-[#2563eb] text-white shadow-sm shadow-blue-200'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {slot.label}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

type ToastType = { message: string; type: "success" | "error" } | null

/* ─── Main Component ─── */
export function RescheduleCalendar({ eventId, email, candidate, onSuccess, onCancel }: RescheduleCalendarProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [toast, setToast] = React.useState<ToastType>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const timeSlots: Slot[] = React.useMemo(() => {
    return Array.from({ length: 37 }, (_, i) => {
      const totalMinutes = i * 15
      const hour = Math.floor(totalMinutes / 60) + 9
      const minute = totalMinutes % 60
      const hh = hour.toString().padStart(2, "0")
      const mm = minute.toString().padStart(2, "0")
      return {
        value: `${hh}:${mm}`,
        label: formatTime12(hour, minute),
        hour,
        minute,
      }
    })
  }, [])

  const handleSubmit = async () => {
    if (!date || !selectedTime) return;

    setIsSubmitting(true);
    setToast(null);
    const payload = {
      action: 'RescheduleInterview',
      eventId: eventId,
      interviewerEmail: email,
      newDate: date.toISOString().split('T')[0],
      newTime: selectedTime,
      candidate: candidate,
    };

    try {
      const response = await fetch('https://n8n.srv1711190.hstgr.cloud/webhook/538777bd-75c0-4a62-a409-9a8e1e42c5fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const body = await response.json();

      if (!response.ok) throw new Error(body.message || 'Failed to reschedule');

      if (body.status === 'Booking Confirmed') {
        setToast({ message: 'Meeting rescheduled successfully!', type: 'success' });
        if (onSuccess) setTimeout(onSuccess, 1200);
      } else if (body.status === 'unavailable') {
        setToast({ message: 'This slot is already occupied — please pick another time.', type: 'error' });
      } else {
        setToast({ message: 'Unexpected response from server.', type: 'error' });
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
      setToast({ message: error instanceof Error ? error.message : 'Something went wrong', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSlotLabel = React.useMemo(() => {
    if (!date || !selectedTime) return null
    const d = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    const slot = timeSlots.find(s => s.value === selectedTime)
    return `${d} \u2022 ${slot?.label || selectedTime}`
  }, [date, selectedTime, timeSlots])

  return (
    <div className="flex flex-col max-h-[85vh] bg-white font-sans relative">
      {/* ─── Toast ─── */}
      {toast && (
        <motion.div
          key={toast.message}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={`absolute top-0 left-0 right-0 z-50 px-4 py-3 text-[13px] font-semibold flex items-center gap-2.5 shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-200'
              : 'bg-red-50 text-red-700 border-b border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </motion.div>
      )}

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563eb] to-[#3b82f6] flex items-center justify-center shadow-md shadow-blue-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h1 className="text-[14px] font-semibold text-gray-900 leading-tight">Reschedule Interview</h1>
            <p className="text-[12px] text-gray-500 leading-tight mt-0.5">
              {candidate || "Candidate"}{email ? ` \u2022 ${email}` : ""}
            </p>
          </div>
        </div>
        {date && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]"></div>
            <span className="text-[12px] font-semibold text-[#2563eb] whitespace-nowrap">
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col items-center py-6 px-6">
          {/* Calendar Section */}
          <div className="w-full max-w-[340px]">
            <div className="text-center mb-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 mb-1">Select Date</h2>
              <p className="text-[13px] text-gray-500">Choose a new date for this interview</p>
            </div>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setSelectedTime(null) }}
                disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                showOutsideDays={false}
                className="p-0"
                classNames={{
                  months: "flex justify-center",
                  month: "w-full",
                  month_caption: "flex justify-center items-center py-3 h-11",
                  caption_label: "text-[15px] font-bold text-gray-900",
                  month_grid: "mx-auto",
                  day: "text-sm text-gray-600",
                  day_button: "h-[38px] w-[38px] text-sm font-semibold rounded-xl hover:bg-[#eef2ff] transition-all duration-150 flex items-center justify-center text-gray-700",
                  today: "text-[#2563eb] font-bold",
                  outside: "text-gray-300 opacity-30",
                }}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full max-w-[340px] my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-300">Time</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Time Carousel Section */}
          <div className="w-full max-w-[340px]">
            <div className="text-center mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 mb-1">Select Time</h2>
              <p className="text-[13px] text-gray-500">
                {date ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Pick a date first'}
              </p>
            </div>
            {loading ? (
              <div className="flex flex-col items-center gap-5">
                <div className="h-4 w-32 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-[180px] w-full bg-gray-50 rounded-3xl animate-pulse border border-gray-100" />
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-9 w-20 bg-gray-50 rounded-xl animate-pulse border border-gray-100" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <TimeCarousel
                  slots={timeSlots}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] flex items-center justify-center text-[#2563eb] shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">Selected</p>
            <p className={`text-[13px] font-semibold leading-tight transition-all duration-200 ${selectedSlotLabel ? 'text-gray-900' : 'text-gray-300'}`}>
              {selectedSlotLabel || "No slot selected"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-[12px] font-semibold text-gray-500 hover:text-gray-800 bg-transparent hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={!date || !selectedTime || isSubmitting}
            onClick={handleSubmit}
            className={`px-6 py-2.5 rounded-xl text-[12px] font-semibold text-white transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2 ${
              isSubmitting
                ? 'bg-[#2563eb]/70'
                : 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] hover:shadow-md hover:shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]'
            } disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                Confirm
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
