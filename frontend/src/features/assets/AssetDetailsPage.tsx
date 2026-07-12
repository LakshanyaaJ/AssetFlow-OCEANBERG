import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAsset, useAssetAllocationHistory, useAssetMaintenanceHistory, useAssetAuditHistory } from './api/useAsset';
import {
  ChevronRight, Edit, UserPlus, ArrowRightLeft, Wrench, QrCode,
  MapPin, Tag, Box, Hash, User, Calendar, Shield, AlertTriangle,
  FileText, Image as ImageIcon, Download, Clock, Building, Plus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { AssetForm } from './AssetForm';
import { AddDocumentModal } from './components/AddDocumentModal';
import { AllocateModal } from '../transfers/components/AllocateModal';
import { TransferRequestModal } from '../transfers/components/TransferRequestModal';
import { MaintenanceRequestModal } from '../maintenance/components/MaintenanceRequestModal';
import { formatDate, formatDateTime, humanize } from '../../lib/format';

// Helper for status colors
const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'allocated': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'under_maintenance': case 'pending': case 'in_progress': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'lost': case 'retired': case 'rejected': case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    case 'active': case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed': case 'returned': case 'found': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'overdue': case 'missing': case 'damaged': return 'bg-red-100 text-red-800 border-red-200';
    case 'misplaced': return 'bg-amber-100 text-amber-800 border-amber-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const Badge = ({ children, status }: { children: React.ReactNode, status?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status ? getStatusBadgeClass(status) : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
    {children}
  </span>
);

type ActiveModal = 'edit' | 'allocate' | 'transfer' | 'maintenance' | 'document' | null;

export function AssetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: asset, isLoading, isError } = useAsset(id!);
  const { data: allocations = [] } = useAssetAllocationHistory(id!);
  const { data: maintenance = [] } = useAssetMaintenanceHistory(id!);
  const { data: audits = [] } = useAssetAuditHistory(id!);
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Asset Not Found</h2>
        <p className="mt-2 text-muted-foreground">The asset you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/assets" className="mt-4 text-primary hover:underline">Back to Assets</Link>
      </div>
    );
  }

  const tabs = ['Overview', 'Allocation History', 'Maintenance History', 'Audit History', 'Documents'];
  const lastCompletedMaintenance = [...maintenance].filter((m) => m.status === 'completed' && m.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];
  const nextAuditItem = [...audits].filter((a) => a.status === 'pending')[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb & Header Area */}
      <div>
        <nav className="flex text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <Link to="/assets" className="hover:text-foreground">Assets</Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <span className="text-foreground font-medium" aria-current="page">{asset.asset_tag}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white border rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <QrCode className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{asset.name}</h1>
                <Badge status={asset.status}>{asset.status.replace('_', ' ').toUpperCase()}</Badge>
              </div>
              <p className="text-sm text-gray-500 font-medium">Tag: {asset.asset_tag} • SN: {asset.serial_number || 'N/A'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="bg-white" onClick={() => setActiveModal('edit')}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
            {asset.status === 'available' && (
              <Button variant="outline" size="sm" className="bg-white" onClick={() => setActiveModal('allocate')}>
                <UserPlus className="w-4 h-4 mr-2" /> Allocate
              </Button>
            )}
            {asset.status !== 'retired' && asset.status !== 'lost' && (
              <Button variant="outline" size="sm" className="bg-white" onClick={() => setActiveModal('transfer')}>
                <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer
              </Button>
            )}
            <Button variant="outline" size="sm" className="bg-white" onClick={() => setActiveModal('maintenance')}>
              <Wrench className="w-4 h-4 mr-2" /> Maintenance
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex -mb-px px-4" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* TAB 1: Overview */}
              {activeTab === 'Overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Identification</h3>
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Asset Tag</p>
                        <p className="text-sm font-medium">{asset.asset_tag}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Hash className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Serial Number</p>
                        <p className="text-sm font-medium">{asset.serial_number || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Box className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="text-sm font-medium">{asset.category_name || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Vendor / Model</p>
                        <p className="text-sm font-medium">{asset.vendor || '-'} {asset.model ? `/ ${asset.model}` : ''}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Lifecycle</h3>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Acquisition Date</p>
                        <p className="text-sm font-medium">{formatDate(asset.purchase_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Warranty Expiry</p>
                        <p className="text-sm font-medium">{formatDate(asset.warranty_expiry)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium">{asset.location_name || 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="text-sm font-medium">{asset.description || 'No description provided.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Allocation History */}
              {activeTab === 'Allocation History' && (
                <div className="flow-root">
                  {allocations.length === 0 ? (
                    <p className="text-sm text-gray-500 py-8 text-center">This asset has never been allocated.</p>
                  ) : (
                    <ul role="list" className="-mb-8">
                      {allocations.map((allocation, idx) => (
                        <li key={allocation.id}>
                          <div className="relative pb-8">
                            {idx !== allocations.length - 1 ? (
                              <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${allocation.is_active ? 'bg-blue-500' : 'bg-gray-400'}`}>
                                  <User className="h-4 w-4 text-white" />
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Allocated to <span className="font-medium text-gray-900">{allocation.employee_name}</span> ({allocation.employee_code}) by {allocation.allocated_by_name}
                                  </p>
                                  <div className="mt-1 flex gap-2">
                                    <Badge status={allocation.is_active ? (allocation.is_overdue ? 'overdue' : 'active') : 'returned'}>
                                      {allocation.is_active ? (allocation.is_overdue ? 'Overdue' : 'Active') : 'Returned'}
                                    </Badge>
                                    {allocation.return_condition && <Badge>{humanize(allocation.return_condition)}</Badge>}
                                  </div>
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500 flex flex-col items-end">
                                  <span className="font-medium text-gray-900">{formatDate(allocation.allocated_at)}</span>
                                  <span className="text-xs mt-1">Returned: {allocation.returned_at ? formatDate(allocation.returned_at) : 'Pending'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* TAB 3: Maintenance History */}
              {activeTab === 'Maintenance History' && (
                <div className="flow-root">
                  {maintenance.length === 0 ? (
                    <p className="text-sm text-gray-500 py-8 text-center">No maintenance requests logged for this asset.</p>
                  ) : (
                    <ul role="list" className="-mb-8">
                      {maintenance.map((m, idx) => (
                        <li key={m.id}>
                          <div className="relative pb-8">
                            {idx !== maintenance.length - 1 ? (
                              <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${m.status === 'completed' ? 'bg-emerald-500' : m.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'}`}>
                                  <Wrench className="h-4 w-4 text-white" />
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{m.title}</p>
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    Reported by {m.reported_by_name}
                                    {m.assignments && m.assignments.length > 0 && ` • Assigned: ${m.assignments.map((a) => a.employee_name).join(', ')}`}
                                  </p>
                                  {m.resolution && <p className="text-sm text-gray-600 mt-1 italic">"{m.resolution}"</p>}
                                  <div className="mt-2 flex gap-2">
                                    <Badge status={m.status}>{humanize(m.status)}</Badge>
                                    <Badge status={m.priority === 'high' || m.priority === 'critical' ? 'missing' : undefined}>{humanize(m.priority)}</Badge>
                                  </div>
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                  <time dateTime={m.requested_at}>{formatDate(m.requested_at)}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* TAB 4: Audit History */}
              {activeTab === 'Audit History' && (
                <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
                  {audits.length === 0 ? (
                    <p className="text-sm text-gray-500 py-8 text-center">This asset has not been included in an audit cycle yet.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cycle</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auditor</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {audits.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.checked_at ? formatDate(item.checked_at) : '—'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.cycle_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.checked_by_name || '—'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge status={item.status}>{humanize(item.status)}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TAB 5: Documents */}
              {activeTab === 'Documents' && (
                <ul role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {asset.documents.map((doc) => (
                    <li key={doc.id} className="col-span-1 flex rounded-md shadow-sm border border-gray-200 bg-white">
                      <div className="flex w-16 shrink-0 items-center justify-center rounded-l-md bg-gray-50 border-r border-gray-200">
                        {doc.doc_type === 'manual' ? <ImageIcon className="h-6 w-6 text-blue-500" /> : <FileText className="h-6 w-6 text-red-500" />}
                      </div>
                      <div className="flex flex-1 items-center justify-between truncate rounded-r-md bg-white border-t border-r border-b border-gray-200">
                        <div className="flex-1 truncate px-4 py-2 text-sm">
                          <a href={doc.file_url} target="_blank" rel="noreferrer" className="font-medium text-gray-900 hover:text-gray-600">{doc.title}</a>
                          <p className="text-gray-500">{humanize(doc.doc_type)} • {doc.uploaded_by_name || 'Unknown'}</p>
                        </div>
                        <div className="pr-2 shrink-0">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}

                  <li
                    onClick={() => setActiveModal('document')}
                    className="col-span-1 flex rounded-md shadow-sm border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors items-center justify-center h-[74px] gap-2"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">Add Document</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Widget */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Quick Glance</h3>

            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500">Current Holder</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {asset.active_allocation?.employee_name || 'Unassigned'}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-gray-500">Due Back</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {asset.active_allocation?.due_at ? formatDateTime(asset.active_allocation.due_at) : '—'}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-gray-500">Last Maintenance</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-gray-400" />
                  {lastCompletedMaintenance ? formatDate(lastCompletedMaintenance.completed_at) : 'Never'}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-gray-500">Next Audit Check</dt>
                <dd className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {nextAuditItem ? nextAuditItem.cycle_name : 'Not scheduled'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5 bg-primary/5 border-primary/10 flex flex-col items-center justify-center text-center">
            <QrCode className="w-32 h-32 text-gray-800 mb-3 bg-white p-2 border rounded-md shadow-sm" />
            <p className="text-sm font-medium text-gray-900">{asset.asset_tag}</p>
            <p className="text-xs text-gray-500 mt-1">Scan for fast tracking</p>
            <Button variant="outline" size="sm" className="mt-4 w-full bg-white text-xs" onClick={() => window.print()}>
              Print Label
            </Button>
          </Card>
        </div>
      </div>

      <Modal isOpen={activeModal === 'edit'} onClose={() => setActiveModal(null)} title="Edit Asset">
        <AssetForm
          initialData={{
            id: asset.id,
            asset_tag: asset.asset_tag,
            name: asset.name,
            category_id: asset.category_id,
            location_id: asset.location_id,
            serial_number: asset.serial_number,
            model: asset.model,
            vendor: asset.vendor,
            purchase_date: asset.purchase_date?.slice(0, 10) ?? null,
            purchase_cost: asset.purchase_cost ? Number(asset.purchase_cost) : null,
            warranty_expiry: asset.warranty_expiry?.slice(0, 10) ?? null,
            description: asset.description,
          }}
          onCancel={() => setActiveModal(null)}
          onSuccess={() => setActiveModal(null)}
        />
      </Modal>

      <Modal isOpen={activeModal === 'allocate'} onClose={() => setActiveModal(null)} title="Allocate Asset">
        <AllocateModal defaultAssetId={asset.id} onCancel={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
      </Modal>

      <Modal isOpen={activeModal === 'transfer'} onClose={() => setActiveModal(null)} title="Request Transfer">
        <TransferRequestModal defaultAssetId={asset.id} onCancel={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
      </Modal>

      <MaintenanceRequestModal
        isOpen={activeModal === 'maintenance'}
        onClose={() => setActiveModal(null)}
        assets={[{ id: asset.id, name: asset.name, asset_tag: asset.asset_tag, status: asset.status }]}
      />

      <Modal isOpen={activeModal === 'document'} onClose={() => setActiveModal(null)} title="Add Document">
        <AddDocumentModal assetId={asset.id.toString()} onCancel={() => setActiveModal(null)} onSuccess={() => setActiveModal(null)} />
      </Modal>
    </div>
  );
}
