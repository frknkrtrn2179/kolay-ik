// DOSYA: app/(main)/yonetici.tsx

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { resimler } from "../../assets/data/resimler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- RENK PALETİMİZ ---
const RENKLER = {
  arkaplan: "#FAF6F0",
  koyuKahve: "#4A3C31",
  pastelKahve: "#8D7B68",
  kutuArkaplan: "#FFFFFF",
  cizgi: "#EBE3D5",
  onay: "#8A9A5B", // Doğayı/yeşili andıran pastel bir onay rengi
  red: "#A75D5D", // Pastel kırmızı
};

export default function YoneticiPaneli() {
  const [bekleyenIzinler, setBekleyenIzinler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const insets = useSafeAreaInsets();

  // Veritabanından hem izinleri hem de o izni isteyen personeli çekip birleştiriyoruz
  const izinleriGetir = async () => {
    try {
      setYukleniyor(true);

      const { data: izinData, error: izinError } = await supabase
        .from("izinler")
        .select("*")
        .eq("durum", "Bekliyor");

      const { data: personelData, error: personelError } = await supabase
        .from("personeller")
        .select("*");

      if (izinData && personelData) {
        // İzinleri listelerken kimin istediğini bilmek için tabloları eşleştiriyoruz
        const birlesikData = izinData.map((izin) => {
          const personel = personelData.find((p) => p.id === izin.personel_id);
          return { ...izin, personel };
        });
        setBekleyenIzinler(birlesikData);
      }
    } catch (error) {
      console.log("Hata:", error);
    } finally {
      setYukleniyor(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      izinleriGetir();
    }, []),
  );

  // --- İZİN ONAYLAMA / REDDETME VE GÜN DÜŞÜRME FONKSİYONU ---
  const izinDurumuGuncelle = async (
    izinId: string,
    yeniDurum: string,
    personelId: string,
    talepEdilenGun: number,
    mevcutIzinHakki: number,
  ) => {
    try {
      if (yeniDurum === "Onaylandı") {
        const yeniKalanIzin = mevcutIzinHakki - talepEdilenGun;

        // SUPABASE HATASI BURADAYDI: Sadece veritabanındaki gerçek sütun adını yazmalıyız.
        // Eğer veritabanında tümü küçük harfse "kalanizingunu" olarak değiştir burayı.
        const { error: personelHata } = await supabase
          .from("personeller")
          .update({ kalanizingunu: yeniKalanIzin })
          .eq("id", personelId);

        if (personelHata) throw personelHata;
      }

      const { error: izinHata } = await supabase
        .from("izinler")
        .update({ durum: yeniDurum })
        .eq("id", izinId);

      if (izinHata) throw izinHata;

      Alert.alert("İşlem Başarılı", `İzin talebi ${yeniDurum.toLowerCase()}!`);

      setBekleyenIzinler((prev) => prev.filter((izin) => izin.id !== izinId));
    } catch (error) {
      Alert.alert("Hata", "İşlem gerçekleştirilemedi.");
      console.log("Hata Detayı:", error); // Hatayı konsolda net görmek için detay ekledim
    }
  };

  // Ekranda gösterilecek içeriği tutacak değişken
  let ekranIcerigi;

  // İç içe geçmiş ternary (soru işaretli) yapı yerine temiz if-else blokları
  if (yukleniyor) {
    ekranIcerigi = (
      <ActivityIndicator
        size="large"
        color={RENKLER.pastelKahve}
        style={{ marginTop: 50 }}
      />
    );
  } else if (bekleyenIzinler.length === 0) {
    ekranIcerigi = (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Bekleyen izin talebi bulunmuyor.</Text>
      </View>
    );
  } else {
    ekranIcerigi = (
      <FlatList
        data={bekleyenIzinler}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          // Veritabanı sütun isimlerine karşı önlem alıyoruz
          const kalanGun = item.personel?.kalanizingunu;

          return (
            <View style={styles.card}>
              {/* ÜST KISIM: Kim ve Ne Kadar İstemiş? */}
              <View style={styles.cardHeader}>
                <Image
                  source={
                    resimler[item.personel?.foto_kodu] || resimler["varsayilan"]
                  }
                  style={styles.avatar}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>
                    {item.personel?.adsoyad || item.personel?.adSoyad}
                  </Text>
                  <Text style={styles.dept}>
                    {item.personel?.departman} Birimi
                  </Text>
                </View>
                <View style={styles.daysBadge}>
                  <Text style={styles.daysText}>
                    {item.gunsayisi} Gün İstedi
                  </Text>
                </View>
              </View>

              {/* ORTA KISIM: Kalan İzin Detayı ve Sebep (Senin eklememi istediğin yer) */}
              <View style={styles.cardBody}>
                <Text style={styles.detailText}>
                  Tarih: {item.baslangic_tarihi} {"->"} {item.bitis_tarihi}
                </Text>
                <Text style={styles.detailText}>
                  Personelin Kalan İzni:{" "}
                  <Text
                    style={{ fontWeight: "bold", color: RENKLER.koyuKahve }}
                  >
                    {kalanGun} Gün
                  </Text>
                </Text>
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonText}>Sebep: {item.sebep}</Text>
                </View>
              </View>

              {/* ALT KISIM: Butonlar */}
              <View style={styles.cardFooter}>
                <Pressable
                  style={[styles.button, styles.rejectButton]}
                  // Reddetme işlemi (İzin günü düşülmez)
                  onPress={() =>
                    izinDurumuGuncelle(
                      item.id,
                      "Reddedildi",
                      item.personel_id,
                      item.gunsayisi,
                      kalanGun,
                    )
                  }
                >
                  <Text style={[styles.buttonText, { color: RENKLER.red }]}>
                    Reddet
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.approveButton]}
                  // Onaylama işlemi (İzin günü düşülür)
                  onPress={() =>
                    izinDurumuGuncelle(
                      item.id,
                      "Onaylandı",
                      item.personel_id,
                      item.gunsayisi,
                      kalanGun,
                    )
                  }
                >
                  <Text style={[styles.buttonText, { color: RENKLER.onay }]}>
                    Onayla
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {ekranIcerigi}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RENKLER.arkaplan, padding: 15 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: RENKLER.pastelKahve, fontWeight: "500" },

  card: {
    backgroundColor: RENKLER.kutuArkaplan,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: RENKLER.cizgi,
    paddingBottom: 10,
    marginBottom: 10,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold", color: RENKLER.koyuKahve },
  dept: { fontSize: 13, color: RENKLER.pastelKahve, marginTop: 2 },

  daysBadge: {
    backgroundColor: RENKLER.arkaplan,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
  },
  daysText: { color: RENKLER.koyuKahve, fontWeight: "bold", fontSize: 13 },

  cardBody: { marginBottom: 15 },
  detailText: {
    fontSize: 14,
    color: RENKLER.pastelKahve,
    fontWeight: "600",
    marginBottom: 6,
  },
  reasonBox: {
    backgroundColor: RENKLER.arkaplan,
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  reasonText: { fontSize: 14, color: RENKLER.koyuKahve },

  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  rejectButton: {
    backgroundColor: "#FDF9F9",
    borderColor: RENKLER.red,
    marginRight: 10,
  },
  approveButton: {
    backgroundColor: "#F9FDF9",
    borderColor: RENKLER.onay,
    marginLeft: 10,
  },
  buttonText: { fontWeight: "bold", fontSize: 15 },
});
