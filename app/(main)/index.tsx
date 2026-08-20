// DOSYA: app/(main)/index.tsx

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useFocusEffect, router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { resimler } from "../../assets/data/resimler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RENKLER = {
  arkaplan: "#FAF6F0",
  koyuKahve: "#4A3C31",
  pastelKahve: "#8D7B68",
  kutuArkaplan: "#FFFFFF",
  cizgi: "#EBE3D5",
  maviUyarici: "#6B8E9B",
};

export default function AnaSayfa() {
  const { aktifKullanici } = useAuth();
  const [calisanlar, setCalisanlar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kisiselNot, setKisiselNot] = useState("");
  const insets = useSafeAreaInsets();

  const isPersonel = aktifKullanici?.rol === "Personel";

  const calisanlariGetir = async () => {
    try {
      setYukleniyor(true);
      const { data, error } = await supabase
        .from("personeller")
        .select("*")
        .eq("rol", "Personel");

      if (data) setCalisanlar(data);
    } catch (error) {
      console.log("Hata:", error);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    if (isPersonel) {
      AsyncStorage.getItem(`not_${aktifKullanici?.id}`).then((kayitliNot) => {
        if (kayitliNot) setKisiselNot(kayitliNot);
      });
    }
  }, []);

  const notuKaydet = (yeniNot: string) => {
    setKisiselNot(yeniNot);
    AsyncStorage.setItem(`not_${aktifKullanici?.id}`, yeniNot);
  };

  const birimlereGoreGrupla = () => {
    const gruplar: Record<string, any[]> = {};
    calisanlar.forEach((calisan) => {
      if (!gruplar[calisan.departman]) gruplar[calisan.departman] = [];
      gruplar[calisan.departman].push(calisan);
    });
    return gruplar;
  };

  useFocusEffect(
    useCallback(() => {
      if (!isPersonel) calisanlariGetir();
    }, [isPersonel]),
  );

  if (isPersonel) {
    const kalanIzin =
      aktifKullanici?.kalanizingunu || aktifKullanici?.kalanIzinGunu;

    return (
      // KALKANA EKSTRA İTME GÜCÜ (keyboardVerticalOffset) EKLENDİ
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      >
        <ScrollView
          style={[styles.container, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // Klavye açıkken boşluğa basınca klavyeyi kapatması için
        >
          <View style={styles.profileHeader}>
            <Image
              source={
                resimler[aktifKullanici?.foto_kodu] || resimler["varsayilan"]
              }
              style={styles.bigAvatar}
            />
            <Text style={styles.title}>
              Hoş Geldin, {aktifKullanici?.adSoyad || aktifKullanici?.adsoyad}
            </Text>
            <Text style={styles.subtitle}>{aktifKullanici?.unvan}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {aktifKullanici?.departman} Birimi
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
            <Text style={styles.infoText}>Yönetici: Şevket Bey</Text>
            <Text style={styles.infoText}>
              Kalan İzin Günü: {kalanIzin} Gün
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kendime Notlar</Text>
            <TextInput
              style={styles.notInput}
              placeholder="Buraya kendinize ufak notlar alabilirsiniz..."
              placeholderTextColor="#B0A69D"
              multiline
              value={kisiselNot}
              onChangeText={notuKaydet}
            />
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const gruplanmisCalisanlar = birimlereGoreGrupla();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {yukleniyor ? (
        <ActivityIndicator
          size="large"
          color={RENKLER.pastelKahve}
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.mainHeading}>Şirket Çalışanları</Text>

          {Object.keys(gruplanmisCalisanlar).map((birimAdi) => (
            <View key={birimAdi} style={styles.departmentGroup}>
              <Text style={styles.departmentTitle}>ᐅ {birimAdi} Birimi</Text>

              {gruplanmisCalisanlar[birimAdi].map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.userCard}
                  onPress={() => router.push(`/personel/${item.id}`)}
                >
                  <Image
                    source={resimler[item.foto_kodu] || resimler["varsayilan"]}
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {item.adsoyad || item.adSoyad}
                    </Text>
                    <Text style={styles.userRole}>{item.unvan}</Text>
                  </View>
                  <Text style={styles.goIcon}>{"➔"}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RENKLER.arkaplan, padding: 15 },

  profileHeader: { alignItems: "center", marginBottom: 20 },
  bigAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: RENKLER.cizgi,
    marginBottom: 15,
  },
  title: { fontSize: 24, fontWeight: "bold", color: RENKLER.koyuKahve },
  subtitle: { fontSize: 16, color: RENKLER.pastelKahve, marginTop: 5 },
  badge: {
    backgroundColor: RENKLER.kutuArkaplan,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
  },
  badgeText: { color: RENKLER.koyuKahve, fontWeight: "bold" },

  card: {
    backgroundColor: RENKLER.kutuArkaplan,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: RENKLER.koyuKahve,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: RENKLER.cizgi,
    paddingBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: RENKLER.pastelKahve,
    marginBottom: 8,
    fontWeight: "500",
  },
  notInput: {
    backgroundColor: RENKLER.arkaplan,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    color: RENKLER.koyuKahve,
  },

  mainHeading: {
    fontSize: 26,
    fontWeight: "bold",
    color: RENKLER.koyuKahve,
    marginBottom: 20,
    textAlign: "center",
  },
  departmentGroup: { marginBottom: 25 },
  departmentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: RENKLER.pastelKahve,
    marginBottom: 10,
    letterSpacing: 1,
  },
  userCard: {
    flexDirection: "row",
    backgroundColor: RENKLER.kutuArkaplan,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "bold", color: RENKLER.koyuKahve },
  userRole: { fontSize: 13, color: RENKLER.pastelKahve, marginTop: 3 },
  goIcon: { fontSize: 18, color: RENKLER.pastelKahve, fontWeight: "bold" },
});
