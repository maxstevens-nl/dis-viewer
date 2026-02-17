export interface MedicalUsageRow {
  jaar: number;
  specialismeCd: string;
  specialismeOms: string;
  diagnoseCd: string;
  diagnoseOms: string;
  aantalPatienten: number;
}

export interface TimeSeriesEntry {
  jaar: number;
  value: number;
}

export interface ChartDataEntry {
  jaar: number;
  solid: number | null;
  provisional: number | null;
}
