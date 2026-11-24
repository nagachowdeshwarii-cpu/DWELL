import { ActiveTab } from '../types/dwell';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  incomingCount: number;
  unreadChatCount: number;
  isVerified: boolean;
  onOpenProfileModal: () => void;
}

export function Header({
  activeTab,
  onSelectTab,
  incomingCount,
  unreadChatCount,
  isVerified,
  onOpenProfileModal,
}: HeaderProps) {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'discover', label: 'Discover' },
    { id: 'quiz', label: 'Lifestyle Quiz' },
    {
      id: 'requests',
      label: incomingCount > 0 ? `Requests (${incomingCount})` : 'Requests',
    },
    {
      id: 'messages',
      label: unreadChatCount > 0 ? `Messages (${unreadChatCount})` : 'Messages',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('discover')}
          className="text-xl font-bold tracking-tight text-[#14191F] hover:text-[#0F5C4D] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F5C4D]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Dwell
        </button>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-5 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F5C4D] ${
                  isActive
                    ? 'text-[#0F5C4D] font-semibold'
                    : 'text-[#5A6270] hover:text-[#14191F]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0F5C4D]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenProfileModal}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5C4D] ${
              isVerified
                ? 'bg-[#14191F] text-white hover:bg-[#262E38]'
                : 'bg-[#0F5C4D] text-white hover:bg-[#0B473B]'
            }`}
          >
            {isVerified ? 'My Profile' : 'Verify Profile'}
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row keeping sticky header <= 15% mobile height */}
      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden items-center justify-between px-4 border-t border-stone-100 overflow-x-auto"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-2.5 px-2 text-xs font-medium whitespace-nowrap shrink-0 tabular-nums border-b-2 transition-colors ${
                isActive
                  ? 'border-[#0F5C4D] text-[#0F5C4D] font-semibold'
                  : 'border-transparent text-[#5A6270]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
