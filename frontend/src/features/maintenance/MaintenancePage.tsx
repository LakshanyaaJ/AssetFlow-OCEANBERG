import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  useMaintenanceList,
  useMaintenanceStats,
  MaintenanceRequest,
} from './api/useMaintenance';
import { useAssets } from '../assets/api/useAssets';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { MaintenanceKanbanCard } from './components/MaintenanceKanbanCard';
import { MaintenanceRequestModal } from './components/MaintenanceRequestModal';
import { MaintenanceDecisionModal } from './components/MaintenanceDecisionModal';
import { MaintenanceAssignModal } from './components/MaintenanceAssignModal';
import { MaintenanceResolveModal } from './components/MaintenanceResolveModal';
import { MaintenanceDetailsModal } from './components/MaintenanceDetailsModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Wrench,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export function MaintenancePage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('maintenance.approve');

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assetFilter, setAssetFilter] = useState<string>('');

  // Modals State
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  // Queries
  const queryParams: Record<string, string | number> = { limit: 100 };
  if (statusFilter) queryParams.status = statusFilter;
  if (priorityFilter) queryParams.priority = priorityFilter;
  if (assetFilter) queryParams.assetId = Number(assetFilter);

  const { data: listRes, isLoading: loadingList, refetch } = useMaintenanceList(queryParams);
  const { data: statsData, isLoading: loadingStats } = useMaintenanceStats();
  const { data: assetsRes } = useAssets({ limit: 100 });

  // Raw employees for assignment dropdowns
  const { data: rawEmployees = [] } = useQuery({
    queryKey: ['raw-employees-maintenance'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: any[] }>('/employees?limit=100');
      return (res.data?.data || []).map((e) => ({
        id: Number(e.id),
        full_name: e.full_name || e.name || 'Technician',
        employee_code: e.employee_code || e.employee_id || 'EMP',
        designation: e.designation || e.role_name || 'Technician',
      }));
    },
  });

  const requests = listRes?.data || [];
  const assets = (assetsRes?.data || []).map((a) => ({
    id: Number(a.id),
    name: a.name,
    asset_tag: a.asset_tag,
    status: a.status,
  }));

  // Kanban Columns Logic matching Screen 7 State Machine
  const kanbanColumns = [
    {
      id: 'reported',
      title: 'Reported',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      items: requests.filter((r) => r.status === 'pending'),
      showAddBtn: true,
    },
    {
      id: 'in_repair',
      title: 'In Repair',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      items: requests.filter((r) => r.status === 'approved' || r.status === 'in_progress'),
      showAddBtn: false,
    },
    {
      id: 'ready_pickup',
      title: 'Ready for Pickup / Return',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
      items: requests.filter((r) => (r.status as string) === 'ready_for_pickup'),
      showAddBtn: false,
    },
    {
      id: 'resolved',
      title: 'Resolved',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      items: requests.filter((r) => r.status === 'completed'),
      showAddBtn: false,
    },
  ];

  // Action handlers
  const handleSelectRequest = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setIsDetailsOpen(true);
  };

  const handleOpenDecision = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setIsDecisionOpen(true);
  };

  const handleOpenAssign = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setIsAssignOpen(true);
  };

  const handleOpenStart = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setIsDetailsOpen(true);
  };

  const handleOpenResolve = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setIsResolveOpen(true);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Maintenance Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track asset maintenance requests and approvals with an Odoo-inspired Kanban workflow.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsRequestOpen(true)} className="flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Request Maintenance
          </Button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 border-l-4 border-l-amber-500 bg-gradient-to-br from-white to-amber-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Requests</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loadingStats ? '—' : statsData?.pendingRequests ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-indigo-500 bg-gradient-to-br from-white to-indigo-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Repairs</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loadingStats ? '—' : statsData?.activeRepairs ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resolved This Month</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loadingStats ? '—' : statsData?.resolvedThisMonth ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Resolution Time</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {loadingStats ? '—' : `${statsData?.avgResolutionHours ?? 0} hrs`}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900 text-white border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Filter Requests:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md text-sm px-3 py-1.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Resolved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md text-sm px-3 py-1.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>

            <select
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md text-sm px-3 py-1.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-xs"
            >
              <option value="">All Assets</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.asset_tag}] {a.name}
                </option>
              ))}
            </select>

            {(statusFilter || priorityFilter || assetFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setPriorityFilter('');
                  setAssetFilter('');
                }}
                className="text-xs text-slate-300 hover:text-white underline"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Kanban Board matching Screen 7 State Machine */}
      {loadingList ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 rounded-xl p-4 h-96 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => (
            <div key={col.id} className="bg-slate-100/80 border border-slate-200 rounded-xl p-3 flex flex-col gap-3 min-h-[520px]">
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-800">{col.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${col.badgeClass}`}>
                    {col.items.length}
                  </span>
                </div>
              </div>

              {/* + Add request button inside Reported column as shown in Screen 7 wireframe */}
              {col.showAddBtn && (
                <button
                  onClick={() => setIsRequestOpen(true)}
                  className="w-full border-2 border-dashed border-slate-300 rounded-lg py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/60 hover:border-slate-400 transition-all flex items-center justify-center gap-1.5 shadow-2xs bg-white/50"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add request
                </button>
              )}

              {/* Column Cards */}
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[700px] pr-1">
                {col.items.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-medium">
                    No requests in {col.title}
                  </div>
                ) : (
                  col.items.map((req) => (
                    <MaintenanceKanbanCard
                      key={req.id}
                      request={req}
                      canManage={canManage}
                      onSelect={handleSelectRequest}
                      onApproveReject={handleOpenDecision}
                      onAssign={handleOpenAssign}
                      onStart={handleOpenStart}
                      onResolve={handleOpenResolve}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <MaintenanceRequestModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} assets={assets} />

      <MaintenanceDecisionModal
        isOpen={isDecisionOpen}
        onClose={() => setIsDecisionOpen(false)}
        request={selectedRequest}
        employees={rawEmployees}
      />

      <MaintenanceAssignModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        request={selectedRequest}
        employees={rawEmployees}
      />

      <MaintenanceResolveModal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        request={selectedRequest}
      />

      <MaintenanceDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        request={selectedRequest}
        canManage={canManage}
        onApproveReject={handleOpenDecision}
        onAssign={handleOpenAssign}
        onResolve={handleOpenResolve}
      />
    </div>
  );
}
