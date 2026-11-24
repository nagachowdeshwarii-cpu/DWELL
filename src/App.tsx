import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { MessagesView } from './components/MessagesView';
import { ProfileVerificationModal } from './components/ProfileVerificationModal';
import { QuizView } from './components/QuizView';
import { RequestsView } from './components/RequestsView';
import { RoommateCard } from './components/RoommateCard';
import { ScoreBreakdownModal } from './components/ScoreBreakdownModal';
import {
  AVAILABLE_CITIES,
  DEFAULT_USER_PROFILE,
  INITIAL_CHATS,
  INITIAL_CONNECTION_STATES,
  ROOMMATE_PROFILES,
} from './data/roommates';
import {
  ActiveTab,
  ChatMessage,
  CompatibilityBreakdown,
  ConnectionState,
  DealBreakers,
  RoleType,
  RoommateProfile,
  UserProfile,
} from './types/dwell';
import {
  evaluateCompatibility,
  formatFoodLabel,
  formatSleepLabel,
} from './utils/compatibility';

const STORAGE_KEY_PROFILE = 'dwell_user_profile_v1';
const STORAGE_KEY_CONNECTIONS = 'dwell_connections_v1';
const STORAGE_KEY_CHATS = 'dwell_chats_v1';

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    loadStored(STORAGE_KEY_PROFILE, DEFAULT_USER_PROFILE)
  );
  const [connectionStates, setConnectionStates] = useState<
    Record<string, ConnectionState>
  >(() => loadStored(STORAGE_KEY_CONNECTIONS, INITIAL_CONNECTION_STATES));
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(() =>
    loadStored(STORAGE_KEY_CHATS, INITIAL_CHATS)
  );

  // Filters & UI state
  const [roleFilter, setRoleFilter] = useState<'All' | RoleType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'budget'>('score');
  const [showExcluded, setShowExcluded] = useState(false);
  const [breakdownProfile, setBreakdownProfile] =
    useState<RoommateProfile | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [notice, setNotice] = useState<{
    text: string;
    chatId?: string;
  } | null>(null);

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(userProfile));
    } catch {
      // Ignore storage quota errors
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_CONNECTIONS,
        JSON.stringify(connectionStates)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [connectionStates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
    } catch {
      // Ignore storage quota errors
    }
  }, [chats]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const compatibilityMap = useMemo(() => {
    const map: Record<string, CompatibilityBreakdown> = {};
    for (const candidate of ROOMMATE_PROFILES) {
      map[candidate.id] = evaluateCompatibility(userProfile, candidate);
    }
    return map;
  }, [userProfile]);

  const incomingCount = useMemo(
    () =>
      Object.values(connectionStates).filter((state) => state === 'incoming')
        .length,
    [connectionStates]
  );

  const mutualCount = useMemo(
    () =>
      Object.values(connectionStates).filter((state) => state === 'mutual')
        .length,
    [connectionStates]
  );

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = ROOMMATE_PROFILES.filter((person) => {
      if (connectionStates[person.id] === 'declined') return false;
      if (
        userProfile.targetCity !== 'All Cities' &&
        person.city !== userProfile.targetCity
      ) {
        return false;
      }
      if (roleFilter !== 'All' && person.role !== roleFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          person.name,
          person.city,
          person.institution,
          ...person.neighborhoods,
          ...person.languages,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const eligibleCount = matched.filter(
      (p) => compatibilityMap[p.id].dealBreakerResult.passed
    ).length;
    const excludedCount = matched.length - eligibleCount;

    const visible = showExcluded
      ? matched
      : matched.filter((p) => compatibilityMap[p.id].dealBreakerResult.passed);

    const sorted = [...visible].sort((a, b) => {
      const aPassed = compatibilityMap[a.id].dealBreakerResult.passed;
      const bPassed = compatibilityMap[b.id].dealBreakerResult.passed;
      if (aPassed !== bPassed) return aPassed ? -1 : 1;

      if (sortBy === 'budget') {
        return a.monthlyBudgetUsd - b.monthlyBudgetUsd;
      }
      return (
        compatibilityMap[b.id].overallScore -
        compatibilityMap[a.id].overallScore
      );
    });

    return { sorted, excludedCount };
  }, [
    connectionStates,
    userProfile.targetCity,
    roleFilter,
    searchQuery,
    showExcluded,
    sortBy,
    compatibilityMap,
  ]);

  const handleToggleDealBreaker = (key: keyof DealBreakers) => {
    setUserProfile((prev) => ({
      ...prev,
      dealBreakers: {
        ...prev.dealBreakers,
        [key]: !prev.dealBreakers[key],
      },
    }));
  };

  const handleConnectAction = (
    profileId: string,
    nextState: ConnectionState
  ) => {
    const target = ROOMMATE_PROFILES.find((p) => p.id === profileId);
    setConnectionStates((prev) => ({ ...prev, [profileId]: nextState }));

    if (nextState === 'mutual' && target) {
      setNotice({
        text: `Both you and ${target.name} agreed — chat is now open.`,
        chatId: profileId,
      });
    } else if (nextState === 'sent' && target) {
      const score = compatibilityMap[profileId]?.overallScore ?? 0;
      const passed = compatibilityMap[profileId]?.dealBreakerResult.passed;
      setNotice({
        text: `Connection request sent to ${target.name}. Chat stays locked until they agree.`,
      });

      // High-compatibility matches respond affirmatively so users can test full mutual-consent flow
      if (score >= 72 && passed) {
        const timerId = window.setTimeout(() => {
          setConnectionStates((curr) => {
            if (curr[profileId] !== 'sent') return curr;
            return { ...curr, [profileId]: 'mutual' };
          });
          setChats((currChats) => {
            if (currChats[profileId]?.length) return currChats;
            const greeting: ChatMessage = {
              id: `greet-${Date.now()}`,
              sender: 'them',
              text:
                target.autoReplyHints[0] ??
                `Hi! Glad we both agreed to connect—happy to chat about ${target.city}.`,
              timestamp: 'Just now',
            };
            return { ...currChats, [profileId]: [greeting] };
          });
          setNotice({
            text: `${target.name} agreed to connect — chat is now open.`,
            chatId: profileId,
          });
        }, 2200);
        timersRef.current.push(timerId);
      }
    }
  };

  const handleOpenChat = (profileId: string) => {
    setSelectedChatId(profileId);
    setActiveTab('messages');
    setNotice(null);
  };

  const handleSendMessage = (profileId: string, text: string) => {
    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const myMsg: ChatMessage = {
      id: `me-${Date.now()}`,
      sender: 'me',
      text,
      timestamp: nowLabel,
    };

    setChats((prev) => {
      const existing = prev[profileId] ?? [];
      return {
        ...prev,
        [profileId]: [...existing, myMsg],
      };
    });

    const target = ROOMMATE_PROFILES.find((p) => p.id === profileId);
    if (target) {
      const timerId = window.setTimeout(() => {
        setChats((prev) => {
          const thread = prev[profileId] ?? [];
          const replyIndex =
            thread.filter((m) => m.sender === 'them').length %
            target.autoReplyHints.length;
          const replyText = target.autoReplyHints[replyIndex];
          const replyMsg: ChatMessage = {
            id: `them-${Date.now()}`,
            sender: 'them',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          return {
            ...prev,
            [profileId]: [...thread, replyMsg],
          };
        });
      }, 900);
      timersRef.current.push(timerId);
    }
  };

  const handleResetFilters = () => {
    setUserProfile((prev) => ({ ...prev, targetCity: 'All Cities' }));
    setRoleFilter('All');
    setSearchQuery('');
    setShowExcluded(false);
  };

  const dealBreakerItems: { key: keyof DealBreakers; label: string }[] = [
    { key: 'noSmoking', label: 'No Smoking' },
    { key: 'vegetarianKitchenOnly', label: 'Vegetarian Kitchen Only' },
    { key: 'noPets', label: 'No Pets' },
    { key: 'quietAfterEleven', label: 'Quiet Hours After 11 PM' },
    { key: 'verifiedOnly', label: 'Face & ID Verified Only' },
    { key: 'sameGenderOnly', label: 'Same Gender Only' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F8] text-[#14191F]">
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setNotice(null);
        }}
        incomingCount={incomingCount}
        unreadChatCount={mutualCount}
        isVerified={userProfile.verified}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Contextual Notice Banner */}
      {notice && (
        <div className="bg-[#14191F] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 text-xs sm:text-sm">
            <span>{notice.text}</span>
            <div className="flex items-center gap-3 shrink-0">
              {notice.chatId && (
                <button
                  type="button"
                  onClick={() => handleOpenChat(notice.chatId!)}
                  className="font-semibold underline underline-offset-4 hover:text-stone-200 cursor-pointer whitespace-nowrap"
                >
                  Open Chat
                </button>
              )}
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss notice"
                className="p-1 text-stone-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeTab === 'discover' && (
          <>
            {/* Hero Section */}
            <section className="bg-white border-b border-stone-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                  <div className="lg:col-span-7 flex flex-col justify-center">
                    <p className="text-xs sm:text-sm font-medium text-[#0F5C4D]">
                      For students & freshers moving to a new city
                    </p>
                    <h1
                      className="mt-2.5 font-bold tracking-tight text-[#14191F] leading-[1.08] text-balance"
                      style={{ fontSize: 'clamp(2.15rem, 3.6vw, 3.35rem)' }}
                    >
                      Find a roommate who actually fits how you live.
                    </h1>
                    <p className="mt-4 text-base text-[#5A6270] max-w-xl leading-relaxed">
                      Dwell matches roommates by sleep schedule, cleanliness,
                      food habits, culture, and language. Set strict
                      deal-breakers, verify your profile, and chat only when
                      both people agree.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setActiveTab('quiz')}
                        className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0F5C4D] text-white hover:bg-[#0B473B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {userProfile.quizCompleted
                          ? 'Update Lifestyle Quiz'
                          : 'Take 60-Second Quiz'}
                      </button>
                      <a
                        href="#matches-workspace"
                        className="px-4 py-2.5 text-sm font-medium text-[#14191F] hover:text-[#0F5C4D] underline underline-offset-4 decoration-stone-300 transition-colors whitespace-nowrap shrink-0"
                      >
                        Browse Ranked Matches
                      </a>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="h-64 sm:h-72 lg:h-full min-h-[260px] rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                      <img
                        src="/src/assets/images/hero_shared_apartment_1795525435819.jpg"
                        alt="Students and young professionals studying and sharing tea in a sunlit modern apartment"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Full-Width 4-Column Trust & Mechanism Strip */}
                <div className="mt-8 pt-6 border-t border-stone-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm font-semibold text-[#14191F]">
                      4-Factor Compatibility
                    </div>
                    <p className="text-xs text-[#5A6270] mt-1">
                      Sleep, cleanliness, food habits & spoken languages
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#14191F]">
                      Hard Deal-Breakers
                    </div>
                    <p className="text-xs text-[#5A6270] mt-1">
                      Instant filtering for non-smoking, diet, pets & quiet hours
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#14191F]">
                      Face & ID Verified
                    </div>
                    <p className="text-xs text-[#5A6270] mt-1">
                      Live face recognition, university email & photo ID checks
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#14191F]">
                      Mutual-Consent Chat
                    </div>
                    <p className="text-xs text-[#5A6270] mt-1">
                      Messaging opens strictly after both people agree
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Discovery & Deal-Breaker Workspace */}
            <section
              id="matches-workspace"
              className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10"
            >
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Sidebar: City, Role, Deal-Breakers, Quiz Summary */}
                <aside className="w-full lg:w-[280px] shrink-0 space-y-6">
                  <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#14191F]">
                        Filters & Deal-Breakers
                      </h2>
                      <SlidersHorizontal
                        className="w-4 h-4 text-[#5A6270]"
                        aria-hidden="true"
                      />
                    </div>

                    {/* City Selector */}
                    <label className="block text-xs">
                      <span className="font-semibold text-[#14191F]">
                        Destination City
                      </span>
                      <select
                        value={userProfile.targetCity}
                        onChange={(e) =>
                          setUserProfile((prev) => ({
                            ...prev,
                            targetCity: e.target.value,
                          }))
                        }
                        className="mt-1.5 w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
                      >
                        {AVAILABLE_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Role Segmented Control */}
                    <div>
                      <span className="block text-xs font-semibold text-[#14191F]">
                        Roommate Type
                      </span>
                      <div className="mt-1.5 grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-lg">
                        {(['All', 'Student', 'Fresher'] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRoleFilter(r)}
                            className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                              roleFilter === r
                                ? 'bg-white text-[#14191F] shadow-xs'
                                : 'text-[#5A6270] hover:text-[#14191F]'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Deal-Breaker Toggles */}
                    <div className="pt-4 border-t border-stone-100">
                      <span className="block text-xs font-semibold text-[#14191F]">
                        Hard Deal-Breakers
                      </span>
                      <p className="text-xs text-[#5A6270] mt-0.5">
                        Automatically hide incompatible profiles
                      </p>

                      <div className="mt-3 space-y-2.5">
                        {dealBreakerItems.map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2.5 text-sm text-[#14191F] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={userProfile.dealBreakers[item.key]}
                              onChange={() =>
                                handleToggleDealBreaker(item.key)
                              }
                              className="w-4 h-4 accent-[#0F5C4D] rounded"
                            />
                            <span className="text-xs sm:text-sm">
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>

                      {filteredResults.excludedCount > 0 && (
                        <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                          <p className="text-xs text-[#5A6270] tabular-nums">
                            {filteredResults.excludedCount} profile
                            {filteredResults.excludedCount === 1 ? '' : 's'}{' '}
                            excluded by your deal-breakers
                          </p>
                          <label className="flex items-center gap-2 text-xs font-medium text-[#0F5C4D] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showExcluded}
                              onChange={(e) =>
                                setShowExcluded(e.target.checked)
                              }
                              className="w-3.5 h-3.5 accent-[#0F5C4D] rounded"
                            />
                            Show excluded profiles
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Quiz Snapshot */}
                  <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-sm font-bold text-[#14191F]">
                        Your Match Baseline
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('quiz')}
                        className="text-xs font-medium text-[#0F5C4D] hover:underline underline-offset-4 cursor-pointer"
                      >
                        Edit Quiz
                      </button>
                    </div>
                    <dl className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#5A6270]">Sleep</dt>
                        <dd className="font-medium text-[#14191F] text-right">
                          {formatSleepLabel(userProfile.sleepSchedule).split(' (')[0]}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#5A6270]">Cleanliness</dt>
                        <dd className="font-medium text-[#14191F] tabular-nums">
                          {userProfile.cleanliness}/5
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#5A6270]">Food</dt>
                        <dd className="font-medium text-[#14191F]">
                          {formatFoodLabel(userProfile.foodHabit)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#5A6270]">Languages</dt>
                        <dd className="font-medium text-[#14191F] text-right truncate max-w-[150px]">
                          {userProfile.languages.join(', ')}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </aside>

                {/* Main Match Feed */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-[#5A6270] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by city, language, university, or area..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm text-[#14191F] placeholder:text-[#5A6270] focus:outline-none focus:border-[#0F5C4D]"
                      />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-[#5A6270] tabular-nums">
                        {filteredResults.sorted.length} match
                        {filteredResults.sorted.length === 1 ? '' : 'es'}
                      </span>
                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as 'score' | 'budget')
                        }
                        aria-label="Sort roommates"
                        className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs sm:text-sm font-medium text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
                      >
                        <option value="score">Highest Compatibility</option>
                        <option value="budget">Budget: Low to High</option>
                      </select>
                    </div>
                  </div>

                  {filteredResults.sorted.length === 0 ? (
                    <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
                      <h3 className="text-lg font-semibold text-[#14191F]">
                        No roommates match these exact filters
                      </h3>
                      <p className="text-sm text-[#5A6270] mt-1.5 max-w-md mx-auto">
                        Try switching destination city to All Cities, toggling
                        "Show excluded profiles", or adjusting a deal-breaker.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-5 px-4 py-2 text-sm font-medium bg-[#0F5C4D] text-white rounded-lg hover:bg-[#0B473B] transition-colors cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      {filteredResults.sorted.map((person) => (
                        <RoommateCard
                          key={person.id}
                          profile={person}
                          compatibility={compatibilityMap[person.id]}
                          connectionState={connectionStates[person.id] ?? 'none'}
                          onViewBreakdown={setBreakdownProfile}
                          onConnectAction={handleConnectAction}
                          onOpenChat={handleOpenChat}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'quiz' && (
          <QuizView
            profile={userProfile}
            onSaveQuiz={(updated) => {
              setUserProfile(updated);
              setActiveTab('discover');
              setNotice({
                text: 'Compatibility scores recalculated from your updated quiz answers.',
              });
            }}
            onCancel={() => setActiveTab('discover')}
          />
        )}

        {activeTab === 'requests' && (
          <RequestsView
            profiles={ROOMMATE_PROFILES}
            compatibilityMap={compatibilityMap}
            connectionStates={connectionStates}
            onConnectAction={handleConnectAction}
            onOpenChat={handleOpenChat}
            onGoToDiscover={() => setActiveTab('discover')}
          />
        )}

        {activeTab === 'messages' && (
          <MessagesView
            profiles={ROOMMATE_PROFILES}
            compatibilityMap={compatibilityMap}
            connectionStates={connectionStates}
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            onSendMessage={handleSendMessage}
            onConnectAction={handleConnectAction}
            onGoToDiscover={() => setActiveTab('discover')}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-white border-t border-stone-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5A6270]">
          <div className="flex items-center gap-3">
            <span
              className="font-bold text-sm text-[#14191F]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Dwell
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Verified roommate matching by lifestyle, culture & language
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className="hover:text-[#14191F] cursor-pointer"
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className="hover:text-[#14191F] cursor-pointer"
            >
              Lifestyle Quiz
            </button>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="hover:text-[#14191F] cursor-pointer"
            >
              Profile Verification
            </button>
          </div>
        </div>
      </footer>

      {/* Score Breakdown Modal */}
      <ScoreBreakdownModal
        profile={breakdownProfile}
        compatibility={
          breakdownProfile ? compatibilityMap[breakdownProfile.id] : null
        }
        connectionState={
          breakdownProfile ? connectionStates[breakdownProfile.id] ?? 'none' : 'none'
        }
        onClose={() => setBreakdownProfile(null)}
        onConnectAction={handleConnectAction}
        onOpenChat={handleOpenChat}
      />

      {/* User Profile & Verification Modal */}
      <ProfileVerificationModal
        isOpen={isProfileModalOpen}
        profile={userProfile}
        onClose={() => setIsProfileModalOpen(false)}
        onVerify={(payload) => {
          setUserProfile((prev) => ({
            ...prev,
            verified: true,
            verificationMethod: payload.verificationMethod,
            avatarUrl: payload.avatarUrl ?? prev.avatarUrl,
            faceVerified: payload.faceVerified ?? prev.faceVerified,
            faceConfidence: payload.faceConfidence ?? prev.faceConfidence,
            verificationChecks:
              payload.verificationChecks ?? prev.verificationChecks,
          }));
          setNotice({
            text: `Your Dwell profile is now verified (${payload.verificationMethod}).`,
          });
        }}
        onEditQuiz={() => setActiveTab('quiz')}
      />
    </div>
  );
}
