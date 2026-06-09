"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

interface RescheduleCalendarProps {
  eventId?: string;
  email?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RescheduleCalendar({ eventId, email, onSuccess, onCancel }: RescheduleCalendarProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const timeSlots = Array.from({ length: 37 }, (_, i) => {
    const totalMinutes = i * 15
    const hour = Math.floor(totalMinutes / 60) + 9
    const minute = totalMinutes % 60
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  })

  // Placeholder for booked dates - in a real app these would come from an API
  const bookedDates = [
    new Date(2025, 5, 17),
    new Date(2025, 5, 18),
    new Date(2025, 5, 19),
  ]

  const handleSubmit = async () => {
    if (!date || !selectedTime) return;

    setIsSubmitting(true);
    const payload = {
      action: 'RescheduleInterview',
      eventId: eventId,
      interviewerEmail: email,
      newDate: date.toISOString().split('T')[0],
      newTime: selectedTime,
    };

    try {
      const response = await fetch('/n8n-proxy/webhook/6536d25e-6332-4681-8bd9-0cd219e30a53?action=RescheduleInterview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to reschedule');
      
      alert('Interview rescheduled successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error rescheduling:', error);
      alert('Failed to reschedule: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="gap-0 p-0 border-none shadow-none bg-transparent w-full overflow-hidden">
      <CardContent className="relative flex flex-col md:flex-row p-0 min-h-[550px] md:h-[600px]">
        {/* Left Side: Calendar & Guide */}
        <div className="shrink-0 flex flex-col items-center border-b md:border-b-0 md:border-r border-border bg-[#F8FAFC] md:w-[420px]">
          <div className="w-full p-8 border-b border-border bg-white/50 backdrop-blur-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text/40 mb-1">Step 1</h2>
            <h1 className="text-xl font-black text-text">Choose a Date</h1>
          </div>
          
          <div className="flex-1 w-full flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-[320px] bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date(new Date().setHours(0,0,0,0)) || bookedDates.some(bd => bd.toDateString() === d.toDateString())}
                showOutsideDays={false}
                className="p-0"
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-4",
                  month_caption: "flex justify-center items-center py-2 px-1 relative h-10",
                  caption_label: "text-base font-black text-slate-800",
                  button_previous: "absolute left-0 h-9 w-9 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors border border-slate-200 z-10",
                  button_next: "absolute right-0 h-9 w-9 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors border border-slate-200 z-10",
                  day: "h-10 w-10 text-sm font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center text-slate-600",
                  today: "text-primary font-black border-2 border-primary/20",
                  outside: "text-slate-300 opacity-30",
                }}
              />
            </div>
          </div>

          <div className="w-full p-8 bg-slate-50/50">
            <div className="flex items-start gap-4 bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <i className="ti ti-bulb text-primary text-lg"></i>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Pro Tip</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Hover over common days to see more availability metrics from other users.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Slots Selection */}
        <div className="flex flex-col flex-1 min-w-0 bg-white">
          <div className="p-8 border-b border-border flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text/40 mb-1">Step 2</h2>
              <h1 className="text-xl font-black text-text">Choose a Time</h1>
            </div>
            {date && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2.5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-xs font-black text-slate-700">
                  {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => setSelectedTime(time)}
                  className={`relative group flex flex-col items-center justify-center h-[100px] rounded-[32px] transition-all duration-500 overflow-hidden border-2 ${
                    selectedTime === time 
                      ? 'bg-primary border-primary text-white shadow-2xl shadow-primary/40 scale-105 z-10' 
                      : 'bg-white border-slate-50 hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-50 ${selectedTime === time ? 'text-white' : 'text-slate-400'}`}>
                    Available
                  </span>
                  <span className="text-xl font-black">{time}</span>
                  {selectedTime === time && (
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                  <div className={`absolute bottom-3 w-8 h-1 rounded-full ${selectedTime === time ? 'bg-white/40' : 'bg-slate-100'}`}></div>
                </Button>
              ))}
            </div>
            
            <div className="mt-12 py-10 border-t border-slate-50 text-center">
              <div className="inline-flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                <span className="w-8 h-px bg-slate-100"></span>
                Everything synced
                <span className="w-8 h-px bg-slate-100"></span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-8 border-t border-border bg-slate-50 flex items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[28px] bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
            <i className="ti ti-calendar-check text-3xl"></i>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Summary</span>
            <div className="text-lg font-black text-slate-900 leading-none">
              {date && selectedTime ? (
                <div className="flex items-center gap-3">
                  <span>{date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span className="text-primary">{selectedTime}</span>
                </div>
              ) : (
                <span className="text-slate-300 italic">No slot selected yet</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {onCancel && (
            <Button 
              variant="ghost" 
              onClick={onCancel} 
              disabled={isSubmitting}
              className="px-10 h-16 rounded-[28px] text-sm font-black uppercase tracking-[0.1em] text-slate-400 hover:text-slate-900 transition-all hover:bg-white border border-transparent hover:border-slate-200"
            >
              Cancel
            </Button>
          )}
          <Button
            disabled={!date || !selectedTime || isSubmitting}
            className="px-12 h-16 rounded-[28px] text-sm font-black uppercase tracking-[0.1em] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] min-w-[260px]"
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <i className="ti ti-loader animate-spin text-xl"></i>
                Processing
              </div>
            ) : "Confirm Reschedule"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
