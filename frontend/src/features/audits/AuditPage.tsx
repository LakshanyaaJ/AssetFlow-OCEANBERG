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
  QrCode,
} from 'lucide-react';
import toast from 'react-hot-toast';

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
      {/* Header matching Screen 8 */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Asset Audits & Verification</h1>
          <p className="mt-1 text-sm text-gray-500">
            Verify physical asset presence across organization locations and manage discrepancy reports.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex flex-wrap gap-2.5">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1.5 shadow-2xs">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success('QR Scanner & Verification mode activated')}
            className="flex items-center gap-1.5 border-2 border-slate-800 text-slate-800 font-bold shadow-2xs"
          >
            <QrCode className="w-4 h-4" /> Verify Item / Scan QR
          </Button>
          {canManage && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> + Start New Audit Cycle
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

      {/* Discrepancies & Missing Items Section matching Screen 8 */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Discrepancies & Missing Items (Requires Action)
        </h2>
        <Card className="p-5 border-2 border-red-200 rounded-xl shadow-xs bg-white divide-y divide-slate-100">
          <div className="py-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 text-sm">AF-0088 - Conference room Table</span>
              <span className="block text-xs text-red-700 font-semibold mt-0.5">Missing from Location HQ Floor 2</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success('Flagged AF-0088 for write-off review')}
              className="border-2 border-red-400 text-red-800 hover:bg-red-50 font-bold self-start sm:self-auto text-xs"
            >
              Flag for Write-off
            </Button>
          </div>

          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 text-sm">AF-0105 - iPad Pro</span>
              <span className="block text-xs text-amber-700 font-semibold mt-0.5">Serial mismatch - reported by Aditi Rao</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success('Resolved serial discrepancy for AF-0105')}
              className="border-2 border-slate-700 text-slate-800 hover:bg-slate-100 font-bold self-start sm:self-auto text-xs"
            >
              Resolve Discrepancy
            </Button>
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

      {/* Active & Completed Audits matching Screen 8 */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">Active & Completed Audits</h2>
        <Card className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
          {loadingList ? (
            <div className="p-12 text-center text-slate-400 font-medium">Loading enterprise audit cycles...</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow className="bg-slate-50">
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Cycle Name</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Date</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Verified</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Discrepancies</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs">Status</TableHeader>
                  <TableHeader className="font-bold text-slate-700 uppercase text-xs text-right">Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Screen 8 Static Sample Rows */}
                <TableRow className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-bold text-slate-900">Q1 2026 Annual Audit</TableCell>
                  <TableCell className="text-sm font-mono text-slate-600">Mar 10</TableCell>
                  <TableCell className="text-sm font-bold text-indigo-700">142 / 150</TableCell>
                  <TableCell className="text-sm font-bold text-red-600">3</TableCell>
                  <TableCell>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold border bg-indigo-100 text-indigo-800 border-indigo-300 shadow-2xs">
                      In Progress
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toast.success('Opening Q1 2026 Annual Audit details')}
                      className="text-xs py-1 px-2.5 flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" /> Details & Verify
                    </Button>
                  </TableCell>
                </TableRow>

                <TableRow className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-bold text-slate-900">IT Dept Equipment Check</TableCell>
                  <TableCell className="text-sm font-mono text-slate-600">Feb 15</TableCell>
                  <TableCell className="text-sm font-bold text-emerald-700">45 / 45</TableCell>
                  <TableCell className="text-sm font-bold text-slate-500">0</TableCell>
                  <TableCell>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold border bg-slate-100 text-slate-800 border-slate-300 shadow-2xs">
                      Closed
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.success('Generating equipment check report')}
                      className="text-xs py-1 px-2.5 flex items-center gap-1 border-slate-300 text-slate-700 hover:bg-slate-50 ml-auto"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" /> Report
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Dynamic backend rows */}
                {cycles.map((cycle) => {
                  const checked = cycle.checked_items || 0;
                  const total = cycle.total_items || 0;

                  return (
                    <TableRow key={cycle.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="font-bold text-slate-900">{cycle.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Scope: {cycle.location_name || 'Organization-Wide'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-slate-600">
                        {new Date(cycle.starts_on).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-indigo-700">
                        {checked} / {total || 1}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-amber-600">
                        {total > checked ? total - checked : 0}
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold border uppercase shadow-2xs ${statusColors[cycle.status] || 'bg-gray-100 text-gray-800'}`}>
                          {cycle.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
      </div>

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
