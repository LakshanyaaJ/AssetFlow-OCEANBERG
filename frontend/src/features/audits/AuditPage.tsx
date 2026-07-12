import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAuditList, useAuditStats, useAuditDetails } from './api/useAudit';
import { useLocations } from '../organization/api/useOrganization';
import { CreateAuditModal } from './components/CreateAuditModal';
import { AuditDetailsModal } from './components/AuditDetailsModal';
import { DiscrepancyReportModal } from './components/DiscrepancyReportModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import {
  ShieldCheck,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Eye,
  FileText,
} from 'lucide-react';

export function AuditPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('audit.manage');

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);

  // Queries
  const queryParams: Record<string, string | number> = { limit: 100 };
  if (statusFilter) queryParams.status = statusFilter;
  if (locationFilter) queryParams.locationId = Number(locationFilter);

  const { data: listRes, isLoading: loadingList, refetch } = useAuditList(queryParams);
  const { data: statsData, isLoading: loadingStats } = useAuditStats();
  const { data: locationsRes = [] } = useLocations();

  // Selected full cycle with items for modals
  const { data: selectedCycleData } = useAuditDetails(selectedCycleId);

  const cycles = listRes?.data || [];
  const locations = locationsRes.map((l) => ({ id: l.id, name: l.name, code: l.code }));

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-800 border-slate-300',
    in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse font-semibold',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const handleOpenDetails = (id: number) => {
    setSelectedCycleId(id);
    setIsDetailsOpen(true);
  };

  const handleOpenReport = (id: number) => {
    setSelectedCycleId(id);
    setIsReportOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Enterprise Audit & Verification</h1>
          <p className="mt-1 text-sm text-gray-500">
            Verify physical asset presence across organization locations and generate automated discrepancy reports.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          {canManage && (
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Create Audit Cycle
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-4 border-l-4 border-l-amber-500 bg-gradient-to-br from-white to-amber-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Upcoming Audits</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {loadingStats ? '—' : statsData?.upcomingAudits ?? 0}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-100 rounded-lg text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500 bg-gradient-to-br from-white to-indigo-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Audits</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {loadingStats ? '—' : statsData?.activeAudits ?? 0}
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-100 rounded-lg text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-slate-800 bg-gradient-to-br from-white to-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Missing Assets</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {loadingStats ? '—' : statsData?.missingAssets ?? 0}
              </h3>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Damaged Assets</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {loadingStats ? '—' : statsData?.damagedAssets ?? 0}
              </h3>
            </div>
            <div className="p-2.5 bg-red-100 rounded-lg text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/20 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Completed Audits</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {loadingStats ? '—' : statsData?.completedAudits ?? 0}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900 text-white border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Filter Audit Cycles:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md text-sm px-3 py-1.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md text-sm px-3 py-1.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-xs"
            >
              <option value="">All Locations Scope</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  [{loc.code}] {loc.name}
                </option>
              ))}
            </select>

            {(statusFilter || locationFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setLocationFilter('');
                }}
                className="text-xs text-slate-300 hover:text-white underline"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Audit Cycles Table */}
      <Card>
        {loadingList ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading enterprise audit cycles...</div>
        ) : cycles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-300" />
            <div>No audit cycles found matching the selected criteria.</div>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Audit Name / Scope</TableHeader>
                <TableHeader>Schedule Window</TableHeader>
                <TableHeader>Verification Progress</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Created By</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {cycles.map((cycle) => {
                const checked = cycle.checked_items || 0;
                const total = cycle.total_items || 0;
                const pct = total ? Math.round((checked / total) * 100) : 0;

                return (
                  <TableRow key={cycle.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-slate-900">{cycle.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Scope: {cycle.location_name || 'Organization-Wide'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div>Starts: {new Date(cycle.starts_on).toLocaleDateString()}</div>
                      <div>Ends: {new Date(cycle.ends_on).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      {cycle.status === 'draft' ? (
                        <span className="text-xs text-slate-400 italic">Not started yet</span>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-600 font-medium">
                            <span>{checked} / {total} Verified</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border uppercase ${statusColors[cycle.status] || 'bg-gray-100 text-gray-800'}`}>
                        {cycle.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div>{cycle.created_by_name}</div>
                      <div className="text-[10px] text-slate-400">{new Date(cycle.created_at).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDetails(cycle.id)}
                          className="text-xs py-1 px-2.5 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> Details & Verify
                        </Button>
                        {['in_progress', 'completed'].includes(cycle.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReport(cycle.id)}
                            className="text-xs py-1 px-2 flex items-center gap-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" /> Report
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modals */}
      <CreateAuditModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} locations={locations} />

      <AuditDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        cycle={selectedCycleData || null}
        canManage={canManage}
      />

      <DiscrepancyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        cycle={selectedCycleData || null}
      />
    </div>
  );
}
