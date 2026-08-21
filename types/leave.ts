export type LeaveStatus = "Bekliyor" | "Onaylandı" | "Reddedildi";

export type Employee = {
  id: string;
  adsoyad?: string;
  adSoyad?: string;
  kalanizingunu: number;
};

export type LeaveRequest = {
  id: string;
  personel_id: string;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  gunsayisi: number;
  durum: LeaveStatus;
  sebep?: string;
  personel?: Employee;
};
