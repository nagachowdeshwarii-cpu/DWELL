import { CheckCircle2, Lock, Send } from 'lucide-react';
import { useState } from 'react';
import {
  ChatMessage,
  CompatibilityBreakdown,
  ConnectionState,
  RoommateProfile,
} from '../types/dwell';
import { Avatar } from './Avatar';

interface MessagesViewProps {
  profiles: RoommateProfile[];
  compatibilityMap: Record<string, CompatibilityBreakdown>;
  connectionStates: Record<string, ConnectionState>;
  chats: Record<string, ChatMessage[]>;
  selectedChatId: string | null;
  onSelectChat: (profileId: string) => void;
  onSendMessage: (profileId: string, text: string) => void;
  onConnectAction: (profileId: string, nextState: ConnectionState) => void;
  onGoToDiscover: () => void;
}

const STARTER_PROMPTS = [
  'Which neighborhoods are you focusing on?',
  'Are you looking to sign a 2BHK together?',
  'Do our move-in dates line up?',
];

export function MessagesView({
  profiles,
  compatibilityMap,
  connectionStates,
  chats,
  selectedChatId,
  onSelectChat,
  onSendMessage,
  onConnectAction,
  onGoToDiscover,
}: MessagesViewProps) {
  const [draft, setDraft] = useState('');

  const mutualProfiles = profiles.filter(
    (p) => connectionStates[p.id] === 'mutual'
  );
  const pendingProfiles = profiles.filter(
    (p) =>
      connectionStates[p.id] === 'sent' || connectionStates[p.id] === 'incoming'
  );

  const visibleList = [...mutualProfiles, ...pendingProfiles];
  const activeProfile =
    visibleList.find((p) => p.id === selectedChatId) ?? visibleList[0] ?? null;

  const activeState = activeProfile
    ? connectionStates[activeProfile.id]
    : 'none';
  const activeMessages = activeProfile ? chats[activeProfile.id] ?? [] : [];
  const activeScore = activeProfile
    ? compatibilityMap[activeProfile.id]?.overallScore ?? 80
    : 0;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || activeState !== 'mutual') return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendMessage(activeProfile.id, trimmed);
    setDraft('');
  };

  if (visibleList.length === 0) {
    return (
      <section className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-white border border-stone-200 rounded-xl p-10">
          <Lock className="w-8 h-8 text-[#5A6270] mx-auto" />
          <h1 className="text-2xl font-bold text-[#14191F] mt-4">
            No unlocked conversations yet
          </h1>
          <p className="text-sm text-[#5A6270] mt-2 max-w-md mx-auto">
            On Dwell, chat stays private and locked until both people agree to
            connect. Agree to an incoming request or send one from Discover.
          </p>
          <button
            type="button"
            onClick={onGoToDiscover}
            className="mt-6 px-5 py-2.5 text-sm font-medium bg-[#0F5C4D] text-white rounded-lg hover:bg-[#0B473B] transition-colors cursor-pointer"
          >
            Browse Roommates
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-[300px_1fr] min-h-[560px]">
        {/* Left Thread List */}
        <aside className="border-b md:border-b-0 md:border-r border-stone-200 bg-stone-50/40">
          <div className="px-5 py-4 border-b border-stone-200">
            <h1 className="text-base font-bold text-[#14191F]">Messages</h1>
            <p className="text-xs text-[#5A6270] mt-0.5">
              Opens only when both people agree
            </p>
          </div>

          <div className="divide-y divide-stone-100">
            {visibleList.map((person) => {
              const state = connectionStates[person.id];
              const isMutual = state === 'mutual';
              const isSelected = activeProfile?.id === person.id;
              const thread = chats[person.id] ?? [];
              const lastMsg = thread[thread.length - 1];

              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onSelectChat(person.id)}
                  className={`w-full text-left px-5 py-4 flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-white' : 'hover:bg-white/70'
                  }`}
                >
                  <Avatar
                    name={person.name}
                    src={person.avatarUrl}
                    sizeClass="w-10 h-10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#14191F] truncate">
                        {person.name}
                      </span>
                      {!isMutual && (
                        <Lock
                          className="w-3.5 h-3.5 text-[#5A6270] shrink-0"
                          aria-label="Locked until mutual agreement"
                        />
                      )}
                    </div>
                    <p className="text-xs text-[#5A6270] truncate mt-0.5">
                      {isMutual
                        ? lastMsg?.text ?? 'Mutual match — say hello'
                        : state === 'incoming'
                        ? 'Agree to unlock chat'
                        : 'Waiting for their agreement'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Conversation Pane */}
        {activeProfile && (
          <div className="flex flex-col justify-between bg-white">
            {/* Thread Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  name={activeProfile.name}
                  src={activeProfile.avatarUrl}
                  sizeClass="w-11 h-11"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-[#14191F] truncate">
                      {activeProfile.name}
                    </h2>
                    {activeProfile.verified && (
                      <CheckCircle2 className="w-4 h-4 text-[#0F5C4D] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#5A6270] truncate tabular-nums">
                    {activeProfile.city} · {activeScore}% match · $
                    {activeProfile.monthlyBudgetUsd}/mo
                  </p>
                </div>
              </div>

              <span className="text-xs font-medium text-[#5A6270] whitespace-nowrap">
                {activeState === 'mutual'
                  ? 'Mutual Agreement Confirmed'
                  : 'Consent Gate Locked'}
              </span>
            </div>

            {/* Body */}
            {activeState !== 'mutual' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-[#14191F]">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#14191F] mt-4">
                  Chat opens only when both people agree
                </h3>
                <p className="text-sm text-[#5A6270] mt-2 max-w-md">
                  {activeState === 'incoming'
                    ? `${activeProfile.name} already agreed to connect with you. Agree below to open your private chat.`
                    : `You agreed to connect with ${activeProfile.name}. Messaging stays locked until ${activeProfile.name.split(' ')[0]} also agrees.`}
                </p>

                <div className="mt-5 flex items-center gap-6 text-xs text-[#5A6270]">
                  <span>
                    Your agreement:{' '}
                    <strong className="text-[#14191F]">
                      {activeState === 'sent' ? 'Confirmed' : 'Pending'}
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {activeProfile.name.split(' ')[0]}’s agreement:{' '}
                    <strong className="text-[#14191F]">
                      {activeState === 'incoming' ? 'Confirmed' : 'Pending'}
                    </strong>
                  </span>
                </div>

                {activeState === 'incoming' && (
                  <button
                    type="button"
                    onClick={() => onConnectAction(activeProfile.id, 'mutual')}
                    className="mt-6 px-5 py-2.5 text-sm font-medium bg-[#0F5C4D] text-white rounded-lg hover:bg-[#0B473B] transition-colors cursor-pointer"
                  >
                    Agree & Unlock Chat
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[420px]">
                  {activeMessages.length === 0 && (
                    <p className="text-sm text-[#5A6270] text-center py-8">
                      Both of you agreed to connect. Start coordinating move-in
                      dates, neighborhoods, and apartment tours.
                    </p>
                  )}

                  {activeMessages.map((msg) => {
                    const isMe = msg.sender === 'me';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMe ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-[#0F5C4D] text-white'
                              : 'bg-stone-100 text-[#14191F]'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[11px] text-[#5A6270] mt-1 tabular-nums">
                          {isMe ? 'You' : activeProfile.name.split(' ')[0]} ·{' '}
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Quick conversation starters + Input */}
                <div className="border-t border-stone-200 p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => onSendMessage(activeProfile.id, prompt)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-[#3F4752] hover:border-[#0F5C4D] hover:text-[#0F5C4D] transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSend} className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Message ${activeProfile.name.split(' ')[0]}...`}
                      className="flex-1 px-4 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#0F5C4D]"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-[#0F5C4D] text-white rounded-lg hover:bg-[#0B473B] transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
