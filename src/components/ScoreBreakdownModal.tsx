import { CheckCircle2, Lock, ShieldCheck, X } from 'lucide-react';
import {
  CompatibilityBreakdown,
  ConnectionState,
  RoommateProfile,
} from '../types/dwell';
import {
  formatCleanlinessLabel,
  formatFoodLabel,
  formatSleepLabel,
} from '../utils/compatibility';
import { Avatar } from './Avatar';

interface ScoreBreakdownModalProps {
  profile: RoommateProfile | null;
  compatibility: CompatibilityBreakdown | null;
  connectionState: ConnectionState;
  onClose: () => void;
  onConnectAction: (profileId: string, nextState: ConnectionState) => void;
  onOpenChat: (profileId: string) => void;
}

export function ScoreBreakdownModal({
  profile,
  compatibility,
  connectionState,
  onClose,
  onConnectAction,
  onOpenChat,
}: ScoreBreakdownModalProps) {
  if (!profile || !compatibility) return null;

  const dimensions = [
    {
      label: 'Sleep & Quiet Hours',
      score: compatibility.sleepScore,
      max: 25,
      detail: `${formatSleepLabel(profile.sleepSchedule)} · ${
        profile.quietAfterEleven ? 'Quiet after 11 PM' : 'Flexible late hours'
      }`,
    },
    {
      label: 'Cleanliness & Shared Chores',
      score: compatibility.cleanlinessScore,
      max: 25,
      detail: formatCleanlinessLabel(profile.cleanliness),
    },
    {
      label: 'Food Habits & Kitchen',
      score: compatibility.foodScore,
      max: 25,
      detail: `${formatFoodLabel(profile.foodHabit)} · Cooks ${profile.cookingFrequency}`,
    },
    {
      label: 'Culture & Language',
      score: compatibility.cultureLanguageScore,
      max: 25,
      detail: `Speaks ${profile.languages.join(', ')}`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="breakdown-title"
    >
      <div className="bg-white border border-stone-200 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={profile.name} src={profile.avatarUrl} sizeClass="w-14 h-14" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2
                  id="breakdown-title"
                  className="text-xl font-bold text-[#14191F]"
                >
                  {profile.name}, {profile.age}
                </h2>
                {profile.verified && (
                  <CheckCircle2 className="w-4 h-4 text-[#0F5C4D]" />
                )}
              </div>
              <p className="text-sm text-[#5A6270]">
                {profile.role} · {profile.institution}
              </p>
              <p className="text-xs text-[#5A6270] mt-0.5 tabular-nums">
                {profile.city} · ${profile.monthlyBudgetUsd}/mo · Move-in{' '}
                {profile.moveInMonth}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close breakdown"
            className="p-2 text-[#5A6270] hover:text-[#14191F] rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Score Row */}
        <div className="mt-6 pt-5 border-t border-stone-200 flex items-baseline justify-between">
          <div>
            <span className="text-sm font-medium text-[#5A6270]">
              Overall Compatibility
            </span>
            <p className="text-xs text-[#5A6270] mt-0.5">
              Calculated from your quiz across lifestyle, culture & language
            </p>
          </div>
          <span className="text-3xl font-bold text-[#0F5C4D] tabular-nums">
            {compatibility.overallScore}%
          </span>
        </div>

        {/* 4 Category Progress Bars */}
        <div className="mt-6 space-y-4">
          {dimensions.map((item) => {
            const pct = Math.round((item.score / item.max) * 100);
            return (
              <div key={item.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-[#14191F]">{item.label}</span>
                  <span className="font-mono text-xs text-[#14191F] tabular-nums">
                    {item.score}/{item.max} pts
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full bg-stone-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#0F5C4D] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-[#5A6270] mt-1">{item.detail}</p>
              </div>
            );
          })}
        </div>

        {/* Cultural & Lifestyle Summary */}
        <div className="mt-6 pt-5 border-t border-stone-200 space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-[#14191F]">Culture & Living Style</h4>
            <p className="text-[#3F4752] mt-1">{profile.culturalBackground}</p>
          </div>

          {compatibility.highlights.length > 0 && (
            <div>
              <h4 className="font-semibold text-[#14191F]">Where You Align</h4>
              <ul className="mt-1 space-y-1 text-sm text-[#3F4752]">
                {compatibility.highlights.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          )}

          {compatibility.differences.length > 0 && (
            <div>
              <h4 className="font-semibold text-[#14191F]">Worth Discussing</h4>
              <ul className="mt-1 space-y-1 text-sm text-[#5A6270]">
                {compatibility.differences.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2 text-xs text-[#5A6270]">
            <ShieldCheck className="w-4 h-4 text-[#0F5C4D] shrink-0" />
            <span>
              Smoking: {profile.smoking === 'non-smoker' ? 'Non-smoker' : profile.smoking} · Pets:{' '}
              {profile.pets === 'no-pets'
                ? 'No pets'
                : profile.pets === 'has-pet'
                ? 'Has pet'
                : 'Pet-friendly'}
            </span>
          </div>
        </div>

        {/* Mutual Consent Gate Footer */}
        <div className="mt-6 pt-5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#5A6270]">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Chat opens only when both people agree</span>
          </div>

          <div className="flex items-center gap-3">
            {connectionState === 'none' && (
              <button
                type="button"
                disabled={!compatibility.dealBreakerResult.passed}
                onClick={() => {
                  onConnectAction(profile.id, 'sent');
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#0F5C4D] text-white hover:bg-[#0B473B] transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                Request to Connect
              </button>
            )}
            {connectionState === 'incoming' && (
              <button
                type="button"
                onClick={() => {
                  onConnectAction(profile.id, 'mutual');
                  onClose();
                  onOpenChat(profile.id);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#0F5C4D] text-white hover:bg-[#0B473B] transition-colors cursor-pointer"
              >
                Agree & Open Chat
              </button>
            )}
            {connectionState === 'sent' && (
              <span className="text-sm font-medium text-[#5A6270]">
                Request Sent · Awaiting Reply
              </span>
            )}
            {connectionState === 'mutual' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChat(profile.id);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#14191F] text-white hover:bg-[#262E38] transition-colors cursor-pointer"
              >
                Open Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
