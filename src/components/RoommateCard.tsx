import { CheckCircle2, Lock, MessageSquare, ShieldAlert } from 'lucide-react';
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

interface RoommateCardProps {
  profile: RoommateProfile;
  compatibility: CompatibilityBreakdown;
  connectionState: ConnectionState;
  onViewBreakdown: (profile: RoommateProfile) => void;
  onConnectAction: (profileId: string, nextState: ConnectionState) => void;
  onOpenChat: (profileId: string) => void;
}

export function RoommateCard({
  profile,
  compatibility,
  connectionState,
  onViewBreakdown,
  onConnectAction,
  onOpenChat,
}: RoommateCardProps) {
  const { overallScore, dealBreakerResult } = compatibility;
  const isExcluded = !dealBreakerResult.passed;

  const scoreTone =
    overallScore >= 80
      ? 'text-[#0F5C4D]'
      : overallScore >= 65
      ? 'text-[#B45309]'
      : 'text-[#5A6270]';

  return (
    <article
      className={`bg-white border rounded-xl p-6 flex flex-col justify-between transition-colors ${
        isExcluded
          ? 'border-stone-200 bg-stone-50/60 opacity-85'
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div>
        {/* Top Row: Identity & Compatibility Score */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <Avatar name={profile.name} src={profile.avatarUrl} sizeClass="w-14 h-14" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-semibold text-[#14191F] truncate">
                  {profile.name}, {profile.age}
                </h3>
                {profile.verified && (
                  <CheckCircle2
                    className="w-4 h-4 text-[#0F5C4D] shrink-0"
                    aria-label="Verified profile"
                  />
                )}
              </div>
              <p className="text-sm text-[#5A6270] truncate">
                {profile.role} · {profile.institution}
              </p>
              <p className="text-xs text-[#5A6270] mt-1">
                {profile.verified ? profile.verificationDetail : 'Verification pending'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className={`text-2xl font-bold tabular-nums leading-none ${scoreTone}`}>
              {overallScore}%
            </div>
            <div className="text-xs font-medium text-[#5A6270] mt-1">
              match score
            </div>
          </div>
        </div>

        {/* Unboxed metadata line */}
        <div className="mt-4 pt-3.5 border-t border-stone-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5A6270] tabular-nums">
          <span className="font-medium text-[#14191F]">{profile.city}</span>
          <span aria-hidden="true">·</span>
          <span>{profile.neighborhoods.join(' / ')}</span>
          <span aria-hidden="true">·</span>
          <span>Move-in {profile.moveInMonth}</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-[#14191F]">
            ${profile.monthlyBudgetUsd}/mo
          </span>
        </div>

        {/* Deal-breaker warning if viewed in "Show excluded" mode */}
        {isExcluded && (
          <div className="mt-3 flex items-start gap-2 text-xs text-[#B91C1C]">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Filtered by your deal-breakers:{' '}
              <strong className="font-semibold">
                {dealBreakerResult.violatedRules.join(', ')}
              </strong>
            </span>
          </div>
        )}

        {/* 2x2 Clean Lifestyle Matrix (no nested cards or pills) */}
        <dl className="mt-4 pt-3.5 border-t border-stone-100 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
          <div>
            <dt className="text-[#5A6270]">Sleep Schedule</dt>
            <dd className="text-[#14191F] font-medium mt-0.5">
              {formatSleepLabel(profile.sleepSchedule).split(' (')[0]}
            </dd>
          </div>
          <div>
            <dt className="text-[#5A6270]">Cleanliness</dt>
            <dd className="text-[#14191F] font-medium mt-0.5 tabular-nums">
              {formatCleanlinessLabel(profile.cleanliness)}
            </dd>
          </div>
          <div>
            <dt className="text-[#5A6270]">Food Habits</dt>
            <dd className="text-[#14191F] font-medium mt-0.5">
              {formatFoodLabel(profile.foodHabit)} · Cooks {profile.cookingFrequency}
            </dd>
          </div>
          <div>
            <dt className="text-[#5A6270]">Languages</dt>
            <dd className="text-[#14191F] font-medium mt-0.5 truncate">
              {profile.languages.join(', ')}
            </dd>
          </div>
        </dl>

        {/* Short Bio */}
        <p className="mt-3.5 text-sm text-[#3F4752] leading-relaxed line-clamp-2">
          {profile.bio}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onViewBreakdown(profile)}
          className="text-xs sm:text-sm font-medium text-[#14191F] hover:text-[#0F5C4D] underline underline-offset-4 decoration-stone-300 hover:decoration-[#0F5C4D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Score Breakdown
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {connectionState === 'none' && (
            <button
              type="button"
              disabled={isExcluded}
              onClick={() => onConnectAction(profile.id, 'sent')}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                isExcluded
                  ? 'bg-stone-200 text-stone-600'
                  : 'bg-[#0F5C4D] text-white hover:bg-[#0B473B]'
              }`}
            >
              Request to Connect
            </button>
          )}

          {connectionState === 'incoming' && (
            <button
              type="button"
              onClick={() => onConnectAction(profile.id, 'mutual')}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-[#0F5C4D] text-white hover:bg-[#0B473B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Agree & Open Chat
            </button>
          )}

          {connectionState === 'sent' && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A6270] whitespace-nowrap">
                <Lock className="w-3.5 h-3.5" />
                Awaiting Agreement
              </span>
              <button
                type="button"
                onClick={() => onConnectAction(profile.id, 'none')}
                className="px-3 py-1.5 text-xs font-medium text-[#5A6270] hover:text-[#14191F] border border-stone-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Withdraw
              </button>
            </div>
          )}

          {connectionState === 'mutual' && (
            <button
              type="button"
              onClick={() => onOpenChat(profile.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-[#14191F] text-white hover:bg-[#262E38] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Open Chat
            </button>
          )}
        </div>
      </div>

      {connectionState === 'incoming' && (
        <p className="mt-2.5 text-xs font-medium text-[#0F5C4D]">
          {profile.name.split(' ')[0]} already agreed to connect — agree to unlock chat
        </p>
      )}
    </article>
  );
}
