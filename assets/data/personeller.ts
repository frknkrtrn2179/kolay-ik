export type Personel = {
  id: string;
  adSoyad: string;
  fotograf: any;
  email: string;
  telefon: string;
  departman: string;
  unvan: string;
  iseGirisTarihi: string;
  aktifMi: boolean;
  kalanIzinGunu: number;
  sifre: string;
  rol: "Personel" | "Yonetici";
};

export const personeller: Personel[] = [
  {
    id: "p1",
    adSoyad: "Furkan Kurtaran",
    fotograf: require("../images/furkan.jpg"),
    email: "furkan@sirket.com",
    telefon: "0555 111 22 33",
    departman: "Yazılım",
    unvan: "Yazılım Geliştirme Stajyeri",
    iseGirisTarihi: "2026-06-01",
    aktifMi: true,
    kalanIzinGunu: 5,
    sifre: "123456",
    rol: "Personel"
  },
  {
    id: "p2",
    adSoyad: "Ayşe Yılmaz",
    fotograf: require("../images/ayşe.jpg"),
    email: "ayse.yilmaz@sirket.com",
    telefon: "0532 444 55 66",
    departman: "İnsan Kaynakları",
    unvan: "İK Müdürü",
    iseGirisTarihi: "2021-03-15",
    aktifMi: true,
    kalanIzinGunu: 14,
    sifre: "123456",
    rol: "Personel"
  },
  {
    id: "p3",
    adSoyad: "Ahmet Demir",
    fotograf: require("../images/ahmet.jpg"),
    email: "ahmet.demir@sirket.com",
    telefon: "0544 777 88 99",
    departman: "Tasarım",
    unvan: "UI/UX Tasarımcı",
    iseGirisTarihi: "2023-09-10",
    aktifMi: false,
    kalanIzinGunu: 0,
    sifre: "123456",
    rol: "Personel"
  },
  
  {
    id: "y1",
    adSoyad: "Şevket Bey",
    fotograf: require("../images/ceo.jpg"),
    email: "admin@sirket.com",
    telefon: "0555 000 00 00",
    departman: "Yönetim",
    unvan: "Genel Müdür",
    iseGirisTarihi: "2015-01-01",
    aktifMi: true,
    kalanIzinGunu: 30,
    sifre: "admin123",
    
    rol: "Yonetici"
  }
];