import { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  sizeClass?: string;
  roundedClass?: string;
}

export function Avatar({
  name,
  src,
  sizeClass = 'w-14 h-14',
  roundedClass = 'rounded-lg',
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClass} ${roundedClass} shrink-0 bg-[#EEF2F0] border border-[#DCE4E0] text-[#0F5C4D] flex items-center justify-center font-semibold text-sm tracking-tight select-none`}
        aria-label={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Portrait of ${name}`}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${sizeClass} ${roundedClass} shrink-0 object-cover border border-stone-200 bg-stone-100`}
    />
  );
}
