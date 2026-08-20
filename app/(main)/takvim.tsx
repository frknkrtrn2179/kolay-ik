// DOSYA: app/(main)/takvim.tsx

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { resimler } from "../../assets/data/resimler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RENKLER = {
  arkaplan: "#FAF6F0",
  koyuKahve: "#4A3C31",
  pastelKahve: "#8D7B68",
  kutuArkaplan: "#FFFFFF",
  cizgi: "#EBE3D5",
  tatilKirmizi: "#A75D5D", // Takvimdeki tatil noktalarının rengi
  izinMavi: "#6B8E9B", // Takvimdeki izin noktalarının rengi
};

// Şirket için değişmez resmi tatiller listesi
const RESMI_TATILLER: Record<string, string> = {
  "2026-01-01": "Yılbaşı",
  "2026-04-23": "Ulusal Egemenlik Bayramı",
  "2026-05-01": "Emek ve Dayanışma Günü",
  "2026-05-19": "Gençlik ve Spor Bayramı",
  "2026-07-15": "Demokrasi Günü",
  "2026-08-30": "Zafer Bayramı",
  "2026-10-29": "Cumhuriyet Bayramı",
};

export default function OrtakTakvim() {
  const [onayliIzinler, setOnayliIzinler] = useState<any[]>([]);
  const [seciliTarih, setSeciliTarih] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [yukleniyor, setYukleniyor] = useState(true);
  const insets = useSafeAreaInsets();

  const takvimVerileriniGetir = async () => {
    try {
      setYukleniyor(true);
      const { data: izinData } = await supabase
        .from("izinler")
        .select("*")
        .eq("durum", "Onaylandı");
      const { data: personelData } = await supabase
        .from("personeller")
        .select("*");

      if (izinData && personelData) {
        const birlesik = izinData.map((izin) => {
          const personel = personelData.find((p) => p.id === izin.personel_id);
          return { ...izin, personel };
        });
        setOnayliIzinler(birlesik);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setYukleniyor(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      takvimVerileriniGetir();
    }, []),
  );

  const isaretliTarihleriOlustur = () => {
    let marked: any = {};

    // 1. Resmi Tatilleri takvime ekleyelim (Kırmızı nokta ile)
    Object.keys(RESMI_TATILLER).forEach((tarih) => {
      marked[tarih] = { marked: true, dotColor: RENKLER.tatilKirmizi };
    });

    // 2. İzinli personelleri takvime ekleyelim (Mavi nokta ile)
    onayliIzinler.forEach((izin) => {
      let suAnkiGun = new Date(izin.baslangic_tarihi);
      let bitis = new Date(izin.bitis_tarihi);

      while (suAnkiGun <= bitis) {
        const tarihStr = suAnkiGun.toISOString().split("T")[0];

        // Eğer o gün hem tatil hem de izinliyse sistemi bozmayıp işaretli bırakıyoruz
        if (!marked[tarihStr]) {
          marked[tarihStr] = { marked: true, dotColor: RENKLER.izinMavi };
        }
        suAnkiGun.setDate(suAnkiGun.getDate() + 1);
      }
    });

    // 3. Kullanıcının tıkladığı günü özel olarak boyayalım
    if (marked[seciliTarih]) {
      marked[seciliTarih] = {
        ...marked[seciliTarih],
        selected: true,
        selectedColor: RENKLER.koyuKahve,
      };
    } else {
      marked[seciliTarih] = {
        selected: true,
        selectedColor: RENKLER.koyuKahve,
      };
    }

    return marked;
  };

  // Seçilen günde izinli olan kişileri filtrele
  const seciliGundekiIzinliler = onayliIzinler.filter((izin) => {
    return (
      seciliTarih >= izin.baslangic_tarihi && seciliTarih <= izin.bitis_tarihi
    );
  });

  // Seçilen gün resmi tatil mi?
  const tatilAdi = RESMI_TATILLER[seciliTarih];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.calendarWrapper}>
        <Calendar
          current={seciliTarih}
          onDayPress={(day: any) => setSeciliTarih(day.dateString)}
          markedDates={isaretliTarihleriOlustur()}
          theme={{
            todayTextColor: RENKLER.koyuKahve,
            arrowColor: RENKLER.pastelKahve,
            monthTextColor: RENKLER.koyuKahve,
            textMonthFontWeight: "bold",
          }}
        />
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.bottomTitle}>Tarih: {seciliTarih}</Text>

        {/* EĞER SEÇİLEN GÜN RESMİ TATİLSE BU KARTI GÖSTER */}
        {tatilAdi && (
          <View style={styles.holidayCard}>
            <Text style={styles.holidayTitle}>Resmi Tatil</Text>
            <Text style={styles.holidayName}>{tatilAdi}</Text>
          </View>
        )}

        {yukleniyor ? (
          <ActivityIndicator
            size="small"
            color={RENKLER.pastelKahve}
            style={{ marginTop: 20 }}
          />
        ) : seciliGundekiIzinliler.length === 0 && !tatilAdi ? (
          <Text style={styles.emptyText}>Bu tarihte herkes şirkette.</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {seciliGundekiIzinliler.map((izin) => (
              <View key={izin.id} style={styles.card}>
                <Image
                  source={
                    resimler[izin.personel?.foto_kodu] || resimler["varsayilan"]
                  }
                  style={styles.avatar}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>
                    {izin.personel?.adsoyad || izin.personel?.adSoyad}
                  </Text>
                  <Text style={styles.dept}>
                    {izin.personel?.departman} - {izin.personel?.unvan}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RENKLER.arkaplan },
  calendarWrapper: {
    backgroundColor: RENKLER.kutuArkaplan,
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
    elevation: 2,
  },

  bottomSection: { flex: 1, padding: 20 },
  bottomTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: RENKLER.pastelKahve,
    marginBottom: 15,
  },
  emptyText: {
    color: RENKLER.pastelKahve,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },

  holidayCard: {
    backgroundColor: "#FDF5F5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: RENKLER.tatilKirmizi,
    alignItems: "center",
  },
  holidayTitle: {
    fontSize: 14,
    color: RENKLER.tatilKirmizi,
    fontWeight: "bold",
    marginBottom: 5,
  },
  holidayName: { fontSize: 16, color: RENKLER.koyuKahve, fontWeight: "bold" },

  card: {
    flexDirection: "row",
    backgroundColor: RENKLER.kutuArkaplan,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
  },
  avatar: { width: 45, height: 45, borderRadius: 25, marginRight: 15 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold", color: RENKLER.koyuKahve },
  dept: { fontSize: 13, color: RENKLER.pastelKahve, marginTop: 4 },
});
