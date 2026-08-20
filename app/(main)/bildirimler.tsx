import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal, // POP-UP İÇİN EKLENDİ
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";

const RENKLER = {
  arkaplan: "#FAF6F0",
  koyuKahve: "#4A3C31",
  pastelKahve: "#8D7B68",
  kutuArkaplan: "#FFFFFF",
  cizgi: "#EBE3D5",
  onay: "#8A9A5B",
  red: "#A75D5D",
  bekliyor: "#C89E78",
  silKirmizi: "#D65A5A",
  siyahYariSaydam: "rgba(0, 0, 0, 0.5)", // Pop-up arka planı için
};

export default function Bildirimler() {
  const { aktifKullanici } = useAuth();
  const [talepler, setTalepler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const insets = useSafeAreaInsets();

  // YÖNETİCİ İŞLEMLERİ İÇİN YENİ STATELER
  const [acikKartId, setAcikKartId] = useState<string | null>(null); // Akordiyon gibi açılacak kart
  const [modalGoster, setModalGoster] = useState(false); // Pop-up görünürlüğü
  const [islemYapilanTalep, setIslemYapilanTalep] = useState<any>(null); // Hangi talep düzenleniyor?

  const isYonetici =
    aktifKullanici?.rol === "Yonetici" || aktifKullanici?.rol === "Yönetici";

  const bildirimleriGetir = async () => {
    try {
      setYukleniyor(true);

      if (isYonetici) {
        // YÖNETİCİ GÖRÜNÜMÜ: Sadece onaylanan veya reddedilen geçmiş işlemleri getir
        const { data: izinData } = await supabase
          .from("izinler")
          .select("*")
          .neq("durum", "Bekliyor")
          .order("id", { ascending: false });
        const { data: personelData } = await supabase
          .from("personeller")
          .select("*");

        if (izinData && personelData) {
          const birlesik = izinData.map((izin) => {
            const personel = personelData.find(
              (p) => p.id === izin.personel_id,
            );
            return { ...izin, personel };
          });
          setTalepler(birlesik);
        }
      } else {
        // PERSONEL GÖRÜNÜMÜ: Kendi bildirimlerini getir
        const { data } = await supabase
          .from("izinler")
          .select("*")
          .eq("personel_id", aktifKullanici?.id)
          .order("id", { ascending: false });
        if (data) setTalepler(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setYukleniyor(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      bildirimleriGetir();
    }, []),
  );

  // SADECE PERSONEL İÇİN SİLME İŞLEMİ
  const bildirimSil = async (id: string) => {
    // Yönetici geçmişi silemez, sadece kararını değiştirebilir
    try {
      await supabase.from("izinler").delete().eq("id", id);
      setTalepler((onceki) => onceki.filter((talep) => talep.id !== id));
    } catch (error) {
      console.log("Silme hatası:", error);
    }
  };

  // YÖNETİCİ İÇİN KARAR DEĞİŞTİRME FONKSİYONU (POP-UP'TAN TETİKLENİR)
  const karariGuncelle = async () => {
    if (!islemYapilanTalep) return;

    const mevcutDurum = islemYapilanTalep.durum;
    const yeniDurum = mevcutDurum === "Onaylandı" ? "Reddedildi" : "Onaylandı";

    // O anki kalan gün sayısını bulalım (Veritabanındaki küçük harfli isme göre)
    const kalanGun = islemYapilanTalep.personel?.kalanizingunu;
    let yeniKalanIzin = kalanGun;

    // MATEMATİK HESABI
    if (mevcutDurum === "Onaylandı" && yeniDurum === "Reddedildi") {
      // Yanlışlıkla onaylanmış, reddediyoruz. Günleri personele iade et.
      yeniKalanIzin = kalanGun + islemYapilanTalep.gunsayisi;
    } else if (mevcutDurum === "Reddedildi" && yeniDurum === "Onaylandı") {
      // Yanlışlıkla reddedilmiş, onaylıyoruz. Günleri personelden düş.
      if (kalanGun < islemYapilanTalep.gunsayisi) {
        Alert.alert(
          "Uyarı",
          "Personelin bu işlemi onaylamak için yeterli izin günü yok!",
        );
        setModalGoster(false);
        return;
      }
      yeniKalanIzin = kalanGun - islemYapilanTalep.gunsayisi;
    }

    try {
      // 1. Personel bakiyesini güncelle (HATA BURADAYDI, TAMAMEN KÜÇÜK HARF YAPTIK)
      const { error: personelHata } = await supabase
        .from("personeller")
        .update({ kalanizingunu: yeniKalanIzin })
        .eq("id", islemYapilanTalep.personel_id);

      if (personelHata) throw personelHata;

      // 2. İzin durumunu güncelle
      const { error: izinHata } = await supabase
        .from("izinler")
        .update({ durum: yeniDurum })
        .eq("id", islemYapilanTalep.id);

      if (izinHata) throw izinHata;

      // 3. Ekranda bildirimi silmeden dinamik olarak güncelle (Rengi ve durumu değişecek)
      setTalepler((prev) =>
        prev.map((t) =>
          t.id === islemYapilanTalep.id
            ? {
                ...t,
                durum: yeniDurum,
                personel: { ...t.personel, kalanizingunu: yeniKalanIzin },
              }
            : t,
        ),
      );

      setModalGoster(false); // Pop-up'ı kapat
      setAcikKartId(null); // Akordiyonu kapat
      Alert.alert(
        "Başarılı",
        "Karar değiştirildi ve izin günleri başarıyla güncellendi.",
      );
    } catch (error) {
      Alert.alert("Hata", "Güncelleme sırasında bir sorun oluştu.");
      console.log("Karar değiştirme hatası:", error);
    }
  };

  const izinDurumuHesapla = (
    basTarihi: string,
    bitTarihi: string,
    durum: string,
  ) => {
    if (durum === "Bekliyor")
      return { metin: "Yönetici onayı bekleniyor...", renk: RENKLER.bekliyor };
    if (durum === "Reddedildi")
      return { metin: "Talebiniz onaylanmadı.", renk: RENKLER.red };

    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    const bas = new Date(basTarihi);
    const bit = new Date(bitTarihi);
    const baslamasinaKalan = Math.ceil(
      (bas.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24),
    );
    const bitmesineKalan = Math.ceil(
      (bit.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (baslamasinaKalan > 0)
      return {
        metin: `Başlamasına ${baslamasinaKalan} gün kaldı.`,
        renk: RENKLER.onay,
      };
    if (bitmesineKalan >= 0)
      return {
        metin: `Bitmesine ${bitmesineKalan} gün kaldı.`,
        renk: RENKLER.onay,
      };
    return { metin: "İzin süresi tamamlandı.", renk: RENKLER.pastelKahve };
  };

  const renderSilButonu = (id: string) => {
    // Yönetici yana kaydırıp silemez
    return (
      <Pressable style={styles.deleteButton} onPress={() => bildirimSil(id)}>
        <Text style={styles.deleteText}>Sil</Text>
      </Pressable>
    );
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
  } else if (talepler.length === 0) {
    ekranIcerigi = (
      <Text style={styles.emptyText}>Henüz bir talep geçmişi bulunmuyor.</Text>
    );
  } else {
    ekranIcerigi = (
      <FlatList
        data={talepler}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const dinamikDurum = isYonetici
            ? {
                metin: `Durum: ${item.durum}`,
                renk: item.durum === "Onaylandı" ? RENKLER.onay : RENKLER.red,
              }
            : izinDurumuHesapla(
                item.baslangic_tarihi,
                item.bitis_tarihi,
                item.durum,
              );

          const isExpanded = acikKartId === item.id;

          return (
            <Swipeable renderRightActions={() => renderSilButonu(item.id)}>
              <Pressable
                style={[styles.card, { borderLeftColor: dinamikDurum.renk }]}
                onPress={() => {
                  if (isYonetici) setAcikKartId(isExpanded ? null : item.id);
                }}
              >
                <View style={styles.info}>
                  {/* YÖNETİCİYSE KİMİN İZNİ OLDUĞUNU YAZ */}
                  {isYonetici && (
                    <Text style={styles.personelName}>
                      {item.personel?.adSoyad || item.personel?.adsoyad}
                    </Text>
                  )}

                  <Text style={styles.date}>
                    {item.baslangic_tarihi} - {item.bitis_tarihi}
                  </Text>
                  <Text style={styles.days}>
                    {item.gunsayisi} Günlük İzin Talebi
                  </Text>
                  <Text
                    style={[styles.statusText, { color: dinamikDurum.renk }]}
                  >
                    {dinamikDurum.metin}
                  </Text>
                </View>

                {/* YÖNETİCİ TIKLADIĞINDA AÇILAN AKORDİYON KISMI */}
                {isYonetici && isExpanded && (
                  <View style={styles.expandedSection}>
                    <View style={styles.divider} />
                    <Pressable
                      style={styles.reevaluateButton}
                      onPress={() => {
                        setIslemYapilanTalep(item);
                        setModalGoster(true);
                      }}
                    >
                      <Text style={styles.reevaluateText}>
                        Tekrar Değerlendir
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            </Swipeable>
          );
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* KARAR DEĞİŞTİRME POP-UP'I (MODAL) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalGoster}
        onRequestClose={() => setModalGoster(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Kararı Değiştir</Text>
            <Text style={styles.modalText}>
              Şu anki durum:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {islemYapilanTalep?.durum}
              </Text>
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setModalGoster(false)}
              >
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </Pressable>

              {/* Mevcut duruma göre buton ismini dinamik olarak veriyoruz */}
              <Pressable
                style={[
                  styles.modalActionBtn,
                  {
                    backgroundColor:
                      islemYapilanTalep?.durum === "Onaylandı"
                        ? RENKLER.red
                        : RENKLER.onay,
                  },
                ]}
                onPress={karariGuncelle}
              >
                <Text style={styles.modalActionText}>
                  {islemYapilanTalep?.durum === "Onaylandı"
                    ? "Reddet"
                    : "Onayla"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Yukarıda hazırladığımız temiz içeriği buraya basıyoruz */}
      {ekranIcerigi}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RENKLER.arkaplan, padding: 15 },
  emptyText: {
    fontSize: 16,
    color: RENKLER.pastelKahve,
    textAlign: "center",
    marginTop: 50,
  },

  card: {
    backgroundColor: RENKLER.kutuArkaplan,
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
    borderLeftWidth: 5,
  },
  info: { flex: 1 },
  personelName: {
    fontSize: 16,
    fontWeight: "bold",
    color: RENKLER.koyuKahve,
    marginBottom: 4,
  },
  date: { fontSize: 15, fontWeight: "bold", color: RENKLER.koyuKahve },
  days: { fontSize: 14, color: RENKLER.pastelKahve, marginVertical: 6 },
  statusText: { fontSize: 14, fontWeight: "bold", marginTop: 4 },

  deleteButton: {
    backgroundColor: RENKLER.silKirmizi,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 10,
    marginBottom: 12,
    marginLeft: 10,
  },
  deleteText: { color: "white", fontWeight: "bold", fontSize: 16 },

  // AKORDİYON STİLLERİ
  expandedSection: { marginTop: 15 },
  divider: { height: 1, backgroundColor: RENKLER.cizgi, marginBottom: 15 },
  reevaluateButton: {
    backgroundColor: RENKLER.arkaplan,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RENKLER.pastelKahve,
  },
  reevaluateText: {
    color: RENKLER.koyuKahve,
    fontWeight: "bold",
    fontSize: 15,
  },

  // POP-UP (MODAL) STİLLERİ
  modalOverlay: {
    flex: 1,
    backgroundColor: RENKLER.siyahYariSaydam,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: RENKLER.kutuArkaplan,
    width: "100%",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: RENKLER.koyuKahve,
    marginBottom: 10,
  },
  modalText: { fontSize: 16, color: RENKLER.pastelKahve, marginBottom: 25 },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: RENKLER.arkaplan,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
    marginRight: 10,
  },
  modalCancelText: {
    color: RENKLER.pastelKahve,
    fontWeight: "bold",
    fontSize: 15,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 10,
  },
  modalActionText: { color: "white", fontWeight: "bold", fontSize: 15 },
});
