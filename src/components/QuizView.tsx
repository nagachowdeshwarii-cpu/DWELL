import { useState } from 'react';
import { AVAILABLE_CITIES, AVAILABLE_LANGUAGES } from '../data/roommates';
import {
  FoodHabit,
  GenderType,
  PetStatus,
  RoleType,
  SleepSchedule,
  SmokingStatus,
  SocialVibe,
  UserProfile,
} from '../types/dwell';

interface QuizViewProps {
  profile: UserProfile;
  onSaveQuiz: (updated: UserProfile) => void;
  onCancel: () => void;
}

export function QuizView({ profile, onSaveQuiz, onCancel }: QuizViewProps) {
  const [draft, setDraft] = useState<UserProfile>({
    ...profile,
    dealBreakers: { ...profile.dealBreakers },
    languages: [...profile.languages],
  });

  const toggleLanguage = (lang: string) => {
    setDraft((prev) => {
      const exists = prev.languages.includes(lang);
      if (exists && prev.languages.length === 1) return prev; // Keep at least 1 language
      return {
        ...prev,
        languages: exists
          ? prev.languages.filter((l) => l !== lang)
          : [...prev.languages, lang],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveQuiz({ ...draft, quizCompleted: true });
  };

  return (
    <section className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-medium text-[#0F5C4D]">
          Compatibility Quiz · Takes 60 seconds
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#14191F] mt-1.5 text-balance">
          Tell Dwell how you live, eat, and communicate
        </h1>
        <p className="text-sm sm:text-base text-[#5A6270] mt-2 leading-relaxed">
          Your answers score every verified roommate from 0–99% across sleep,
          cleanliness, food habits, and language, while deal-breakers filter out
          non-negotiables automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 01. Relocation & Basics */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-7 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-[#14191F]">
              01. Moving Details
            </h2>
            <p className="text-xs text-[#5A6270] mt-0.5">
              Where and when you are relocating
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="font-medium text-[#14191F]">Your Name</span>
              <input
                type="text"
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-[#14191F]">Target City</span>
              <select
                value={draft.targetCity}
                onChange={(e) =>
                  setDraft({ ...draft, targetCity: e.target.value })
                }
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
              >
                {AVAILABLE_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-[#14191F]">Role</span>
              <select
                value={draft.role}
                onChange={(e) =>
                  setDraft({ ...draft, role: e.target.value as RoleType })
                }
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
              >
                <option value="Student">Student</option>
                <option value="Fresher">Fresher (New Grad)</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-[#14191F]">Gender Identity</span>
              <select
                value={draft.gender}
                onChange={(e) =>
                  setDraft({ ...draft, gender: e.target.value as GenderType })
                }
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
              >
                <option value="Woman">Woman</option>
                <option value="Man">Man</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-[#14191F]">
                University or Employer
              </span>
              <input
                type="text"
                value={draft.institution}
                onChange={(e) =>
                  setDraft({ ...draft, institution: e.target.value })
                }
                placeholder="e.g., IISc Bengaluru or Incoming Software Engineer"
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
              />
            </label>
          </div>
        </div>

        {/* 02. Sleep & Cleanliness */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-7 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[#14191F]">
              02. Sleep & Cleanliness
            </h2>
            <p className="text-xs text-[#5A6270] mt-0.5">
              Daily rhythm and shared apartment upkeep
            </p>
          </div>

          <div>
            <span className="block text-sm font-medium text-[#14191F]">
              Typical Sleep Schedule
            </span>
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  {
                    value: 'early',
                    title: 'Early Bird',
                    desc: 'Asleep before 11:00 PM',
                  },
                  {
                    value: 'balanced',
                    title: 'Balanced',
                    desc: '11:00 PM – 12:30 AM',
                  },
                  {
                    value: 'night',
                    title: 'Night Owl',
                    desc: 'Awake past 12:30 AM',
                  },
                ] as { value: SleepSchedule; title: string; desc: string }[]
              ).map((option) => {
                const selected = draft.sleepSchedule === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, sleepSchedule: option.value })
                    }
                    className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#0F5C4D] bg-[#0F5C4D]/5'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#14191F]">
                      {option.title}
                    </div>
                    <div className="text-xs text-[#5A6270] mt-0.5">
                      {option.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-[#14191F]">
                Cleanliness Standard
              </span>
              <span className="text-xs font-mono font-medium text-[#0F5C4D] tabular-nums">
                {draft.cleanliness} / 5
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDraft({ ...draft, cleanliness: level })}
                  className={`py-2.5 px-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer tabular-nums ${
                    draft.cleanliness === level
                      ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white'
                      : 'border-stone-200 text-[#14191F] hover:border-stone-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-[#5A6270] mt-1.5">
              <span>Relaxed</span>
              <span>Moderately tidy</span>
              <span>Spotless daily</span>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.quietAfterEleven}
              onChange={(e) =>
                setDraft({ ...draft, quietAfterEleven: e.target.checked })
              }
              className="w-4 h-4 accent-[#0F5C4D] rounded"
            />
            <span className="text-sm text-[#14191F]">
              Prefer quiet hours after 11:00 PM on weekdays
            </span>
          </label>
        </div>

        {/* 03. Food Habits, Culture & Language */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-7 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[#14191F]">
              03. Food Habits, Culture & Language
            </h2>
            <p className="text-xs text-[#5A6270] mt-0.5">
              Kitchen comfort and languages you feel at home speaking
            </p>
          </div>

          <div>
            <span className="block text-sm font-medium text-[#14191F]">
              Food Habit
            </span>
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(
                [
                  { value: 'vegetarian', label: 'Vegetarian' },
                  { value: 'eggetarian', label: 'Eggetarian' },
                  { value: 'non-veg', label: 'Non-Vegetarian' },
                  { value: 'vegan', label: 'Vegan' },
                ] as { value: FoodHabit; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, foodHabit: opt.value })}
                  className={`py-2.5 px-3 rounded-lg border text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    draft.foodHabit === opt.value
                      ? 'border-[#0F5C4D] bg-[#0F5C4D]/5 text-[#0F5C4D]'
                      : 'border-stone-200 text-[#14191F] hover:border-stone-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="font-medium text-[#14191F]">
                Cooking Frequency
              </span>
              <select
                value={draft.cookingFrequency}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    cookingFrequency: e.target.value as
                      | 'daily'
                      | 'weekly'
                      | 'rarely',
                  })
                }
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
              >
                <option value="daily">Cook daily</option>
                <option value="weekly">Few times a week</option>
                <option value="rarely">Mostly order / meal prep</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-[#14191F]">
                Home Social Vibe
              </span>
              <select
                value={draft.socialVibe}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    socialVibe: e.target.value as SocialVibe,
                  })
                }
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
              >
                <option value="quiet">Quiet & independent</option>
                <option value="balanced">Balanced · Occasional meals</option>
                <option value="social">Social · Friends & weekend hangouts</option>
              </select>
            </label>
          </div>

          <div>
            <span className="block text-sm font-medium text-[#14191F]">
              Languages Spoken (select all that apply)
            </span>
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const active = draft.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white'
                        : 'border-stone-200 text-[#14191F] hover:border-stone-300'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 04. Habits & Hard Deal-Breakers */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-7 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[#14191F]">
              04. Habits & Hard Deal-Breakers
            </h2>
            <p className="text-xs text-[#5A6270] mt-0.5">
              Roommates violating active deal-breakers are excluded from your
              matches
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="font-medium text-[#14191F]">Your Smoking</span>
              <select
                value={draft.smoking}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    smoking: e.target.value as SmokingStatus,
                  })
                }
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
              >
                <option value="non-smoker">Non-smoker</option>
                <option value="outside-only">Occasional / Outside only</option>
                <option value="smoker">Smoker</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-[#14191F]">Pets</span>
              <select
                value={draft.pets}
                onChange={(e) =>
                  setDraft({ ...draft, pets: e.target.value as PetStatus })
                }
                className="mt-1.5 w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-[#14191F] focus:outline-none focus:border-[#0F5C4D]"
              >
                <option value="no-pets">No pets</option>
                <option value="pet-friendly">Pet-friendly</option>
                <option value="has-pet">Bringing a pet</option>
              </select>
            </label>
          </div>

          <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { key: 'noSmoking', label: 'No Smoking (strict)' },
                {
                  key: 'vegetarianKitchenOnly',
                  label: 'Vegetarian / Vegan Kitchen Only',
                },
                { key: 'noPets', label: 'No Pets in Apartment' },
                {
                  key: 'quietAfterEleven',
                  label: 'Quiet Hours After 11:00 PM',
                },
                { key: 'verifiedOnly', label: 'Verified ID Profiles Only' },
                { key: 'sameGenderOnly', label: 'Same Gender Roommates Only' },
              ] as {
                key: keyof UserProfile['dealBreakers'];
                label: string;
              }[]
            ).map((rule) => (
              <label
                key={rule.key}
                className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:border-stone-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={draft.dealBreakers[rule.key]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      dealBreakers: {
                        ...draft.dealBreakers,
                        [rule.key]: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 accent-[#0F5C4D] rounded"
                />
                <span className="text-sm font-medium text-[#14191F]">
                  {rule.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-[#5A6270] hover:text-[#14191F] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-[#0F5C4D] text-white hover:bg-[#0B473B] transition-colors cursor-pointer"
          >
            Save & Rank My Matches
          </button>
        </div>
      </form>
    </section>
  );
}
