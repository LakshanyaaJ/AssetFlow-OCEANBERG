import { useState } from 'react';
import { useResources } from './api/useBookings';
import { BookResourceModal } from './components/BookResourceModal';
import { ResourceFormModal } from './components/ResourceFormModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { CalendarCheck, AlertCircle, Clock } from 'lucide-react';

export function BookingsPage() {
  const [selectedResourceTag, setSelectedResourceTag] = useState<string>('Room 2A');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  // Queries for keeping hooks active
  useResources();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Resource booking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Schedule conference rooms, company vehicles, and shared equipment.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button
            onClick={() => setIsResourceModalOpen(true)}
            variant="outline"
            className="border-slate-800 text-slate-800 text-xs font-semibold"
          >
            + Add Resource
          </Button>
        </div>
      </div>

      {/* Resource selector matching Screen 6 */}
      <Card className="p-6 border-2 border-slate-300 rounded-xl shadow-sm bg-white space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Resource</label>
          <select
            value={selectedResourceTag}
            onChange={(e) => setSelectedResourceTag(e.target.value)}
            className="w-full max-w-md px-3.5 py-2.5 border-2 border-slate-300 rounded-lg text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 shadow-2xs"
          >
            <option value="Room 2A">Conference room 2A - Cap 8 Ppl</option>
            <option value="Room B12">Executive Boardroom B12 - Cap 20 Ppl</option>
            <option value="Van AF-0112">Company Van AF-0112 - 7 Seater</option>
          </select>
        </div>

        {/* Schedule Timeline matching Screen 6 (9:00 to 5:00) */}
        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Today's Schedule (9:00 AM - 5:00 PM)
            </span>
            <span className="text-xs font-semibold text-slate-500">Selected: Conference room 2A</span>
          </div>

          <div className="relative pl-12 space-y-4 py-2">
            {/* 9:00 AM Slot */}
            <div className="relative flex items-center">
              <span className="absolute -left-12 text-xs font-mono font-bold text-slate-500">9:00</span>
              <div className="w-full bg-blue-100 border-2 border-blue-400 text-blue-900 rounded-lg p-3 text-xs sm:text-sm font-bold shadow-2xs flex items-center justify-between">
                <span>Booked - Procurement team - 4 Ppl</span>
                <span className="text-[11px] font-mono font-normal opacity-80">9:00 AM - 11:00 AM</span>
              </div>
            </div>

            <div className="relative flex items-center h-6">
              <span className="absolute -left-12 text-xs font-mono text-slate-400">11:00</span>
              <div className="w-full border-t border-dashed border-slate-300"></div>
            </div>

            {/* 12:00 PM Conflict Slot */}
            <div className="relative flex items-center">
              <span className="absolute -left-12 text-xs font-mono font-bold text-slate-500">12:00</span>
              <div className="w-full bg-red-50 border-2 border-dashed border-red-500 text-red-900 rounded-lg p-3 text-xs sm:text-sm font-bold shadow-2xs flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  Requested 12:30 to 13:30 - conflict - slot is unavailable
                </span>
                <span className="text-[11px] font-mono font-normal text-red-700">12:00 PM - 1:30 PM</span>
              </div>
            </div>

            <div className="relative flex items-center h-6">
              <span className="absolute -left-12 text-xs font-mono text-slate-400">2:00</span>
              <div className="w-full border-t border-dashed border-slate-300"></div>
            </div>

            {/* 5:00 PM End marker */}
            <div className="relative flex items-center">
              <span className="absolute -left-12 text-xs font-mono text-slate-400 font-bold">5:00</span>
              <div className="text-xs font-medium text-slate-400 italic">End of standard booking window</div>
            </div>
          </div>
        </div>

        {/* Action Button matching Screen 6 */}
        <div className="pt-2">
          <Button
            onClick={() => setIsBookModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg flex items-center shadow-sm"
          >
            <CalendarCheck className="w-4 h-4 mr-2" />
            Book a slot
          </Button>
        </div>
      </Card>

      {/* Preserved Modals */}
      <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title="Book a Resource Slot">
        <BookResourceModal
          onCancel={() => setIsBookModalOpen(false)}
          onSuccess={() => setIsBookModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={isResourceModalOpen} onClose={() => setIsResourceModalOpen(false)} title="Add / Edit Resource">
        <ResourceFormModal
          onCancel={() => setIsResourceModalOpen(false)}
          onSuccess={() => setIsResourceModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
