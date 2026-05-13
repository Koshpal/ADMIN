import React, { useState, useEffect, useCallback } from 'react';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import {
  Calendar,
  Clock,
  Video,
  Star,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Search,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { adminService } from '../../services/admin.service';
import { AdminSession, BookingStatus } from '../../types/admin.types';
import { useToast } from '../../context/ToastContext';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { label: string; value: BookingStatus | '' }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function durationLabel(start: string, end: string): string {
  const dur = intervalToDuration({ start: new Date(start), end: new Date(end) });
  if (dur.hours && dur.minutes) return `${dur.hours}h ${dur.minutes}m`;
  if (dur.hours) return `${dur.hours}h`;
  if (dur.minutes) return `${dur.minutes}m`;
  return '—';
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? 'text-[var(--color-warning)] fill-[var(--color-warning)]' : 'text-[var(--color-border-primary)]'}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-[var(--color-text-secondary)]">{rating}/5</span>
    </div>
  );
}

function SessionDetailDrawer({ session, onClose }: { session: AdminSession; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-[var(--color-bg-card)] border-l border-[var(--color-border-primary)] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-card)]">
          <div>
            <h2 className="text-h3 text-[var(--color-text-primary)]">Session Details</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{session.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Status + Time */}
          <div className="p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]">
            <div className="flex items-center justify-between mb-3">
              <StatusBadge
                variant={
                  session.status === 'COMPLETED' ? 'success'
                  : session.status === 'CANCELLED' ? 'error'
                  : 'info'
                }
                label={session.status}
              />
              <span className="text-xs text-[var(--color-text-muted)]">
                {durationLabel(session.slotStart, session.slotEnd)}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{format(new Date(session.slotStart), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  {format(new Date(session.slotStart), 'h:mm a')} — {format(new Date(session.slotEnd), 'h:mm a')}
                </span>
              </div>
              {session.meetingLink && (
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 flex-shrink-0 text-[var(--color-primary)]" />
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-primary)] hover:underline truncate"
                  >
                    {session.meetingLink}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation */}
          {session.status === 'CANCELLED' && session.cancellationReason && (
            <div className="p-4 rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-error)] mb-1">Cancellation Reason</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{session.cancellationReason}</p>
              {session.cancelledAt && (
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Cancelled on {format(new Date(session.cancelledAt), 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
          )}

          {/* Coach */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">Coach</p>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]">
              <Avatar name={session.coach.fullName} src={session.coach.profilePhoto} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-text-primary)]">{session.coach.fullName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{session.coach.email}</p>
                {session.coach.location && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{session.coach.location}</p>
                )}
                {session.coach.expertise && session.coach.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {session.coach.expertise.slice(0, 4).map((e) => (
                      <span key={e} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        {e}
                      </span>
                    ))}
                  </div>
                )}
                {session.coach.bio && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-2 line-clamp-2">{session.coach.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Employee */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">Employee</p>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]">
              <Avatar name={session.employee.fullName} src={session.employee.profilePhoto} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-text-primary)]">{session.employee.fullName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{session.employee.email}</p>
                {session.employee.phone && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{session.employee.phone}</p>
                )}
                {session.employee.company && (
                  <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]">
                    {session.employee.company}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Session Notes (from booking) */}
          {session.notes && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Session Notes</p>
              <div className="p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]">
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">{session.notes}</p>
              </div>
            </div>
          )}

          {/* Coach Notes */}
          {session.coachNote && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Coach Notes</p>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[var(--color-border-primary)] text-[var(--color-text-muted)]">
                  {session.coachNote.visibility === 'PRIVATE' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {session.coachNote.visibility}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]">
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">{session.coachNote.notes}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  {format(new Date(session.coachNote.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}

          {/* Employee Feedback */}
          {session.feedback && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Employee Feedback</p>
              <div className="p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)]">
                <StarRating rating={session.feedback.rating} />
                {session.feedback.feedbackText && (
                  <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line mt-2">{session.feedback.feedbackText}</p>
                )}
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  {format(new Date(session.feedback.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}

          <div className="pb-2">
            <p className="text-xs text-[var(--color-text-muted)]">
              Booked on {format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Sessions: React.FC = () => {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedSession, setSelectedSession] = useState<AdminSession | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getSessions({
        search: search || undefined,
        status: statusFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setSessions(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      showToast('Failed to load sessions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, fromDate, toDate, page, showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleStatusChange = (v: BookingStatus | '') => {
    setStatusFilter(v);
    setPage(1);
  };

  const handleDateFilter = () => {
    setPage(1);
    load();
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const hasFilters = search || statusFilter || fromDate || toDate;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        subtitle={`${total.toLocaleString()} session${total !== 1 ? 's' : ''} across the platform`}
      />

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by coach, employee, or company..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as BookingStatus | '')}
            className="px-3.5 py-2.5 text-sm rounded-xl border bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] min-w-[160px]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 flex-1 w-full">
            <Filter className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
            <span className="text-xs text-[var(--color-text-muted)] w-8">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              onBlur={handleDateFilter}
              className="flex-1 px-3.5 py-2 text-sm rounded-xl border bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
            />
            <span className="text-xs text-[var(--color-text-muted)] w-4 text-center">—</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              onBlur={handleDateFilter}
              className="flex-1 px-3.5 py-2 text-sm rounded-xl border bg-[var(--color-input-bg)] border-[var(--color-input-border)] text-[var(--color-input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors whitespace-nowrap px-2"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Date & Time</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Coach</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Employee</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Company</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Duration</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Rating</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border-primary)] last:border-0">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded-lg bg-[var(--color-bg-secondary)] animate-pulse" style={{ width: `${60 + (j * 13) % 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-10 h-10 text-[var(--color-text-muted)] opacity-40" />
                      <p className="text-[var(--color-text-muted)] font-medium">No sessions found</p>
                      {hasFilters && (
                        <button onClick={clearFilters} className="text-xs text-[var(--color-primary)] hover:underline">Clear filters</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className="border-b border-[var(--color-border-primary)] last:border-0 hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {format(new Date(s.slotStart), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {format(new Date(s.slotStart), 'h:mm a')}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.coach.fullName} src={s.coach.profilePhoto} size="sm" />
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)] leading-tight">{s.coach.fullName}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{s.coach.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.employee.fullName} src={s.employee.profilePhoto} size="sm" />
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)] leading-tight">{s.employee.fullName}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{s.employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {s.employee.company || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{durationLabel(s.slotStart, s.slotEnd)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        variant={
                          s.status === 'COMPLETED' ? 'success'
                          : s.status === 'CANCELLED' ? 'error'
                          : 'info'
                        }
                        label={s.status}
                      />
                    </td>
                    <td className="px-5 py-4">
                      {s.feedback ? (
                        <StarRating rating={s.feedback.rating} />
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-[var(--color-border-primary)] flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-muted)]">
              Page {page} of {totalPages} · {total} sessions
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-xl border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-xl border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedSession && (
        <SessionDetailDrawer session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
};
