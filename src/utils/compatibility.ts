import { CompatibilityBreakdown, RoommateProfile, UserProfile } from '../types/dwell';

export function formatSleepLabel(sleep: RoommateProfile['sleepSchedule']): string {
  switch (sleep) {
    case 'early':
      return 'Early Bird (before 11 PM)';
    case 'balanced':
      return 'Balanced (11 PM – 12:30 AM)';
    case 'night':
      return 'Night Owl (after 12:30 AM)';
  }
}

export function formatFoodLabel(food: RoommateProfile['foodHabit']): string {
  switch (food) {
    case 'vegetarian':
      return 'Vegetarian';
    case 'eggetarian':
      return 'Eggetarian';
    case 'non-veg':
      return 'Non-Vegetarian';
    case 'vegan':
      return 'Vegan';
  }
}

export function formatCleanlinessLabel(level: number): string {
  if (level >= 5) return 'Spotless Daily (5/5)';
  if (level === 4) return 'Very Tidy (4/5)';
  if (level === 3) return 'Moderately Tidy (3/5)';
  if (level === 2) return 'Relaxed (2/5)';
  return 'Very Casual (1/5)';
}

export function evaluateCompatibility(
  user: UserProfile,
  candidate: RoommateProfile
): CompatibilityBreakdown {
  const violatedRules: string[] = [];
  const { dealBreakers } = user;

  if (dealBreakers.noSmoking && candidate.smoking !== 'non-smoker') {
    violatedRules.push('No Smoking');
  }
  if (
    dealBreakers.vegetarianKitchenOnly &&
    candidate.foodHabit !== 'vegetarian' &&
    candidate.foodHabit !== 'vegan'
  ) {
    violatedRules.push('Vegetarian Kitchen Only');
  }
  if (dealBreakers.noPets && candidate.pets === 'has-pet') {
    violatedRules.push('No Pets');
  }
  if (dealBreakers.quietAfterEleven && !candidate.quietAfterEleven) {
    violatedRules.push('Quiet Hours After 11 PM');
  }
  if (dealBreakers.verifiedOnly && !candidate.verified) {
    violatedRules.push('Face & ID Verified Only');
  }
  if (dealBreakers.sameGenderOnly && candidate.gender !== user.gender) {
    violatedRules.push('Same Gender Preferred');
  }

  // 1. Sleep & Quiet Hours (0 - 25)
  let sleepScore = 0;
  if (user.sleepSchedule === candidate.sleepSchedule) {
    sleepScore = 22;
  } else if (
    user.sleepSchedule === 'balanced' ||
    candidate.sleepSchedule === 'balanced'
  ) {
    sleepScore = 15;
  } else {
    sleepScore = 7;
  }
  if (user.quietAfterEleven === candidate.quietAfterEleven) {
    sleepScore += 3;
  }

  // 2. Cleanliness (0 - 25)
  const cleanDiff = Math.abs(user.cleanliness - candidate.cleanliness);
  let cleanlinessScore = 25;
  if (cleanDiff === 1) cleanlinessScore = 20;
  else if (cleanDiff === 2) cleanlinessScore = 13;
  else if (cleanDiff === 3) cleanlinessScore = 7;
  else if (cleanDiff >= 4) cleanlinessScore = 3;

  // 3. Food Habits & Cooking (0 - 25)
  let foodScore = 0;
  if (user.foodHabit === candidate.foodHabit) {
    foodScore = 20;
  } else if (
    (user.foodHabit === 'vegetarian' && candidate.foodHabit === 'vegan') ||
    (user.foodHabit === 'vegan' && candidate.foodHabit === 'vegetarian')
  ) {
    foodScore = 18;
  } else if (
    (user.foodHabit === 'vegetarian' && candidate.foodHabit === 'eggetarian') ||
    (user.foodHabit === 'eggetarian' && candidate.foodHabit === 'vegetarian')
  ) {
    foodScore = 14;
  } else if (user.foodHabit === 'non-veg' || candidate.foodHabit === 'non-veg') {
    foodScore = user.foodHabit === 'non-veg' && candidate.foodHabit === 'non-veg' ? 20 : 10;
  } else {
    foodScore = 11;
  }
  if (user.cookingFrequency === candidate.cookingFrequency) {
    foodScore += 5;
  } else {
    foodScore += 2;
  }

  // 4. Culture, Social Vibe & Language (0 - 25)
  const userLangs = new Set(user.languages.map((l) => l.toLowerCase()));
  const sharedLanguages = candidate.languages.filter((lang) =>
    userLangs.has(lang.toLowerCase())
  );

  let languagePoints = 5;
  if (sharedLanguages.length >= 2) languagePoints = 16;
  else if (sharedLanguages.length === 1) languagePoints = 12;

  let socialPoints = 4;
  if (user.socialVibe === candidate.socialVibe) socialPoints = 9;
  else if (user.socialVibe === 'balanced' || candidate.socialVibe === 'balanced')
    socialPoints = 6;

  const cultureLanguageScore = Math.min(25, languagePoints + socialPoints);
  const overallScore = Math.min(
    99,
    Math.max(35, sleepScore + cleanlinessScore + foodScore + cultureLanguageScore)
  );

  const highlights: string[] = [];
  const differences: string[] = [];

  if (sharedLanguages.length > 0) {
    highlights.push(`Shared language: ${sharedLanguages.join(', ')}`);
  } else {
    differences.push('No overlapping native/spoken languages');
  }

  if (sleepScore >= 22) {
    highlights.push(`Aligned sleep routine (${formatSleepLabel(candidate.sleepSchedule).split(' (')[0]})`);
  } else if (sleepScore < 15) {
    differences.push(`Different sleep hours (${formatSleepLabel(candidate.sleepSchedule).split(' (')[0]})`);
  }

  if (cleanDiff <= 1) {
    highlights.push(`Similar cleanliness expectations (${candidate.cleanliness}/5)`);
  } else {
    differences.push(`Cleanliness gap (${candidate.cleanliness}/5 vs your ${user.cleanliness}/5)`);
  }

  if (foodScore >= 18) {
    highlights.push(`Compatible kitchen & ${formatFoodLabel(candidate.foodHabit).toLowerCase()} diet`);
  } else if (foodScore <= 12) {
    differences.push(`Different food habits (${formatFoodLabel(candidate.foodHabit)})`);
  }

  return {
    overallScore,
    sleepScore,
    cleanlinessScore,
    foodScore,
    cultureLanguageScore,
    sharedLanguages,
    highlights,
    differences,
    dealBreakerResult: {
      passed: violatedRules.length === 0,
      violatedRules,
    },
  };
}
