// DOSYA: app/(main)/izin-talep.tsx

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useCallback } from "react";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- RENK PALETİMİZ ---
const RENKLER = {
  arkaplan: "#FAF6F0",
  koyuKahve: "#4A3C31",
  pastelKahve: "#8D7B68",
  kutuArkaplan: "#FFFFFF",
  cizgi: "#EBE3D5",
  seciliMavi: "#6B8E9B", // Seçili günler için pastel mavi/gri tonu
  kilitliGri: "#D3CFC8", // Alınamaz günler için gri
};

LocaleConfig.locales["tr"] = {
  monthNames: [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ],
  dayNames: [
    "Pazar",
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
  ],
  dayNamesShort: ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"],
  today: "Bugün",
};
LocaleConfig.defaultLocale = "tr";

// Şirket için değişmez resmi tatiller listesi (Örnek olarak eklendi)
const RESMI_TATILLER: Record<string, string> = {
  "2026-01-01": "Yılbaşı",
  "2026-04-23": "Ulusal Egemenlik Bayramı",
  "2026-05-01": "Emek ve Dayanışma Günü",
  "2026-05-19": "Gençlik ve Spor Bayramı",
  "2026-07-15": "Demokrasi Günü",
  "2026-08-30": "Zafer Bayramı",
  "2026-10-29": "Cumhuriyet Bayramı",
};

export default function IzinTalep() {
  const { aktifKullanici } = useAuth();
  const [baslangicTarihi, setBaslangicTarihi] = useState<string | null>(null);
  const [bitisTarihi, setBitisTarihi] = useState<string | null>(null);
  const [sebep, setSebep] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [alinamazGunler, setAlinamazGunler] = useState<string[]>([]); // Personelin önceden aldığı ve çakışan günlerin listesi
  const insets = useSafeAreaInsets();

  // Bugünden önceki günleri kapatmak için bugünün tarihini YYYY-MM-DD formatında alıyoruz.
  const bugununTarihi = new Date().toISOString().split("T")[0];

  // Sayfa açıldığında personelin mevcut izinlerini veritabanından çekip, alınamaz günleri hesaplıyoruz.
  const mevcutIzinleriGetir = async () => {
    try {
      // Sadece 'Bekliyor' veya 'Onaylandı' olan izinleri getir (Reddedilen günlere tekrar izin alınabilir)
      const { data } = await supabase
        .from("izinler")
        .select("baslangic_tarihi, bitis_tarihi")
        .eq("personel_id", aktifKullanici?.id)
        .neq("durum", "Reddedildi"); // Reddedildi DURUMUNA EŞİT OLMAYANLARI getir demek.

      if (data) {
        let doluGunler: string[] = [];
        data.forEach((izin) => {
          let bas = new Date(izin.baslangic_tarihi);
          let bit = new Date(izin.bitis_tarihi);
          let suAn = new Date(bas);
          // Başlangıçtan bitişe kadar olan tüm günleri tek tek hesaplayıp listeye ekliyoruz.
          while (suAn <= bit) {
            doluGunler.push(suAn.toISOString().split("T")[0]);
            suAn.setDate(suAn.getDate() + 1);
          }
        });
        setAlinamazGunler(doluGunler); // Hesaplanan dolu günleri hafızaya al
      }
    } catch (error) {
      console.log(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      mevcutIzinleriGetir();
      // Sayfaya her girildiğinde takvim seçimlerini sıfırla
      setBaslangicTarihi(null);
      setBitisTarihi(null);
      setSebep("");
    }, []),
  );

  // Takvim üzerinde seçili aralığı boyamak ve dolu günleri kitlemek için yapı
  const isaretliTarihler = () => {
    let marked: any = {};

    // 1. Önce Resmi Tatilleri ve Personelin Eski İzinlerini kilitli (gri) olarak işaretle
    [...alinamazGunler, ...Object.keys(RESMI_TATILLER)].forEach((tarih) => {
      marked[tarih] = {
        disabled: true,
        disableTouchEvent: true,
        color: RENKLER.kilitliGri,
        textColor: "white",
      };
    });

    // 2. Kullanıcının seçtiği başlangıç tarihini maviye boya
    if (baslangicTarihi) {
      marked[baslangicTarihi] = {
        startingDay: true,
        color: RENKLER.seciliMavi,
        textColor: "white",
      };
    }

    // 3. Kullanıcı bitişi de seçtiyse, aradaki tüm günleri boya
    if (bitisTarihi) {
      marked[bitisTarihi] = {
        endingDay: true,
        color: RENKLER.seciliMavi,
        textColor: "white",
      };
      let baslangic = new Date(baslangicTarihi as string);
      let bitis = new Date(bitisTarihi);
      let aradakiGun = new Date(baslangic);
      aradakiGun.setDate(aradakiGun.getDate() + 1);

      while (aradakiGun < bitis) {
        const tarihStr = aradakiGun.toISOString().split("T")[0];
        marked[tarihStr] = { color: "#D7E1E4", textColor: RENKLER.koyuKahve }; // Aradaki günlerin rengi
        aradakiGun.setDate(aradakiGun.getDate() + 1);
      }
    }
    return marked;
  };

  // Takvimde güne tıklanınca çalışan fonksiyon
  const tarihSecildi = (day: any) => {
    // Eğer tıklanan gün, alınamaz günlerden biriyse veya resmi tatilse hiçbir şey yapma (Korumamız)
    if (
      alinamazGunler.includes(day.dateString) ||
      RESMI_TATILLER[day.dateString]
    ) {
      Alert.alert("Uyarı", "Bu tarih için izin talebi oluşturamazsınız.");
      return;
    }

    if (!baslangicTarihi || (baslangicTarihi && bitisTarihi)) {
      setBaslangicTarihi(day.dateString);
      setBitisTarihi(null);
    } else if (baslangicTarihi && !bitisTarihi) {
      if (day.dateString > baslangicTarihi) {
        // BAŞLANGIÇ VE BİTİŞ ARASINDA DOLU BİR GÜN VAR MI KONTROLÜ
        let bas = new Date(baslangicTarihi);
        let bit = new Date(day.dateString);
        let suAn = new Date(bas);
        let cakisiyor = false;

        while (suAn <= bit) {
          const t = suAn.toISOString().split("T")[0];
          if (alinamazGunler.includes(t) || RESMI_TATILLER[t]) {
            cakisiyor = true;
            break; // Bir tane bile dolu bulursan döngüyü kır
          }
          suAn.setDate(suAn.getDate() + 1);
        }

        if (cakisiyor) {
          Alert.alert(
            "Hata",
            "Seçtiğiniz aralıkta zaten izinli olduğunuz bir gün veya resmi tatil bulunuyor. Lütfen tarihleri değiştirin.",
          );
          setBaslangicTarihi(null);
        } else {
          setBitisTarihi(day.dateString); // Çakışma yoksa bitiş tarihini onayla
        }
      } else {
        setBaslangicTarihi(day.dateString);
      }
    }
  };

  const gunHesapla = () => {
    if (!baslangicTarihi || !bitisTarihi) return 1;
    const bas = new Date(baslangicTarihi);
    const bit = new Date(bitisTarihi);
    const farkZaman = Math.abs(bit.getTime() - bas.getTime());
    return Math.ceil(farkZaman / (1000 * 60 * 60 * 24)) + 1;
  };

  const talepGonder = async () => {
    if (!baslangicTarihi) {
      Alert.alert("Eksik Bilgi", "Lütfen takvimden başlangıç tarihini seçin.");
      return;
    }
    if (!sebep.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen izin sebebini belirtin.");
      return;
    }

    const talepEdilenGun = gunHesapla();
    const kesinBitisTarihi = bitisTarihi || baslangicTarihi;
    const kalanIzin = aktifKullanici?.kalanizingunu;

    // Personelin yeterli izin hakkı var mı kontrolü
    if (talepEdilenGun > kalanIzin) {
      Alert.alert(
        "Yetersiz İzin",
        `Sadece ${kalanIzin} gün izniniz var ancak ${talepEdilenGun} gün talep ediyorsunuz.`,
      );
      return;
    }

    setYukleniyor(true);

    try {
      const { error } = await supabase.from("izinler").insert([
        {
          personel_id: aktifKullanici?.id,
          sebep: sebep,
          gunsayisi: talepEdilenGun,
          baslangic_tarihi: baslangicTarihi,
          bitis_tarihi: kesinBitisTarihi,
          durum: "Bekliyor",
        },
      ]);

      if (error) throw error;
      Alert.alert(
        "Başarılı",
        `${talepEdilenGun} günlük talebiniz yöneticiye iletildi.`,
      );
      router.push("/");
    } catch (error) {
      Alert.alert("Hata", "Talebiniz gönderilemedi.");
      console.log(error);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerSubtitle}>
          İzne ayrılacağınız günleri takvimden işaretleyin.
        </Text>

        <View style={styles.calendarCard}>
          <Calendar
            minDate={bugununTarihi} // GEÇMİŞ TARİHLERİ SEÇMEYİ BURADA ENGELLİYORUZ
            markingType={"period"}
            markedDates={isaretliTarihler()}
            onDayPress={tarihSecildi}
            theme={{
              todayTextColor: RENKLER.seciliMavi,
              arrowColor: RENKLER.pastelKahve,
              monthTextColor: RENKLER.koyuKahve,
              textMonthFontWeight: "bold",
            }}
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Talep Edilecek Süre:{" "}
            <Text style={styles.boldText}>{gunHesapla()} Gün</Text>
          </Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>İzin Gerekçesi</Text>
          <TextInput
            style={styles.input}
            placeholder="Açıklama giriniz..."
            placeholderTextColor={RENKLER.pastelKahve}
            value={sebep}
            onChangeText={setSebep}
            multiline
          />
        </View>

        <Pressable
          style={[styles.button, yukleniyor && { opacity: 0.7 }]}
          onPress={talepGonder}
          disabled={yukleniyor}
        >
          {yukleniyor ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Talebi Gönder</Text>
          )}
        </Pressable>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RENKLER.arkaplan, padding: 20 },
  headerSubtitle: {
    fontSize: 15,
    color: RENKLER.pastelKahve,
    marginBottom: 20,
  },
  calendarCard: {
    backgroundColor: RENKLER.kutuArkaplan,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: RENKLER.kutuArkaplan,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
  },
  summaryText: { fontSize: 16, color: RENKLER.pastelKahve },
  boldText: { fontWeight: "bold", fontSize: 18, color: RENKLER.koyuKahve },
  inputCard: {
    backgroundColor: RENKLER.kutuArkaplan,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: RENKLER.koyuKahve,
    marginBottom: 10,
  },
  input: {
    backgroundColor: RENKLER.arkaplan,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
    borderRadius: 10,
    padding: 15,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    color: RENKLER.koyuKahve,
  },
  button: {
    backgroundColor: RENKLER.koyuKahve,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 25,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
