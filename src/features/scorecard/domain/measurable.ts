export type Comparator = 'GTE' | 'LTE' | 'EQ' | 'GT' | 'LT' | 'BETWEEN';
export type MeasurableFormat = 'NUMBER' | 'PERCENT' | 'CURRENCY' | 'TIME';

export interface MeasurableRow {
  id: string;
  name: string;
  teamId: string;
  ownerId: string;
  ownerName: string;
  goalValue: number;
  goalMax: number | null;
  comparator: Comparator;
  format: MeasurableFormat;
  unit: string | null;
  order: number;
}

export interface WeekKey {
  isoYear: number;
  isoWeek: number;
}

export interface EntryRow extends WeekKey {
  measurableId: string;
  value: number | null;
}
