import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Fingerprint,
  RefreshCw,
  Settings as SettingsIcon,
  Calendar as CalendarIcon,
  Search,
  Download,
  PlusCircle,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserX,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  Check,
  X,
  Wifi,
  Trash2,
  Users,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useToast } from '../components/ui/Toast';
import { useStaffList } from '../api/staff';
import {
  useAttendanceSettings,
  useSaveAttendanceSettings,
  useAttendanceLogs,
  useSyncFingerspotCloud,
  useAddManualPunch,
  calculateDailyAttendance,
  type DailyStaffAttendance,
  type AttendanceSettings,
} from '../api/attendance';
import { todayISO, addDaysISO, formatDateHuman } from '../lib/dates';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

export const AttendancePage: React.FC = () => {
  const { lang } = useI18n();
  const { showToast } = useToast();
  const isAr = lang === 'ar';

  // Date selection state (default today)
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present_on_time' | 'late' | 'early_leave' | 'absent'>('all');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReceptionToolOpen, setIsReceptionToolOpen] = useState(false);
  const [isManualPunchOpen, setIsManualPunchOpen] = useState(false);
  const [selectedStaffPunches, setSelectedStaffPunches] = useState<DailyStaffAttendance | null>(null);

  // Queries
  const { data: staffList = [], isLoading: isStaffLoading } = useStaffList();
  const { data: settings, isLoading: isSettingsLoading } = useAttendanceSettings();
  const { data: logs = [], isLoading: isLogsLoading, refetch: refetchLogs } = useAttendanceLogs(selectedDate);

  // Mutations
  const saveSettingsMutation = useSaveAttendanceSettings();
  const syncCloudMutation = useSyncFingerspotCloud();
  const addManualPunchMutation = useAddManualPunch();

  // Settings form draft state
  const [settingsDraft, setSettingsDraft] = useState<AttendanceSettings | null>(null);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpPin, setNewEmpPin] = useState('');

  // Manual punch form state
  const [manualStaffId, setManualStaffId] = useState('');
  const [manualPunchType, setManualPunchType] = useState<'check_in' | 'check_out'>('check_in');
  const [manualTime, setManualTime] = useState('08:00');
  const [manualNote, setManualNote] = useState('');

  // Daily calculated attendance
  const dailyAttendance = useMemo(() => {
    if (!settings) return [];
    return calculateDailyAttendance(selectedDate, staffList, logs, settings);
  }, [selectedDate, staffList, logs, settings]);

  // Filtered rows
  const filteredAttendance = useMemo(() => {
    return dailyAttendance.filter((row) => {
      // Status filter
      if (statusFilter !== 'all' && row.status !== statusFilter) {
        return false;
      }
      // Search query (name, pin, role)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = row.staffName.toLowerCase().includes(q);
        const matchesPin = row.pin.toLowerCase().includes(q);
        const matchesRole = row.role.toLowerCase().includes(q);
        return matchesName || matchesPin || matchesRole;
      }
      return true;
    });
  }, [dailyAttendance, statusFilter, searchQuery]);

  // KPI Summary stats
  const stats = useMemo(() => {
    let presentOnTime = 0;
    let late = 0;
    let earlyLeave = 0;
    let absent = 0;
    let totalWorkHours = 0;

    for (const row of dailyAttendance) {
      if (row.status === 'present_on_time') presentOnTime++;
      else if (row.status === 'late') late++;
      else if (row.status === 'early_leave') earlyLeave++;
      else absent++;

      totalWorkHours += row.totalHours;
    }

    return {
      totalStaff: dailyAttendance.length,
      presentOnTime,
      late,
      earlyLeave,
      absent,
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
    };
  }, [dailyAttendance]);

  // Open settings modal and clone draft
  const handleOpenSettings = () => {
    if (settings) {
      setSettingsDraft({
        ...settings,
        pinMapping: { ...(settings.pinMapping || {}) },
        customEmployees: [...(settings.customEmployees || [])],
      });
      setNewEmpName('');
      setNewEmpRole('');
      setNewEmpPin('');
    }
    setIsSettingsOpen(true);
  };

  const handleAddCustomEmployee = () => {
    if (!settingsDraft) return;
    const name = newEmpName.trim();
    const pin = newEmpPin.trim();
    const role = newEmpRole.trim() || (isAr ? 'موظف' : 'Karyawan');

    if (!name) {
      showToast('warning', isAr ? 'يرجى كتابة اسم الموظف' : 'Silakan masukkan nama karyawan');
      return;
    }
    if (!pin) {
      showToast('warning', isAr ? 'يرجى تحديد رقم البصمة (PIN)' : 'Silakan tentukan PIN mesin');
      return;
    }

    const currentList = settingsDraft.customEmployees || [];
    if (currentList.some((e) => e.pin === pin)) {
      showToast('warning', isAr ? 'رقم البصمة هذا مسجل بالفعل لموظف آخر' : 'PIN ini sudah terdaftar');
      return;
    }

    setSettingsDraft({
      ...settingsDraft,
      customEmployees: [
        ...currentList,
        { pin, name, role },
      ],
    });

    setNewEmpName('');
    setNewEmpRole('');
    setNewEmpPin('');
  };

  const handleRemoveCustomEmployee = (pinToRemove: string) => {
    if (!settingsDraft) return;
    setSettingsDraft({
      ...settingsDraft,
      customEmployees: (settingsDraft.customEmployees || []).filter((e) => e.pin !== pinToRemove),
    });
  };

  // Save settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsDraft) return;

    try {
      await saveSettingsMutation.mutateAsync(settingsDraft);
      showToast('success', isAr ? 'تم حفظ إعدادات البصمة وقائمة الموظفين بنجاح' : 'Pengaturan presensi & karyawan berhasil disimpan');
      setIsSettingsOpen(false);
      refetchLogs();
    } catch {
      showToast('error', isAr ? 'فشل حفظ الإعدادات' : 'Gagal menyimpan pengaturan');
    }
  };

  // Trigger Cloud Sync
  const handleSyncCloud = async () => {
    if (!settings) return;
    try {
      const res = await syncCloudMutation.mutateAsync({
        date: selectedDate,
        token: settings.apiToken,
        cloudId: settings.cloudId || settings.deviceSn,
      });

      if ((res.newPunchesCount || 0) > 0) {
        showToast(
          'success',
          isAr
            ? `تمت مزامنة ${res.newPunchesCount} بصمة جديدة بنجاح!`
            : `Berhasil sinkron ${res.newPunchesCount} scan baru!`
        );
      } else {
        showToast(
          'info',
          isAr
            ? 'تم الاتصال بالسحابة: لا توجد حركات بصمة جديدة في هذا اليوم'
            : 'Terhubung ke cloud: Tidak ada data scan baru hari ini'
        );
      }
      refetchLogs();
    } catch (err: any) {
      showToast(
        'warning',
        isAr
          ? `تعذر الاتصال بالسحابة: ${err?.message || 'يرجى التأكد من تشغيل أداة الاستقبال'}`
          : `Gagal sinkron cloud: ${err?.message || 'Pastikan aplikasi resepsionis aktif'}`
      );
    }
  };

  // Handle Manual Punch Submission
  const handleSaveManualPunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStaffId) {
      showToast('warning', isAr ? 'يرجى اختيار الموظف' : 'Silakan pilih karyawan');
      return;
    }

    const person = dailyAttendance.find((r) => r.staffId === manualStaffId);
    if (!person || !settings) return;

    const pin = person.pin;
    const scanTime = `${selectedDate} ${manualTime}:00`;

    try {
      await addManualPunchMutation.mutateAsync({
        pin,
        staffId: person.staffId.startsWith('custom-') || person.staffId.startsWith('biometric-') ? undefined : person.staffId,
        staffName: person.staffName,
        scanTime,
        punchType: manualPunchType,
        verifyType: 'manual',
        deviceSn: settings.deviceSn,
        source: 'manual',
        notes: manualNote.trim() || undefined,
      });

      showToast('success', isAr ? 'تم تسجيل البصمة اليدوية بنجاح' : 'Scan manual berhasil disimpan');
      setIsManualPunchOpen(false);
      setManualNote('');
      refetchLogs();
    } catch {
      showToast('error', isAr ? 'فشل حفظ البصمة' : 'Gagal menyimpan scan');
    }
  };

  // Export Table to Excel
  const handleExportExcel = () => {
    const data = filteredAttendance.map((row) => ({
      [isAr ? 'الموظف' : 'Karyawan']: row.staffName,
      [isAr ? 'المسمى الوظيفي' : 'Jabatan']: row.role,
      [isAr ? 'رقم البصمة' : 'PIN Mesin']: row.pin,
      [isAr ? 'التاريخ' : 'Tanggal']: row.date,
      [isAr ? 'وقت الحضور' : 'Jam Masuk']: row.firstIn || '—',
      [isAr ? 'وقت الانصراف' : 'Jam Pulang']: row.lastOut || '—',
      [isAr ? 'ساعات العمل' : 'Durasi Jam']: row.totalHours,
      [isAr ? 'دقائق التأخير' : 'Menit Telat']: row.lateMinutes,
      [isAr ? 'الحالة' : 'Status']:
        row.status === 'present_on_time'
          ? isAr ? 'حاضر في الموعد' : 'Tepat Waktu'
          : row.status === 'late'
          ? isAr ? `متأخر (${row.lateMinutes} د)` : `Terlambat (${row.lateMinutes}m)`
          : row.status === 'early_leave'
          ? isAr ? 'انصراف مبكر' : 'Pulang Awal'
          : isAr ? 'غائب' : 'Tidak Hadir',
      [isAr ? 'عدد البصمات' : 'Jml Scan']: row.punches.length,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `Attendance_${selectedDate}.xlsx`);
  };

  // Quick Date Navigation
  const handlePrevDay = () => setSelectedDate((curr) => addDaysISO(curr, -1));
  const handleNextDay = () => setSelectedDate((curr) => addDaysISO(curr, 1));
  const isToday = selectedDate === todayISO();

  const isLoading = isStaffLoading || isSettingsLoading || isLogsLoading;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-navy-dark via-navy to-navy-dark rounded-2xl p-6 text-white shadow-xl border border-gold/20 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 text-gold-light shadow-inner flex-shrink-0">
            <Fingerprint className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isAr ? 'سجل الحضور والغياب للموظفين' : 'Data Presensi & Absensi Karyawan'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isAr ? 'ربط مباشر' : 'Live Sync'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isAr
                ? 'مزامنة فورية ودائمة مع جهاز البصمة Revo W-230N — يعمل بدون توقف عبر شبكة كمبيوتر الاستقبال المحلية وسحابة المجد.'
                : 'Sinkronisasi instan & otomatis dengan mesin absensi Revo W-230N via jaringan resepsionis & cloud.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="gold"
            size="sm"
            onClick={handleSyncCloud}
            disabled={syncCloudMutation.isPending}
            className="shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${syncCloudMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'مزامنة السحابة' : 'Sinkron Cloud'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsReceptionToolOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs"
          >
            <Laptop className="w-4 h-4 text-gold-light" />
            <span>{isAr ? 'أداة الاستقبال' : 'Aplikasi Resepsionis'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setManualStaffId(dailyAttendance[0]?.staffId || staffList[0]?.id || '');
              setIsManualPunchOpen(true);
            }}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'بصمة يدوية' : 'Scan Manual'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenSettings}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'الإعدادات' : 'Pengaturan'}</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title={isAr ? 'إجمالي الموظفين' : 'Total Karyawan'}
          value={stats.totalStaff}
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="navy"
        />
        <StatCard
          title={isAr ? 'حاضر في الموعد' : 'Tepat Waktu'}
          value={stats.presentOnTime}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          title={isAr ? 'حاضر مع تأخير' : 'Terlambat'}
          value={stats.late}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="gold"
        />
        <StatCard
          title={isAr ? 'غائب' : 'Tidak Hadir'}
          value={stats.absent}
          icon={<UserX className="w-5 h-5" />}
          variant="danger"
        />
        <StatCard
          title={isAr ? 'ساعات العمل' : 'Total Jam Kerja'}
          value={`${stats.totalWorkHours}h`}
          icon={<Clock className="w-5 h-5" />}
          variant="default"
        />
      </div>

      {/* 3. Date Navigation & Filter Controls Bar */}
      <Card className="p-4 shadow-sm border border-line">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Date Navigator */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-2 rounded-lg border border-line bg-stone/40 hover:bg-stone text-ink transition-colors"
              title={isAr ? 'اليوم السابق' : 'Hari Sebelumnya'}
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white shadow-inner">
              <CalendarIcon className="w-4 h-4 text-gold" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-ink bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              className="p-2 rounded-lg border border-line bg-stone/40 hover:bg-stone text-ink transition-colors"
              title={isAr ? 'اليوم التالي' : 'Hari Berikutnya'}
            >
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Quick Today Button */}
            {!isToday && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDate(todayISO())}
                className="text-xs font-medium"
              >
                {isAr ? 'العودة لليوم' : 'Kembali ke Hari Ini'}
              </Button>
            )}

            <span className="text-xs text-muted font-medium px-2 hidden sm:inline">
              {formatDateHuman(selectedDate, isAr ? 'ar' : 'id')}
            </span>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 flex-1 md:justify-end">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-muted absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                placeholder={isAr ? 'بحث بالموظف أو رقم البصمة...' : 'Cari karyawan atau PIN...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm ps-9 pe-3 py-1.5 rounded-lg border border-line bg-stone/20 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-gold transition-all"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportExcel}
              className="flex-shrink-0"
              title={isAr ? 'تصدير إلى Excel' : 'Ekspor Excel'}
            >
              <Download className="w-4 h-4 text-navy" />
              <span className="hidden sm:inline">{isAr ? 'تصدير' : 'Ekspor'}</span>
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-line/60 mt-3 text-xs">
          <span className="text-muted font-medium pe-2">{isAr ? 'تصفية الحالة:' : 'Filter Status:'}</span>
          {[
            { id: 'all', label: isAr ? 'الكل' : 'Semua', count: dailyAttendance.length },
            { id: 'present_on_time', label: isAr ? 'حاضر في الموعد' : 'Tepat Waktu', count: stats.presentOnTime },
            { id: 'late', label: isAr ? 'متأخر' : 'Terlambat', count: stats.late },
            { id: 'early_leave', label: isAr ? 'انصراف مبكر' : 'Pulang Awal', count: stats.earlyLeave },
            { id: 'absent', label: isAr ? 'غائب' : 'Tidak Hadir', count: stats.absent },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatusFilter(chip.id as any)}
              className={`px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1.5 flex-shrink-0 ${
                statusFilter === chip.id
                  ? 'bg-navy text-white shadow-xs font-semibold'
                  : 'bg-stone/50 hover:bg-stone text-ink border border-line/60'
              }`}
            >
              <span>{chip.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === chip.id ? 'bg-gold text-navy-dark' : 'bg-line text-muted'
                }`}
              >
                {chip.count}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* 4. Attendance Table */}
      <Card className="overflow-hidden shadow-sm border border-line">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="mt-3 text-xs text-muted">
              {isAr ? 'جاري تحميل بيانات الحضور والغياب...' : 'Memuat data presensi...'}
            </p>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <EmptyState
            title={isAr ? 'لا توجد سجلات حضور' : 'Tidak ada data presensi'}
            description={
              isAr
                ? 'لم يتم تسجيل أي بصمة في هذا التاريخ أو لا توجد نتائج مطابقة لبحثك.'
                : 'Belum ada scan pada tanggal ini atau tidak cocok dengan filter.'
            }
            action={
              <Button variant="gold" size="sm" onClick={handleSyncCloud}>
                {isAr ? 'مزامنة السحابة الآن' : 'Sinkronkan Sekarang'}
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr className="bg-stone/40 border-b border-line text-xs font-semibold text-muted">
                  <Th>{isAr ? 'الموظف' : 'Karyawan'}</Th>
                  <Th className="text-center">{isAr ? 'رقم البصمة' : 'PIN Mesin'}</Th>
                  <Th className="text-center">{isAr ? 'وقت الحضور' : 'Jam Masuk'}</Th>
                  <Th className="text-center">{isAr ? 'وقت الانصراف' : 'Jam Pulang'}</Th>
                  <Th className="text-center">{isAr ? 'ساعات العمل' : 'Durasi Jam'}</Th>
                  <Th className="text-center">{isAr ? 'الحالة اليومية' : 'Status'}</Th>
                  <Th className="text-center">{isAr ? 'حركات البصمة' : 'Jml Scan'}</Th>
                  <Th className="text-center">{isAr ? 'التفاصيل' : 'Aksi'}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredAttendance.map((row) => {
                  return (
                    <Tr
                      key={row.staffId}
                      className="hover:bg-gold/5 transition-colors border-b border-line/60 text-xs sm:text-sm"
                    >
                      {/* Staff Name & Role */}
                      <Td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy-dark text-gold-light flex items-center justify-center font-bold text-xs ring-1 ring-gold/30 flex-shrink-0">
                            {row.staffName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-ink leading-tight">{row.staffName}</div>
                            <span className="text-[11px] text-muted font-medium">{row.role}</span>
                          </div>
                        </div>
                      </Td>

                      {/* Biometric PIN */}
                      <Td className="text-center">
                        <span className="px-2 py-0.5 rounded-md bg-stone/70 text-navy font-mono font-bold text-xs border border-line">
                          #{row.pin}
                        </span>
                      </Td>

                      {/* First In */}
                      <Td className="text-center">
                        {row.firstIn ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {row.firstIn}
                          </span>
                        ) : (
                          <span className="text-muted font-mono">—</span>
                        )}
                      </Td>

                      {/* Last Out */}
                      <Td className="text-center">
                        {row.lastOut ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {row.lastOut}
                          </span>
                        ) : (
                          <span className="text-muted font-mono">—</span>
                        )}
                      </Td>

                      {/* Total Hours */}
                      <Td className="text-center font-mono font-bold text-ink">
                        {row.totalHours > 0 ? (
                          <span>{row.totalHours} {isAr ? 'س' : 'j'}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Td>

                      {/* Status Badge */}
                      <Td className="text-center">
                        {row.status === 'present_on_time' && (
                          <Badge variant="success" className="gap-1 font-semibold">
                            <Check className="w-3 h-3" />
                            {isAr ? 'حاضر في الموعد' : 'Tepat Waktu'}
                          </Badge>
                        )}
                        {row.status === 'late' && (
                          <Badge variant="gold" className="gap-1 font-semibold bg-amber-100 text-amber-900 border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {isAr ? `متأخر (+${row.lateMinutes} د)` : `Telat (+${row.lateMinutes}m)`}
                          </Badge>
                        )}
                        {row.status === 'early_leave' && (
                          <Badge variant="gold" className="gap-1 font-semibold">
                            <Clock className="w-3 h-3" />
                            {isAr ? 'انصراف مبكر' : 'Pulang Awal'}
                          </Badge>
                        )}
                        {row.status === 'absent' && (
                          <Badge variant="default" className="gap-1 text-slate-500 bg-slate-100 border-slate-200">
                            <X className="w-3 h-3" />
                            {isAr ? 'غائب' : 'Tidak Hadir'}
                          </Badge>
                        )}
                      </Td>

                      {/* Punches Count */}
                      <Td className="text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStaffPunches(row)}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone/60 hover:bg-gold/20 text-navy transition-colors inline-flex items-center gap-1.5"
                        >
                          <Fingerprint className="w-3.5 h-3.5 text-gold" />
                          <span>{row.punches.length} {isAr ? 'بصمة' : 'scan'}</span>
                        </button>
                      </Td>

                      {/* Action */}
                      <Td className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStaffPunches(row)}
                          className="h-8 w-8 p-0"
                          title={isAr ? 'عرض حركات البصمة' : 'Lihat Riwayat'}
                        >
                          <Eye className="w-4 h-4 text-navy hover:text-gold" />
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>
        )}
      </Card>

      {/* 5. Punch Timeline Modal */}
      {selectedStaffPunches && (
        <Modal
          isOpen={!!selectedStaffPunches}
          onClose={() => setSelectedStaffPunches(null)}
          title={`${isAr ? 'سجل حركات البصمة' : 'Riwayat Scan'}: ${selectedStaffPunches.staffName}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedStaffPunches(null)}>
                {isAr ? 'إغلاق' : 'Tutup'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-stone/40 border border-line flex items-center justify-between text-xs">
              <div>
                <span className="text-muted">{isAr ? 'التاريخ:' : 'Tanggal:'} </span>
                <span className="font-bold text-ink">{selectedStaffPunches.date}</span>
              </div>
              <div>
                <span className="text-muted">{isAr ? 'رقم البصمة:' : 'PIN:'} </span>
                <span className="font-mono font-bold text-navy">#{selectedStaffPunches.pin}</span>
              </div>
              <div>
                <span className="text-muted">{isAr ? 'ساعات العمل:' : 'Jam Kerja:'} </span>
                <span className="font-bold text-emerald-700">{selectedStaffPunches.totalHours}h</span>
              </div>
            </div>

            {selectedStaffPunches.punches.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs">
                {isAr ? 'لا توجد حركات مسجلة لهذا الموظف في هذا التاريخ' : 'Tidak ada catatan scan'}
              </div>
            ) : (
              <div className="relative border-s-2 border-line/80 ms-4 space-y-4 py-2">
                {selectedStaffPunches.punches.map((punch, idx) => {
                  const isCheckIn = idx === 0 || punch.punchType === 'check_in';
                  return (
                    <div key={punch.id || idx} className="relative ps-6">
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -start-2 top-1.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                          isCheckIn ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-blue-500 ring-2 ring-blue-200'
                        }`}
                      />
                      <div className="p-3 rounded-lg bg-stone/20 border border-line/70 hover:bg-stone/40 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                isCheckIn
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isCheckIn
                                ? isAr ? 'تسجيل دخول (حضور)' : 'Check In'
                                : isAr ? 'تسجيل خروج (انصراف)' : 'Check Out'}
                            </span>
                            <span className="font-mono font-bold text-ink text-sm">
                              {punch.scanTime.split(' ')[1] || punch.scanTime}
                            </span>
                          </div>

                          <span className="text-[10px] text-muted font-medium">
                            {punch.source === 'manual'
                              ? isAr ? 'يدوي' : 'Manual'
                              : isAr ? 'جهاز البصمة Revo' : 'Mesin Revo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 6. Settings Modal */}
      {isSettingsOpen && settingsDraft && (
        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          title={isAr ? 'إعدادات جهاز البصمة وربط الموظفين' : 'Pengaturan Mesin & PIN Karyawan'}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted">
                {isAr ? 'يتم حفظ الإعدادات سحابياً لجميع الأجهزة' : 'Disimpan di cloud'}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsSettingsOpen(false)}>
                  {isAr ? 'إلغاء' : 'Batal'}
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleSaveSettings}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending
                    ? isAr ? 'جاري الحفظ...' : 'Menyimpan...'
                    : isAr ? 'حفظ الإعدادات' : 'Simpan'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs sm:text-sm">
            {/* Device Network & Credentials */}
            <div>
              <h4 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-gold" />
                {isAr ? 'بيانات اتصال الجهاز' : 'Koneksi Mesin'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isAr ? 'الرقم التسلسلي للجهاز (SN)' : 'Serial Number (SN)'}
                  </label>
                  <Input
                    value={settingsDraft.deviceSn}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, deviceSn: e.target.value })}
                    placeholder="616230026280266"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isAr ? 'رمز المطور (API Token)' : 'API Token'}
                  </label>
                  <Input
                    value={settingsDraft.apiToken}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, apiToken: e.target.value })}
                    placeholder="HENLQ0WVR7KVHXC3"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isAr ? 'عنوان IP المحلي للجهاز (اختياري)' : 'IP Lokal Mesin (Opsional)'}
                  </label>
                  <Input
                    value={settingsDraft.deviceIp}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, deviceIp: e.target.value })}
                    placeholder="192.168.1.201"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isAr ? 'منفذ الاتصال (Port)' : 'Port Koneksi'}
                  </label>
                  <Input
                    type="number"
                    value={settingsDraft.devicePort}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, devicePort: Number(e.target.value) || 4370 })
                    }
                    placeholder="4370"
                  />
                </div>
              </div>
            </div>

            {/* Shift Timings */}
            <div className="pt-4 border-t border-line">
              <h4 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                {isAr ? 'مواعيد الدوام الرسمي' : 'Jam Kerja'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isAr ? 'بداية الدوام (دخول)' : 'Jam Masuk'}
                  </label>
                  <Input
                    type="time"
                    value={settingsDraft.shiftStart}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, shiftStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isAr ? 'نهاية الدوام (انصراف)' : 'Jam Pulang'}
                  </label>
                  <Input
                    type="time"
                    value={settingsDraft.shiftEnd}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, shiftEnd: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    {isAr ? 'سماح التأخير (دقائق)' : 'Toleransi Telat (menit)'}
                  </label>
                  <Input
                    type="number"
                    value={settingsDraft.lateTolerance}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, lateTolerance: Number(e.target.value) || 15 })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Staff to PIN Mapping & Biometric Employees */}
            <div className="pt-4 border-t border-line space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-ink flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-navy" />
                  {isAr ? 'موظفو البصمة وأرقام الـ PIN' : 'Karyawan & Pemetaan PIN Mesin'}
                </h4>
                <span className="text-xs text-muted">
                  {isAr ? 'حدد رقم البصمة المسجل في الجهاز لكل موظف' : 'Nomor ID di mesin absensi'}
                </span>
              </div>

              {/* PMS Staff (Omar / Manager) */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'حسابات النظام الأساسية:' : 'Pengguna Sistem:'}</span>
                </div>
                <div className="border border-line rounded-lg divide-y divide-line/70 bg-stone/20">
                  {staffList.filter((s) => s.active !== false).map((s) => {
                    const currentPin =
                      settingsDraft.pinMapping?.[s.id] ||
                      (s.full_name.toLowerCase().includes('omar') ? '1' : '');
                    return (
                      <div key={s.id} className="p-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink">{s.full_name}</span>
                          <span className="text-xs text-muted">({s.role})</span>
                          {s.full_name.toLowerCase().includes('omar') && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              {isAr ? 'المدير' : 'Manager'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted font-medium">PIN #</span>
                          <input
                            type="text"
                            value={currentPin}
                            placeholder="1"
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              setSettingsDraft({
                                ...settingsDraft,
                                pinMapping: {
                                  ...settingsDraft.pinMapping,
                                  [s.id]: val,
                                },
                              });
                            }}
                            className="w-20 px-2 py-1 text-center font-mono font-bold rounded border border-line bg-white focus:outline-none focus:ring-1.5 focus:ring-gold text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Biometric Employees (e.g. Cleaners, Drivers, Receptionists) */}
              <div className="space-y-2 pt-2 border-t border-line/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-navy" />
                    <span>{isAr ? 'موظفو الفندق الإضافيون (استقبال، نظافة، حراسة...):' : 'Karyawan Tambahan:'}</span>
                  </span>
                  <span className="text-[11px] text-muted">
                    {isAr ? 'موظفون يبصمون على الجهاز بدون حساب دخول' : 'Karyawan tanpa akun sistem'}
                  </span>
                </div>

                {/* List of custom employees */}
                {(settingsDraft.customEmployees || []).length > 0 ? (
                  <div className="border border-line rounded-lg divide-y divide-line/70 bg-white">
                    {(settingsDraft.customEmployees || []).map((emp) => (
                      <div key={emp.pin} className="p-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold bg-navy text-gold-light text-xs px-2 py-0.5 rounded">
                            PIN #{emp.pin}
                          </span>
                          <span className="font-bold text-ink">{emp.name}</span>
                          <span className="text-xs text-muted">({emp.role || (isAr ? 'موظف' : 'Karyawan')})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomEmployee(emp.pin)}
                          className="p-1 rounded text-danger hover:bg-danger/10 transition"
                          title={isAr ? 'حذف الموظف' : 'Hapus'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-muted bg-stone/20 rounded-lg border border-dashed border-line">
                    {isAr ? 'لا يوجد موظفون إضافيون مسجلون حالياً' : 'Belum ada karyawan tambahan'}
                  </div>
                )}

                {/* Add new employee form */}
                <div className="p-3 bg-stone/30 rounded-lg border border-line space-y-2">
                  <span className="text-xs font-bold text-ink block">
                    {isAr ? 'إضافة موظف جديد للبصمة:' : 'Tambah Karyawan Baru:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={newEmpName}
                        onChange={(e) => setNewEmpName(e.target.value)}
                        placeholder={isAr ? 'اسم الموظف (مثلاً: أحمد)' : 'Nama Karyawan'}
                        className="w-full px-2.5 py-1.5 rounded border border-line bg-white text-xs focus:outline-none focus:ring-1.5 focus:ring-gold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={newEmpRole}
                        onChange={(e) => setNewEmpRole(e.target.value)}
                        placeholder={isAr ? 'الوظيفة (مثلاً: استقبال)' : 'Jabatan'}
                        className="w-full px-2.5 py-1.5 rounded border border-line bg-white text-xs focus:outline-none focus:ring-1.5 focus:ring-gold"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <input
                        type="text"
                        value={newEmpPin}
                        onChange={(e) => setNewEmpPin(e.target.value)}
                        placeholder="PIN #"
                        className="w-full px-2 py-1.5 text-center font-mono font-bold rounded border border-line bg-white text-xs focus:outline-none focus:ring-1.5 focus:ring-gold"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <button
                        type="button"
                        onClick={handleAddCustomEmployee}
                        className="w-full h-full min-h-[30px] flex items-center justify-center gap-1 rounded bg-navy text-gold-light font-bold text-xs hover:bg-navy-dark transition shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إضافة' : 'Tambah'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Reception Tool (Silent Background Daemon) Modal */}
      {isReceptionToolOpen && (
        <Modal
          isOpen={isReceptionToolOpen}
          onClose={() => setIsReceptionToolOpen(false)}
          title={isAr ? 'أداة الاستقبال التلقائية (خفيّة ودائمة)' : 'Aplikasi Resepsionis Otomatis'}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <a
                href={`${import.meta.env.BASE_URL}downloads/biometric-sync-tool.zip`}
                download="biometric-sync-tool.zip"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy hover:bg-navy-dark text-gold font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل مجلد الأداة جاهزاً (ZIP)' : 'Unduh Paket Aplikasi (ZIP)'}</span>
              </a>

              <Button variant="secondary" size="sm" onClick={() => setIsReceptionToolOpen(false)}>
                {isAr ? 'إغلاق' : 'Tutup'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm text-ink leading-relaxed">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {isAr ? 'حل دائم 100% مجاني ومستقل' : 'Solusi Permanen 100% Gratis & Mandiri'}
                </span>
              </div>
              <p className="text-emerald-900/80 text-xs">
                {isAr
                  ? 'هذه الأداة مصممة لتعمل في خلفية جهاز كمبيوتر الاستقبال بدون أي نوافذ سوداء أو إزعاج، تبدأ تلقائياً عند فتح الجهاز وتسحب البصمات كل 20 ثانية، وتحفظها محلياً في حال انقطاع الإنترنت ثم ترفعها للسحابة فوراً عند عودته.'
                  : 'Aplikasi berjalan otomatis di latar belakang (background) komputer resepsionis tanpa jendela command prompt, menyimpan data di SQLite lokal saat internet putus, dan mengunggah ke cloud saat normal.'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-ink">
                {isAr ? 'طريقة التثبيت في 3 خطوات بسيطة على كمبيوتر الاستقبال:' : '3 Langkah Mudah Pemasangan:'}
              </h4>

              <div className="p-3 rounded-lg border border-line bg-stone/30 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-navy text-gold-light flex items-center justify-center font-bold text-xs flex-shrink-0">
                  1
                </span>
                <div>
                  <div className="font-bold text-ink">
                    {isAr ? 'تحميل وفك الضغط' : 'Unduh & Ekstrak'}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {isAr
                      ? 'اضغط زر التحميل أدناه، وانقل المجلد إلى كمبيوتر الاستقبال (مثلاً في C:\\almagd-sync).'
                      : 'Unduh ZIP lalu ekstrak di komputer resepsionis (contoh: C:\\almagd-sync).'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-line bg-stone/30 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-navy text-gold-light flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </span>
                <div>
                  <div className="font-bold text-ink">
                    {isAr ? 'التشغيل التلقائي بنقرة واحدة' : 'Jalankan Sekali Sebagai Admin'}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {isAr
                      ? 'انقر نقرتين على ملف "تثبيت_تلقائي_مع_تشغيل_الويندوز.bat" (أو بالزر الأيمن على install-windows.bat واختر تشغيل كمسؤول).'
                      : 'Klik file "تثبيت_تلقائي_مع_تشغيل_الويندوز.bat" atau klik kanan install-windows.bat lalu pilih "Run as administrator".'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-line bg-stone/30 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-navy text-gold-light flex items-center justify-center font-bold text-xs flex-shrink-0">
                  3
                </span>
                <div>
                  <div className="font-bold text-ink">
                    {isAr ? 'جاهز! تعمل في الخلفية للأبد' : 'Selesai! Berjalan di Background'}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {isAr
                      ? 'سيتم تسجيل الأداة في Windows Task Scheduler لتعمل بصمت تام عند كل إقلاع دون الحاجة لأي برنامج إضافي أو تشغيل يدوي.'
                      : 'Tergabung otomatis di Task Scheduler Windows tanpa perlu dibuka manual.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 8. Manual Punch Modal */}
      {isManualPunchOpen && (
        <Modal
          isOpen={isManualPunchOpen}
          onClose={() => setIsManualPunchOpen(false)}
          title={isAr ? 'تسجيل حركة بصمة يدوية' : 'Input Scan Manual'}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsManualPunchOpen(false)}>
                {isAr ? 'إلغاء' : 'Batal'}
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={handleSaveManualPunch}
                disabled={addManualPunchMutation.isPending}
              >
                {addManualPunchMutation.isPending
                  ? isAr ? 'جاري الحفظ...' : 'Menyimpan...'
                  : isAr ? 'حفظ البصمة' : 'Simpan Scan'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                {isAr ? 'الموظف' : 'Karyawan'}
              </label>
              <select
                value={manualStaffId}
                onChange={(e) => setManualStaffId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-line bg-white text-ink text-xs sm:text-sm focus:outline-none focus:ring-1.5 focus:ring-gold"
              >
                {dailyAttendance.map((row) => (
                  <option key={row.staffId} value={row.staffId}>
                    {row.staffName} ({row.role}) - PIN #{row.pin}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                {isAr ? 'نوع الحركة' : 'Jenis Scan'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setManualPunchType('check_in')}
                  className={`py-2 px-3 rounded-lg font-bold border transition-all text-center ${
                    manualPunchType === 'check_in'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-stone/30 text-ink border-line hover:bg-stone/60'
                  }`}
                >
                  {isAr ? 'حضور (دخول)' : 'Check In (Masuk)'}
                </button>
                <button
                  type="button"
                  onClick={() => setManualPunchType('check_out')}
                  className={`py-2 px-3 rounded-lg font-bold border transition-all text-center ${
                    manualPunchType === 'check_out'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-stone/30 text-ink border-line hover:bg-stone/60'
                  }`}
                >
                  {isAr ? 'انصراف (خروج)' : 'Check Out (Pulang)'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                {isAr ? 'الوقت' : 'Waktu'}
              </label>
              <Input
                type="time"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                {isAr ? 'ملاحظة أو سبب التسجيل اليدوي (اختياري)' : 'Catatan / Alasan (Opsional)'}
              </label>
              <Input
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder={isAr ? 'مثال: نسي البصمة، عطل مؤقت...' : 'Lupa scan, dll...'}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
