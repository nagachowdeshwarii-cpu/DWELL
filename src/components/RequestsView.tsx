import { CheckCircle2, Lock, MessageSquare } from 'lucide-react';
import {
  CompatibilityBreakdown,
  ConnectionState,
  RoommateProfile,
} from '../types/dwell';
import { Avatar } from './Avatar';

interface RequestsViewProps {
  profiles: RoommateProfile[];
  compatibilityMap: Record<string, CompatibilityBreakdown>;
  connectionStates: Record<string, ConnectionState>;
  onConnectAction: (profileId: string, nextState: ConnectionState) => void;
  onOpenChat: (profileId: string) => void;
  onGoToDiscover: () => void;
}

export function RequestsView({
  profiles,
  compatibilityMap,
  connectionStates,
  onConnectAction,
  onOpenChat,
  onGoToDiscover,
}: RequestsViewProps) {
  const incoming = profiles.filter((p) => connectionStates[p.id] === 'incoming');
  const sent = profiles.filter((p) => connectionStates[p.id] === 'sent');
  const mutual = profiles.filter((p) => connectionStates[p.id] === 'mutual');

  return (
    <section className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#14191F]">
          Connection Requests
        </h1>
        <p className="text-sm text-[#5A6270] mt-1.5">
          On Dwell, messaging unlocks only when both people agree to connect.
        </p>
      </div>

      {/* Incoming Requests */}
      <div>
        <div className="flex items-baseline justify-between border-b border-stone-200 pb-3">
          <h2 className="text-lg font-semibold text-[#14191F]">
            Waiting for Your Agreement ({incoming.length})
          </h2>
          <span className="text-xs text-[#5A6270]">
            They agreed to connect with you
          </span>
        </div>

        {incoming.length === 0 ? (
          <div className="py-8 text-sm text-[#5A6270]">
            No pending incoming requests right now.{' '}
            <button
              type="button"
              onClick={onGoToDiscover}
              className="text-[#0F5C4D] font-medium underline underline-offset-4 cursor-pointer"
            >
              Browse compatible roommates
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-200 bg-white border border-stone-200 rounded-xl mt-4">
            {incoming.map((person) => {
              const score = compatibilityMap[person.id]?.overallScore ?? 80;
              return (
                <div
                  key={person.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar
                      name={person.name}
                      src={person.avatarUrl}
                      sizeClass="w-12 h-12"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#14191F]">
                          {person.name}, {person.age}
                        </span>
                        {person.verified && (
                          <CheckCircle2 className="w-4 h-4 text-[#0F5C4D]" />
                        )}
                        <span className="text-xs font-mono font-semibold text-[#0F5C4D] ml-1 tabular-nums">
                          · {score}% match
                        </span>
                      </div>
                      <p className="text-xs text-[#5A6270] mt-0.5">
                        {person.city} · {person.role} · {person.institution}
                      </p>
                      <p className="text-xs text-[#3F4752] mt-1.5">
                        Speaks {person.languages.join(', ')} ·{' '}
                        {person.foodHabit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onConnectAction(person.id, 'declined')}
                      className="px-3.5 py-2 text-xs font-medium text-[#5A6270] hover:text-[#14191F] border border-stone-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => onConnectAction(person.id, 'mutual')}
                      className="px-4 py-2 text-xs sm:text-sm font-medium bg-[#0F5C4D] text-white hover:bg-[#0B473B] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Agree & Open Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sent Requests */}
      <div>
        <div className="flex items-baseline justify-between border-b border-stone-200 pb-3">
          <h2 className="text-lg font-semibold text-[#14191F]">
            Sent Requests ({sent.length})
          </h2>
          <span className="text-xs text-[#5A6270]">
            Chat remains locked until they also agree
          </span>
        </div>

        {sent.length === 0 ? (
          <p className="py-6 text-sm text-[#5A6270]">
            You have no outgoing requests awaiting reply.
          </p>
        ) : (
          <div className="divide-y divide-stone-200 bg-white border border-stone-200 rounded-xl mt-4">
            {sent.map((person) => {
              const score = compatibilityMap[person.id]?.overallScore ?? 80;
              return (
                <div
                  key={person.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      name={person.name}
                      src={person.avatarUrl}
                      sizeClass="w-12 h-12"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#14191F]">
                          {person.name}, {person.age}
                        </span>
                        <span className="text-xs font-mono font-semibold text-[#0F5C4D] tabular-nums">
                          · {score}% match
                        </span>
                      </div>
                      <p className="text-xs text-[#5A6270] mt-0.5">
                        Your agreement: Confirmed · Their agreement: Pending
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#5A6270]">
                      <Lock className="w-3.5 h-3.5" />
                      Chat Locked
                    </span>
                    <button
                      type="button"
                      onClick={() => onConnectAction(person.id, 'none')}
                      className="px-3.5 py-2 text-xs font-medium text-[#5A6270] hover:text-[#14191F] border border-stone-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mutual Matches */}
      {mutual.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between border-b border-stone-200 pb-3">
            <h2 className="text-lg font-semibold text-[#14191F]">
              Mutual Connections ({mutual.length})
            </h2>
            <span className="text-xs text-[#0F5C4D] font-medium">
              Both agreed · Chat unlocked
            </span>
          </div>

          <div className="divide-y divide-stone-200 bg-white border border-stone-200 rounded-xl mt-4">
            {mutual.map((person) => (
              <div
                key={person.id}
                className="p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <Avatar
                    name={person.name}
                    src={person.avatarUrl}
                    sizeClass="w-11 h-11"
                  />
                  <div>
                    <div className="font-semibold text-[#14191F]">
                      {person.name}
                    </div>
                    <p className="text-xs text-[#5A6270]">
                      {person.city} · {person.institution}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenChat(person.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium bg-[#14191F] text-white hover:bg-[#262E38] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Open Chat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
