import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Download, BarChart3, TrendingUp, DollarSign, PieChart, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function ReportsPage() {
  const handleExport = () => {
    toast.success('Report exported successfully as .CSV');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header matching Screen 9 */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enterprise financial metrics, department asset distribution, and maintenance cost analysis.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={handleExport}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg flex items-center shadow-xs text-xs sm:text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report (.CSV)
          </Button>
        </div>
      </div>

      {/* 3 Summary Financial & Allocation Stat Cards matching Screen 9 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 border border-slate-200 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Asset Value</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">$485,200</div>
          <div className="mt-1 text-xs text-emerald-700 font-semibold">+4.2% from last quarter</div>
        </Card>

        <Card className="p-5 border border-slate-200 bg-gradient-to-br from-white to-blue-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Depreciated Value</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">$340,100</div>
          <div className="mt-1 text-xs text-slate-500 font-medium">Book value post-depreciation</div>
        </Card>

        <Card className="p-5 border border-slate-200 bg-gradient-to-br from-white to-indigo-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Allocations</span>
            <PieChart className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">85%</div>
          <div className="mt-1 text-xs text-indigo-700 font-semibold">163 / 192 assets assigned</div>
        </Card>
      </div>

      {/* Main Chart 1 matching Screen 9: Asset Distribution by Department */}
      <Card className="p-6 border border-slate-200 shadow-sm bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" /> Asset Distribution by Department
          </h2>
          <span className="text-xs font-semibold text-slate-500">Active Directory Scope</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Engineering</span>
              <span className="text-indigo-600">45 assets</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '41%' }}></div>
            </div>
            <span className="block text-[11px] text-slate-400 mt-1.5 font-mono">41% of total value</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>IT</span>
              <span className="text-indigo-600">30 assets</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '27%' }}></div>
            </div>
            <span className="block text-[11px] text-slate-400 mt-1.5 font-mono">27% of total value</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Facilities</span>
              <span className="text-indigo-600">20 assets</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '18%' }}></div>
            </div>
            <span className="block text-[11px] text-slate-400 mt-1.5 font-mono">18% of total value</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Field Ops</span>
              <span className="text-indigo-600">15 assets</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '14%' }}></div>
            </div>
            <span className="block text-[11px] text-slate-400 mt-1.5 font-mono">14% of total value</span>
          </div>
        </div>
      </Card>

      {/* Main Chart 2 matching Screen 9: Maintenance Cost vs Asset Value over Time */}
      <Card className="p-6 border border-slate-200 shadow-sm bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" /> Maintenance Cost vs Asset Value over Time
          </h2>
          <span className="text-xs font-semibold text-slate-500">2026 Quarterly Breakdown</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
          <div className="border border-slate-200 p-4 rounded-xl text-center bg-slate-50/50">
            <span className="block text-xs font-bold text-slate-500 uppercase">Q1 Maintenance</span>
            <span className="block text-xl font-extrabold text-slate-900 mt-1">$1,200</span>
            <span className="block text-[11px] text-red-600 font-semibold mt-1">12 corrective repairs</span>
          </div>
          <div className="border border-slate-200 p-4 rounded-xl text-center bg-slate-50/50">
            <span className="block text-xs font-bold text-slate-500 uppercase">Q2 Maintenance</span>
            <span className="block text-xl font-extrabold text-slate-900 mt-1">$850</span>
            <span className="block text-[11px] text-emerald-600 font-semibold mt-1">8 corrective repairs</span>
          </div>
          <div className="border border-slate-200 p-4 rounded-xl text-center bg-slate-50/50">
            <span className="block text-xs font-bold text-slate-500 uppercase">Q3 Maintenance</span>
            <span className="block text-xl font-extrabold text-slate-900 mt-1">$2,100</span>
            <span className="block text-[11px] text-amber-600 font-semibold mt-1">16 corrective repairs</span>
          </div>
          <div className="border border-slate-200 p-4 rounded-xl text-center bg-slate-50/50">
            <span className="block text-xs font-bold text-slate-500 uppercase">Q4 Maintenance</span>
            <span className="block text-xl font-extrabold text-slate-900 mt-1">$1,450</span>
            <span className="block text-[11px] text-slate-600 font-semibold mt-1">10 corrective repairs</span>
          </div>
        </div>
      </Card>

      {/* Secondary Row: Most Used & Idle Assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 border border-slate-200 bg-white shadow-xs">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-3">
            Most used assets
          </h3>
          <ul className="space-y-3 text-xs text-slate-700 font-medium divide-y divide-slate-100">
            <li className="pt-2 first:pt-0 flex justify-between items-center">
              <span>Conference Room 2A</span>
              <span className="font-bold text-indigo-600">34 bookings this month</span>
            </li>
            <li className="pt-2 flex justify-between items-center">
              <span>Van AF-0112</span>
              <span className="font-bold text-indigo-600">23 trips this month</span>
            </li>
            <li className="pt-2 flex justify-between items-center">
              <span>Projector AF-0012</span>
              <span className="font-bold text-indigo-600">18 uses this month</span>
            </li>
          </ul>
        </Card>

        <Card className="p-5 border border-slate-200 bg-white shadow-xs">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-3">
            Idle assets
          </h3>
          <ul className="space-y-3 text-xs text-slate-700 font-medium divide-y divide-slate-100">
            <li className="pt-2 first:pt-0 flex justify-between items-center">
              <span>Scanner AF-0331</span>
              <span className="font-bold text-amber-700">unused 184 days</span>
            </li>
            <li className="pt-2 flex justify-between items-center">
              <span>Chair AF-0440</span>
              <span className="font-bold text-amber-700">unused 95 days</span>
            </li>
            <li className="pt-2 flex justify-between items-center">
              <span>Backup Server AF-0902</span>
              <span className="font-bold text-amber-700">unused 62 days</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Due for Maintenance / Nearing Retirement */}
      <Card className="p-5 border border-slate-200 bg-white shadow-xs">
        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" /> Assets due for maintenance / nearing retirement
        </h3>
        <div className="space-y-2.5 text-xs text-slate-700 font-medium divide-y divide-slate-100">
          <div className="pt-2 first:pt-0 flex items-center justify-between">
            <span className="font-semibold text-slate-900">Forklift AF-0034</span>
            <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">service due in 10 days</span>
          </div>
          <div className="pt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-900">Laptop AF-0320</span>
            <span className="px-2.5 py-0.5 rounded bg-red-100 text-red-800 font-bold">4 years old - nearing retirement</span>
          </div>
          <div className="pt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-900">HVAC Unit AF-0101</span>
            <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">service due in 14 days</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
