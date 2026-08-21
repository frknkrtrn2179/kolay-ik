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
import { COLORS } from "../../constants/colors";
import { NotificationCard } from "../../features/notifications/NotificationCard";
import { LeaveRequest } from "../../types/leave";

export default function Bildirimler() {
  const { aktifKullanici } = useAuth();
  const [talepler, setTalepler] = useState<LeaveRequest[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const insets = useSafeAreaInsets();

  // YÖNETİCİ İŞLEMLERİ İÇİN YENİ STATELER
  const [acikKartId, setAcikKartId] = useState<string | null>(null); // Akordiyon gibi açılacak kart
  const [modalGoster, setModalGoster] = useState(false); // Pop-up görünürlüğü
  const [islemYapilanTalep, setIslemYapilanTalep] = useState<LeaveRequest | null>(null);

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
    if (kalanGun === undefined) {
      Alert.alert("Hata", "Personelin izin bilgisi bulunamadı.");
      return;
    }
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
                personel: t.personel
                  ? { ...t.personel, kalanizingunu: yeniKalanIzin }
                  : undefined,
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

  // Ekranda gösterilecek içeriği tutacak değişken
  let ekranIcerigi;

  // İç içe geçmiş ternary (soru işaretli) yapı yerine temiz if-else blokları
  if (yukleniyor) {
    ekranIcerigi = (
      <ActivityIndicator
        size="large"
        color={COLORS.brown}
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
        renderItem={({ item }) => (
          <NotificationCard
            request={item}
            isManager={isYonetici}
            isExpanded={acikKartId === item.id}
            onToggle={() => setAcikKartId(acikKartId === item.id ? null : item.id)}
            onDelete={() => bildirimSil(item.id)}
            onReevaluate={() => {
              setIslemYapilanTalep(item);
              setModalGoster(true);
            }}
          />
        )}
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
                        ? COLORS.danger
                        : COLORS.success,
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
  container: { flex: 1, backgroundColor: COLORS.background, padding: 15 },
  emptyText: {
    fontSize: 16,
    color: COLORS.brown,
    textAlign: "center",
    marginTop: 50,
  },

  // POP-UP (MODAL) STİLLERİ
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: COLORS.surface,
    width: "100%",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.darkBrown,
    marginBottom: 10,
  },
  modalText: { fontSize: 16, color: COLORS.brown, marginBottom: 25 },
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
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  modalCancelText: {
    color: COLORS.brown,
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
