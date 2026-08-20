export type IzinTalep = {
  id: string;
  personelAdi: string;
  gunSayisi: string;
  sebep: string;
  durum: "Bekliyor" | "Onaylandı" | "Reddedildi";
};

// Yöneticinin göreceği izin talepleri havuzumuz (Başlangıçta boş)
export const izinTalepleri: IzinTalep[] = [];