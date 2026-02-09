/**
 * Invisible component that tracks user activity for session timeout.
 * Must be placed inside AuthProvider.
 */
import { useActivityTracker } from '@/hooks/useActivityTracker';

export const ActivityTracker: React.FC = () => {
  useActivityTracker();
  return null;
};
