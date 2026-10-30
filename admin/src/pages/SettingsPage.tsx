import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useUnits, useUpdateUnit } from '../api/units';
import type { Unit } from '../api/units';
import { useBookingSources, useUpdateBookingSource } from '../api/bookings';
import type { BookingSource } from '../api/bookings';
import {
  useUnitBlocks,
  useCreateUnitBlock,
  useDeleteUnitBlock,
} from '../api/blocks';
import type { UnitBlock, UnitBlockInsert } from '../api/blocks';
import {
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
} from '../api/staff';
import type { StaffMember, StaffInsert } from '../api/staff';
import { todayISO, addDaysISO, formatDateHuman } from '../lib/dates';
import { formatIDR } from '../lib/money';
import { friendlyError } from '../lib/errors';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { MoneyInput } from '../components/ui/MoneyInput';
import { Select } from '../components/ui/Select';
import { Field } from '../components/ui/Field';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

type TabType = 'units' | 'sources' | 'blocks' | 'staff';

export const SettingsPage: React.FC = () => {
  const { t, lang } = useI18n();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('units');

  // Units
  const { data: units = [], isLoading: loadingUnits } = useUnits();
  const updateUnitMutation = useUpdateUnit();
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitRateInput, setUnitRateInput] = useState<number>(0);

  // Sources
  const { data: sources = [], isLoading: loadingSources } = useBookingSources();
  const updateSourceMutation = useUpdateBookingSource();
  const [editingSource, setEditingSource] = useState<BookingSource | null>(null);
  const [sourceLabelInput, setSourceLabelInput] = useState<string>('');
  const [sourceColorInput, setSourceColorInput] = useState<string>('#536275');

  // Blocks
  const { data: blocks = [], isLoading: loadingBlocks } = useUnitBlocks();
  const createBlockMutation = useCreateUnitBlock();
  const deleteBlockMutation = useDeleteUnitBlock();
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [blockUnitId, setBlockUnitId] = useState<number>(0);
  const [blockStart, setBlockStart] = useState<string>(todayISO());
  const [blockEnd, setBlockEnd] = useState<string>(addDaysISO(todayISO(), 2));
  const [blockReason, setBlockReason] = useState<string>('');
  const [deletingBlock, setDeletingBlock] = useState<UnitBlock | null>(null);

  // Staff
  const { data: staffList = [], isLoading: loadingStaff } = useStaffList();
  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffUuid, setStaffUuid] = useState<string>('');
  const [staffName, setStaffName] = useState<string>('');
  const [staffRole, setStaffRole] = useState<'manager' | 'reception'>('reception');

  // ----------------------------------------------------
  // Handlers
  // ----------------------------------------------------
  const handleSaveUnitRate = async () => {
    if (!editingUnit) return;
    try {
      await updateUnitMutation.mutateAsync({
        id: editingUnit.id,
        updates: { default_rate: unitRateInput },
      });
      showToast('success', t('common.success'));
      setEditingUnit(null);
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleToggleUnitActive = async (unit: Unit) => {
    try {
      await updateUnitMutation.mutateAsync({
        id: unit.id,
        updates: { active: !unit.active },
      });
      showToast('success', t('common.success'));
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleSaveSource = async () => {
    if (!editingSource) return;
    try {
      await updateSourceMutation.mutateAsync({
        code: editingSource.code,
        updates: { label: sourceLabelInput.trim(), color: sourceColorInput },
      });
      showToast('success', t('common.success'));
      setEditingSource(null);
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleToggleSourceActive = async (s: BookingSource) => {
    try {
      await updateSourceMutation.mutateAsync({
        code: s.code,
        updates: { active: !s.active },
      });
      showToast('success', t('common.success'));
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockUnitId || !blockReason.trim() || blockEnd <= blockStart) {
      showToast('error', t('errors.invalidData'));
      return;
    }
    try {
      const payload: UnitBlockInsert = {
        unit_id: blockUnitId,
        start_date: blockStart,
        end_date: blockEnd,
        reason: blockReason.trim(),
      };
      await createBlockMutation.mutateAsync(payload);
      showToast('success', t('common.success'));
      setIsAddBlockOpen(false);
      setBlockReason('');
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleDeleteBlock = async () => {
    if (!deletingBlock) return;
    try {
      await deleteBlockMutation.mutateAsync(deletingBlock.id);
      showToast('success', t('common.success'));
      setDeletingBlock(null);
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUuid.trim() || !staffName.trim()) {
      showToast('error', t('common.required'));
      return;
    }
    try {
      const payload: StaffInsert = {
        id: staffUuid.trim(),
        full_name: staffName.trim(),
        role: staffRole,
        active: true,
      };
      await createStaffMutation.mutateAsync(payload);
      showToast('success', t('common.success'));
      setIsAddStaffOpen(false);
      setStaffUuid('');
      setStaffName('');
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleToggleStaffRole = async (s: StaffMember) => {
    const nextRole = s.role === 'manager' ? 'reception' : 'manager';
    try {
      await updateStaffMutation.mutateAsync({
        id: s.id,
        updates: { role: nextRole },
      });
      showToast('success', t('common.success'));
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleToggleStaffActive = async (s: StaffMember) => {
    try {
      await updateStaffMutation.mutateAsync({
        id: s.id,
        updates: { active: !s.active },
      });
      showToast('success', t('common.success'));
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  return (
    <div className="space-y-6 text-start">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-navy">{t('nav.settings')}</h1>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-line pb-1 overflow-x-auto">
        {(['units', 'sources', 'blocks', 'staff'] as TabType[]).map((tab) => {
          const tabLabel = {
            units: t('settings.tabUnits'),
            sources: t('settings.tabSources'),
            blocks: t('settings.tabBlocks'),
            staff: t('settings.tabStaff'),
          }[tab];

          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-b-2 border-navy text-navy bg-white shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------- */}
      {/* Tab 1: Units & Rates */}
      {/* -------------------------------------------------- */}
      {activeTab === 'units' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-navy">
              {t('settings.tabUnits')} ({units.length})
            </h2>
          </div>

          {loadingUnits ? (
            <div className="py-20 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>No</Th>
                  <Th>{t('booking.unit')}</Th>
                  <Th>Jenis</Th>
                  <Th>{t('settings.defaultRate')}</Th>
                  <Th>{t('settings.active')}</Th>
                  <Th>{t('common.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {units.map((unit) => (
                  <Tr key={unit.id} className={unit.kind === 'villa' ? 'bg-mist/30 font-bold' : ''}>
                    <Td className="text-xs text-muted">{unit.sort_order}</Td>
                    <Td className="font-semibold text-ink">
                      {unit.kind === 'villa' ? `★ ${unit.name}` : unit.name}
                    </Td>
                    <Td className="text-xs text-muted uppercase">
                      {unit.kind}
                    </Td>
                    <Td className="font-bold text-navy text-xs">
                      {unit.default_rate ? formatIDR(Number(unit.default_rate)) : '—'}
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => handleToggleUnitActive(unit)}
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          unit.active
                            ? 'bg-success/15 text-success'
                            : 'bg-danger/15 text-danger'
                        }`}
                      >
                        {unit.active ? t('common.yes') : t('common.no')}
                      </button>
                    </Td>
                    <Td>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingUnit(unit);
                          setUnitRateInput(Number(unit.default_rate || 0));
                        }}
                      >
                        {t('common.edit')}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* -------------------------------------------------- */}
      {/* Tab 2: Booking Sources */}
      {/* -------------------------------------------------- */}
      {activeTab === 'sources' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-navy">
              {t('settings.tabSources')} ({sources.length})
            </h2>
          </div>

          {loadingSources ? (
            <div className="py-20 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Kode</Th>
                  <Th>Nama Sumber</Th>
                  <Th>Warna</Th>
                  <Th>{t('settings.active')}</Th>
                  <Th>{t('common.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sources.map((src) => (
                  <Tr key={src.code}>
                    <Td className="font-mono text-xs font-bold text-navy">{src.code}</Td>
                    <Td className="font-semibold text-ink">{src.label}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-line"
                          style={{ backgroundColor: src.color }}
                        />
                        <span className="font-mono text-xs text-muted">{src.color}</span>
                      </div>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => handleToggleSourceActive(src)}
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          src.active
                            ? 'bg-success/15 text-success'
                            : 'bg-danger/15 text-danger'
                        }`}
                      >
                        {src.active ? t('common.yes') : t('common.no')}
                      </button>
                    </Td>
                    <Td>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingSource(src);
                          setSourceLabelInput(src.label);
                          setSourceColorInput(src.color);
                        }}
                      >
                        {t('common.edit')}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* -------------------------------------------------- */}
      {/* Tab 3: Maintenance Blocks */}
      {/* -------------------------------------------------- */}
      {activeTab === 'blocks' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-navy">
              {t('settings.tabBlocks')} ({blocks.length})
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (units.length > 0) setBlockUnitId(units[0].id);
                setIsAddBlockOpen(true);
              }}
            >
              + {t('settings.addBlock')}
            </Button>
          </div>

          {loadingBlocks ? (
            <div className="py-20 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : blocks.length === 0 ? (
            <EmptyState
              title={t('common.noData')}
              description={t('settings.tabBlocks')}
            />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>{t('booking.unit')}</Th>
                  <Th>{t('settings.blockStart')}</Th>
                  <Th>{t('settings.blockEnd')}</Th>
                  <Th>{t('settings.blockReason')}</Th>
                  <Th>{t('common.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {blocks.map((b) => (
                  <Tr key={b.id}>
                    <Td className="font-bold text-navy">{b.units?.name || b.unit_id}</Td>
                    <Td className="text-xs text-muted">{formatDateHuman(b.start_date, lang)}</Td>
                    <Td className="text-xs text-muted">{formatDateHuman(b.end_date, lang)}</Td>
                    <Td className="text-xs font-medium text-ink">{b.reason}</Td>
                    <Td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeletingBlock(b)}
                      >
                        {t('common.delete')}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* -------------------------------------------------- */}
      {/* Tab 4: Staff Management */}
      {/* -------------------------------------------------- */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Explanation Alert */}
          <div className="p-4 rounded-xl bg-mist/60 border border-line text-xs text-ink leading-relaxed">
            ℹ️ {t('settings.staffExplanation')}
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-navy">
                {t('settings.tabStaff')} ({staffList.length})
              </h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddStaffOpen(true)}
              >
                + {t('settings.addStaff')}
              </Button>
            </div>

            {loadingStaff ? (
              <div className="py-20 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t('settings.staffName')}</Th>
                    <Th>{t('settings.staffRole')}</Th>
                    <Th>{t('settings.active')}</Th>
                    <Th>{t('common.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {staffList.map((staff) => (
                    <Tr key={staff.id}>
                      <Td className="font-bold text-navy">{staff.full_name}</Td>
                      <Td>
                        <Badge variant={staff.role === 'manager' ? 'gold' : 'navy'}>
                          {t(`role.${staff.role}`)}
                        </Badge>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => handleToggleStaffActive(staff)}
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            staff.active
                              ? 'bg-success/15 text-success'
                              : 'bg-danger/15 text-danger'
                          }`}
                        >
                          {staff.active ? t('common.yes') : t('common.no')}
                        </button>
                      </Td>
                      <Td>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleStaffRole(staff)}
                        >
                          {t('settings.changeRole')}
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* Modals */}
      {/* -------------------------------------------------- */}
      {/* Edit Unit Rate Modal */}
      <Modal
        isOpen={Boolean(editingUnit)}
        onClose={() => setEditingUnit(null)}
        title={`${t('common.edit')} ${editingUnit?.name || ''}`}
      >
        <div className="space-y-4">
          <Field label={t('settings.defaultRate')} required>
            <MoneyInput
              value={unitRateInput}
              onChange={(val) => setUnitRateInput(val)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingUnit(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSaveUnitRate}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Source Modal */}
      <Modal
        isOpen={Boolean(editingSource)}
        onClose={() => setEditingSource(null)}
        title={`${t('common.edit')} ${editingSource?.code || ''}`}
      >
        <div className="space-y-4">
          <Field label="Label" required>
            <Input
              type="text"
              value={sourceLabelInput}
              onChange={(e) => setSourceLabelInput(e.target.value)}
            />
          </Field>
          <Field label="Color (Hex)" required>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={sourceColorInput}
                onChange={(e) => setSourceColorInput(e.target.value)}
                className="w-10 h-10 rounded border border-line cursor-pointer"
              />
              <Input
                type="text"
                value={sourceColorInput}
                onChange={(e) => setSourceColorInput(e.target.value)}
                className="w-32 font-mono"
              />
            </div>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingSource(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSaveSource}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Maintenance Block Modal */}
      <Modal
        isOpen={isAddBlockOpen}
        onClose={() => setIsAddBlockOpen(false)}
        title={t('settings.addBlock')}
      >
        <form onSubmit={handleCreateBlock} className="space-y-4">
          <Field label={t('settings.blockUnit')} required>
            <Select
              value={String(blockUnitId)}
              onChange={(e) => setBlockUnitId(parseInt(e.target.value))}
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('settings.blockStart')} required>
              <Input
                type="date"
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
              />
            </Field>
            <Field label={t('settings.blockEnd')} required>
              <Input
                type="date"
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
              />
            </Field>
          </div>

          <Field label={t('settings.blockReason')} required>
            <Input
              type="text"
              placeholder="e.g. Renovasi AC / Cat Ulang"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsAddBlockOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Block Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingBlock)}
        onClose={() => setDeletingBlock(null)}
        onConfirm={handleDeleteBlock}
        title={t('common.delete')}
        message={t('settings.deleteBlockConfirm')}
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title={t('settings.addStaff')}
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Field label={t('settings.staffUuid')} required>
            <Input
              type="text"
              placeholder="auth.users UUID (e.g. 11111111-1111-...)"
              value={staffUuid}
              onChange={(e) => setStaffUuid(e.target.value)}
            />
          </Field>

          <Field label={t('settings.staffName')} required>
            <Input
              type="text"
              placeholder="Nama Lengkap Staf"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
            />
          </Field>

          <Field label={t('settings.staffRole')} required>
            <Select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value as typeof staffRole)}
            >
              <option value="reception">{t('role.reception')}</option>
              <option value="manager">{t('role.manager')}</option>
            </Select>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsAddStaffOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
