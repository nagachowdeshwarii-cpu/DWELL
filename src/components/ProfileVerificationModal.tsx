import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { UserProfile } from '../types/dwell';

interface ProfileVerificationModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onVerify: (verificationMethod: string) => void;
  onEditQuiz: () => void;
}

export function ProfileVerificationModal({
  isOpen,
  profile,
  onClose,
  onVerify,
  onEditQuiz,
}: ProfileVerificationModalProps) {
  const [orgEmail, setOrgEmail] = useState('');
  const [idType, setIdType] = useState<'student-id' | 'offer-letter' | 'gov-id'>(
    'student-id'
  );
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = orgEmail.trim();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Enter a valid university (.edu / .ac) or company email address.');
      return;
    }
    const domain = email.split('@')[1];
    const idLabel =
      idType === 'student-id'
        ? 'Student ID'
        : idType === 'offer-letter'
        ? 'Offer Letter'
        : 'Govt ID';
    onVerify(`Verified via ${domain} + ${idLabel}`);
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-profile-title"
    >
      <div className="bg-white border border-stone-200 rounded-xl max-w-lg w-full p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="verify-profile-title"
              className="text-xl font-bold text-[#14191F]"
            >
              {profile.name} · {profile.role}
            </h2>
            <p className="text-sm text-[#5A6270] mt-0.5">
              {profile.institution} · Moving to {profile.targetCity}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile dialog"
            className="p-2 text-[#5A6270] hover:text-[#14191F] rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 pt-5 border-t border-stone-200">
          {profile.verified ? (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[#0F5C4D]/5 border border-[#0F5C4D]/20">
              <CheckCircle2 className="w-5 h-5 text-[#0F5C4D] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-[#14191F]">
                  Profile Verified
                </div>
                <p className="text-xs text-[#3F4752] mt-0.5">
                  {profile.verificationMethod ??
                    'Verified Student / Fresher Identity'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-start gap-2.5 text-sm text-[#3F4752]">
                <ShieldCheck className="w-5 h-5 text-[#0F5C4D] shrink-0 mt-0.5" />
                <p>
                  Verify your university or employer email and ID document so
                  other roommates know your profile is authentic.
                </p>
              </div>

              <label className="block text-sm">
                <span className="font-medium text-[#14191F]">
                  University or Work Email
                </span>
                <input
                  type="email"
                  value={orgEmail}
                  onChange={(e) => {
                    setOrgEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="name@university.edu or name@company.com"
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#0F5C4D]"
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium text-[#14191F]">
                  Supporting Verification Document
                </span>
                <select
                  value={idType}
                  onChange={(e) =>
                    setIdType(
                      e.target.value as 'student-id' | 'offer-letter' | 'gov-id'
                    )
                  }
                  className="mt-1.5 w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#0F5C4D]"
                >
                  <option value="student-id">University Student ID Card</option>
                  <option value="offer-letter">Fresher Offer Letter</option>
                  <option value="gov-id">Government Photo ID</option>
                </select>
              </label>

              {error && <p className="text-xs text-[#B91C1C]">{error}</p>}

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold bg-[#0F5C4D] text-white rounded-lg hover:bg-[#0B473B] transition-colors cursor-pointer"
              >
                Complete Verification
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-stone-200 flex items-center justify-between text-xs text-[#5A6270]">
          <span>
            Languages: {profile.languages.join(', ')} · {profile.foodHabit}
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEditQuiz();
            }}
            className="font-medium text-[#0F5C4D] hover:underline underline-offset-4 cursor-pointer"
          >
            Edit Quiz Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
