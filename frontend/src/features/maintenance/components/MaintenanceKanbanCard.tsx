import { MaintenanceRequest } from '../api/useMaintenance';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Wrench, Calendar, User, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

interface MaintenanceKanbanCardProps {
  request: MaintenanceRequest;
  onSelect: (request: MaintenanceRequest) => void;
  onApproveReject: (request: MaintenanceRequest) => void;
  onAssign: (request: MaintenanceRequest) => void;
  onStart: (request: MaintenanceRequest) => void;
  onResolve: (request: MaintenanceRequest) => void;
  canManage: boolean;
}

export function MaintenanceKanbanCard({
  request,
  onSelect,
  onApproveReject,
  onAssign,
  onStart,
  onResolve,
  canManage,
}: MaintenanceKanbanCardProps) {
  const priorityColors = {
    low: 'bg-slate-100 text-slate-700 border-slate-300',
    medium: 'bg-blue-100 text-blue-700 border-blue-300',
    high: 'bg-amber-100 text-amber-800 border-amber-300',
    critical: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
  };

  const hasAssignment = request.assignments && request.assignments.length > 0;
  const assignedTech = hasAssignment ? request.assignments![0].employee_name : null;

  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200 border border-slate-200/80 bg-white group cursor-pointer" >
      <div onClick={() => onSelect(request)}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            {request.asset_tag}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${priorityColors[request.priority]}`}>
            {request.priority.toUpperCase()}
          </span>
        </div>

        <h4 className="font-semibold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {request.title}
        </h4>
        <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[2.25rem]">
          {request.description || request.asset_name}
        </p>

        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700 truncate">{request.asset_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(request.requested_at).toLocaleDateString()}</span>
            </div>
            {assignedTech && (
              <div className="flex items-center gap-1 text-indigo-600 font-medium">
                <User className="w-3.5 h-3.5" />
                <span className="truncate max-w-[100px]">{assignedTech}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stage Action Footer */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect(request)}
          className="text-xs py-1 px-2 text-slate-600 hover:text-slate-900"
        >
          View Details
        </Button>

        {canManage && request.status === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onApproveReject(request)}
            className="text-xs py-1 px-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 flex items-center gap-1"
          >
            Decide <ArrowRight className="w-3 h-3" />
          </Button>
        )}

        {canManage && request.status === 'approved' && !hasAssignment && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAssign(request)}
            className="text-xs py-1 px-2 border-amber-600 text-amber-700 hover:bg-amber-50 flex items-center gap-1"
          >
            Assign Tech <User className="w-3 h-3" />
          </Button>
        )}

        {request.status === 'approved' && hasAssignment && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onStart(request)}
            className="text-xs py-1 px-2.5 bg-blue-600 hover:bg-blue-700 flex items-center gap-1 shadow-xs"
          >
            Start Work <Play className="w-3 h-3 fill-current" />
          </Button>
        )}

        {request.status === 'in_progress' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onResolve(request)}
            className="text-xs py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
          >
            Resolve <CheckCircle2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}
