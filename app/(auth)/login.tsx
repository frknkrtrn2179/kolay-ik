import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator, // Yükleniyor ikonu
} from "react-native";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false); // bekleme state i

  //
  const { girisYap } = useAuth();

  const onGirisYap = async () => {
    // bilgi giriş kontrol
    if (!email || !sifre) {
      Alert.alert("Hata", "Lütfen e-posta ve şifre girin.");
      return;
    }

    setYukleniyor(true); // buton dönen çark

    const sonuc = await girisYap(email, sifre); // veritabanından cevap gelene kadar bekle----------------------<

    setYukleniyor(false); // Cevap gelince çarkı durduruyoruz

    if (sonuc.basarili) {
      // Kişi veritabanında varsa ana sayfaya ("/") yönlendir
      router.replace("/");
    } else {
      // Yoksa veritabanından gelen hata mesajını göster
      Alert.alert("Giriş Başarısız", sonuc.mesaj);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Easy M.</Text>
      <Text style={styles.subtitle}>Sisteme Giriş Yapın</Text>

      <TextInput
        style={styles.input}
        placeholder="E-posta adresiniz"
        placeholderTextColor="#4A3C31"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address" // klavyede @ .com çıkıyor
      />

      <TextInput
        style={styles.input}
        placeholder="Şifreniz"
        placeholderTextColor="#4A3C31"
        value={sifre}
        onChangeText={setSifre}
        secureTextEntry // şifre **
      />

      <Pressable
        style={[styles.button, yukleniyor && { opacity: 0.7 }]}
        onPress={onGirisYap}
        disabled={yukleniyor} // Yüklenirken butona art arda basılmasını engelliyoruz
      >
        {yukleniyor ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Giriş Yap</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FAF6F0",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#4A3C31",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#8D7B68",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#8D7B68",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    color: "#4A3C31",
  },
  button: {
    backgroundColor: "#8D7B68",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#FAF6F0", fontWeight: "bold", fontSize: 16 },
});
