/**
 * Preset stamps for document workflows.
 */

export interface PresetStamp {
  id: string;
  name: string;
  text: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
}

export const PRESET_STAMPS: PresetStamp[] = [
  {
    id: 'approved',
    name: 'Approved',
    text: 'APPROVED',
    color: '#FFFFFF',
    backgroundColor: '#22C55E',
    borderColor: '#16A34A',
  },
  {
    id: 'rejected',
    name: 'Rejected',
    text: 'REJECTED',
    color: '#FFFFFF',
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  {
    id: 'confidential',
    name: 'Confidential',
    text: 'CONFIDENTIAL',
    color: '#FFFFFF',
    backgroundColor: '#F97316',
    borderColor: '#EA580C',
  },
  {
    id: 'draft',
    name: 'Draft',
    text: 'DRAFT',
    color: '#374151',
    backgroundColor: '#D1D5DB',
    borderColor: '#9CA3AF',
  },
  {
    id: 'final',
    name: 'Final',
    text: 'FINAL',
    color: '#FFFFFF',
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  {
    id: 'for-review',
    name: 'For Review',
    text: 'FOR REVIEW',
    color: '#FFFFFF',
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
  },
];

export const DEFAULT_STAMP_WIDTH = 150;
export const DEFAULT_STAMP_HEIGHT = 50;

export type StampType = 'approved' | 'rejected' | 'confidential' | 'draft' | 'final' | 'for-review' | 'custom';

export function getStampById(id: string): PresetStamp | undefined {
  return PRESET_STAMPS.find((stamp) => stamp.id === id);
}
