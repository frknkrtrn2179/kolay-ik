// DOSYA: app/personel/[id].tsx

import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { resimler } from "../../assets/data/resimler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RENKLER = {
  arkaplan: "#FAF6F0",
  koyuKahve: "#4A3C31",
  pastelKahve: "#8D7B68",
  kutuArkaplan: "#FFFFFF",
  cizgi: "#EBE3D5",
};

export default function PersonelDetay() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [personel, setPersonel] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const personelGetir = async () => {
      const { data } = await supabase
        .from("personeller")
        .select("*")
        .eq("id", id)
        .single();

      if (data) setPersonel(data);
      setYukleniyor(false);
    };
    personelGetir();
  }, [id]);

  if (yukleniyor) {
    return (
      <View>
        <ActivityIndicator
          size="large"
          color={RENKLER.pastelKahve}
          style={{ marginTop: 50 }}
        />
      </View>
    );
  }

  if (!personel) {
    return <Text style={styles.errorText}>Personel bulunamadı.</Text>;
  }

  const ad = personel.adsoyad;
  const tel = personel.telefon;
  const mail = personel.email;
  const kalanIzin = personel.kalanizingunu;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.customHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{"<- Geri"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Personel Detayı</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.header}>
        <Image
          source={resimler[personel.foto_kodu] || resimler["varsayilan"]}
          style={styles.avatar}
        />
        <Text style={styles.name}>{ad}</Text>
        <Text style={styles.role}>{personel.unvan}</Text>
        <View style={styles.deptBadge}>
          <Text style={styles.deptText}>{personel.departman} Birimi</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>İletişim Bilgileri</Text>
        <Text style={styles.infoText}>Tel: {tel}</Text>
        <Text style={styles.infoText}>Mail: {mail}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>İzin Durumu</Text>
        <Text style={styles.infoText}>
          Kalan İzin: <Text style={styles.highlight}>{kalanIzin} Gün</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RENKLER.arkaplan,
    paddingHorizontal: 20,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    marginBottom: 10,
  },
  backButton: {
    paddingVertical: 5,
    paddingRight: 15,
  },
  backText: {
    fontSize: 18,
    color: RENKLER.koyuKahve,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: RENKLER.koyuKahve,
  },
  errorText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: RENKLER.pastelKahve,
  },
  header: {
    alignItems: "center",
    backgroundColor: RENKLER.kutuArkaplan,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: RENKLER.cizgi,
  },
  name: { fontSize: 22, fontWeight: "bold", color: RENKLER.koyuKahve },
  role: { fontSize: 16, color: RENKLER.pastelKahve, marginTop: 5 },
  deptBadge: {
    backgroundColor: RENKLER.arkaplan,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: RENKLER.cizgi,
  },
  deptText: { color: RENKLER.koyuKahve, fontWeight: "bold", fontSize: 14 },
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
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: RENKLER.cizgi,
    paddingBottom: 10,
  },
  infoText: { fontSize: 15, color: RENKLER.pastelKahve, marginBottom: 10 },
  highlight: { fontWeight: "bold", color: RENKLER.koyuKahve, fontSize: 16 },
});
