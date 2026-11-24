import { CheckCircle2, ScanFace, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { FaceVerificationChecks, UserProfile } from '../types/dwell';
import { Avatar } from './Avatar';
import { FaceVerificationCapture } from './FaceVerificationCapture';

interface ProfileVerificationModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onVerify: (payload: {
    verificationMethod: string;
    avatarUrl?: string;
    faceVerified?: boolean;
    faceConfidence?: number;
    verificationChecks?: FaceVerificationChecks;
  }) => void;
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
  const [error, setError] = useState('');
  const [emailVerifiedDomain, setEmailVerifiedDomain] = useState<string>('');

  if (!isOpen) return null;

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = orgEmail.trim();
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Enter a valid university (.edu / .ac) or company email address.');
      return;
    }
    const domain = email.split('@')[1];
    setEmailVerifiedDomain(domain);
    setError('');

    onVerify({
      verificationMethod: profile.faceVerified
        ? `Face Match + ${domain}`
        : `Email verified (${domain})`,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-profile-title"
    >
      <div className="bg-white border border-stone-200 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar
              name={profile.name}
              src={profile.avatarUrl}
              sizeClass="w-12 h-12"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h2
                  id="verify-profile-title"
                  className="text-xl font-bold text-[#14191F]"
                >
                  {profile.name} · {profile.role}
                </h2>
                {profile.verified && (
                  <CheckCircle2 className="w-4 h-4 text-[#0F5C4D]" />
                )}
              </div>
              <p className="text-sm text-[#5A6270] mt-0.5">
                {profile.institution} · Moving to {profile.targetCity}
              </p>
            </div>
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

        {/* Face Recognition Section */}
        <div className="mt-6 pt-5 border-t border-stone-200 space-y-4">
          <div className="flex items-start gap-2.5 text-sm text-[#3F4752]">
            <ScanFace className="w-5 h-5 text-[#0F5C4D] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#14191F]">
                Face Recognition & Anti-Fake Safety Check
              </h3>
              <p className="text-xs text-[#5A6270] mt-0.5">
                Dwell verifies a live selfie—and optionally compares it to your
                photo ID—to block fake profiles, stock photos, and bots.
              </p>
            </div>
          </div>

          <FaceVerificationCapture
            existingAvatarUrl={profile.avatarUrl}
            isFaceVerified={profile.faceVerified}
            existingConfidence={profile.faceConfidence}
            existingChecks={profile.verificationChecks}
            onVerified={({ avatarUrl, confidenceScore, checks }) => {
              const domainPart = emailVerifiedDomain
                ? ` + ${emailVerifiedDomain}`
                : '';
              const idPart = checks.idCompared ? ' + Photo ID' : '';
              onVerify({
                avatarUrl,
                faceVerified: true,
                faceConfidence: confidenceScore,
                verificationChecks: checks,
                verificationMethod: `Face Verified (${confidenceScore}%)${idPart}${domainPart}`,
              });
            }}
          />
        </div>

        {/* University / Employer Email Check */}
        <div className="mt-6 pt-5 border-t border-stone-200 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#14191F]">
            <ShieldCheck className="w-4 h-4 text-[#0F5C4D]" />
            <span>University or Employer Email</span>
          </div>

          {emailVerifiedDomain ||
          (profile.verificationMethod &&
            !profile.verificationMethod.startsWith('Face Verified')) ? (
            <p className="text-xs text-[#0F5C4D] font-medium">
              {profile.verificationMethod}
            </p>
          ) : (
            <form
              onSubmit={handleVerifyEmail}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <input
                type="email"
                value={orgEmail}
                onChange={(e) => {
                  setOrgEmail(e.target.value);
                  setError('');
                }}
                placeholder="name@university.edu or name@company.com"
                className="flex-1 px-3.5 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#0F5C4D]"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs sm:text-sm font-medium bg-[#14191F] text-white rounded-lg hover:bg-[#262E38] transition-colors cursor-pointer whitespace-nowrap"
              >
                Confirm Email
              </button>
            </form>
          )}
          {error && <p className="text-xs text-[#B91C1C]">{error}</p>}
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
