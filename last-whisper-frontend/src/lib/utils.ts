import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-success bg-success/10 border-success/20';
  if (score >= 70) return 'text-warning bg-warning/10 border-warning/20';
  if (score >= 50) return 'text-orange-600 bg-orange-100 border-orange-200';
  return 'text-destructive bg-destructive/10 border-destructive/20';
}

export function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-100';
  if (score >= 70) return 'bg-yellow-100';
  if (score >= 50) return 'bg-orange-100';
  return 'bg-red-100';
}

export function getDifficultyColor(difficulty: number | null | undefined): string {
  switch (difficulty) {
    case 1:
      return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700';
    case 2:
      return 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700';
    case 3:
      return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700';
    case 4:
      return 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700';
    case 5:
      return 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}

export function getDifficultyLabel(difficulty: number | null | undefined): string {
  switch (difficulty) {
    case 1: return 'Beginner';
    case 2: return 'Easy';
    case 3: return 'Medium';
    case 4: return 'Hard';
    case 5: return 'Expert';
    default: return 'Unknown';
  }
}

export function getTTSStatusColor(ttsStatus: string): string {
  switch (ttsStatus) {
    case 'ready':
      return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700';
    case 'processing':
    case 'pending':
      return 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
    case 'failed':
      return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}

export function getTTSStatusLabel(ttsStatus: string): string {
  switch (ttsStatus) {
    case 'ready':
      return 'Ready';
    case 'processing':
      return 'Processing';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

export function getPracticedColor(practiced: boolean): string {
    if (practiced) {
        return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700';
    }
    return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600';
}

export function getPracticedLabel(practiced: boolean): string {
    return practiced ? 'Practiced' : 'Unpracticed';
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getItemAudioUrl(itemId: number): string {
  return `/v1/items/${itemId}/audio`;
}
