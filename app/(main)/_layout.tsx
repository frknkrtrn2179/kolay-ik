// DOSYA: app/(main)/_layout.tsx

import { View, Text, StyleSheet, Pressable } from "react-native";
import { Drawer } from "expo-router/drawer";
import { useAuth } from "../../context/AuthContext"; // Kimin giriş yaptığını öğrenmek için kendi yazdığımız depo
import { useRouter, usePathname } from "expo-router"; // Sayfalar arası geçiş yapmak ve hangi sayfada olduğumuzu bulmak için
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Telefonun çentik ve alt çizgi boşluklarını hesaplayan araç

// -- RENK PALETİMİZ (Krem ve Pastel Kahve Tonları) --
const RENKLER = {
  arkaplan: "#FAF6F0", // Açık krem rengi (Uygulamanın genel arka planı)
  koyuKahve: "#4A3C31", // Başlıklar ve önemli yazılar için
  pastelKahve: "#8D7B68", // Alt başlıklar ve normal yazılar için
  aktifKutu: "#EBE3D5", // Menüde seçili olan butonun arka plan rengi
  beyaz: "#FFFFFF", // Kartlar ve kutular için
  kirmizi: "#A75D5D", // Çıkış yap veya reddet gibi işlemler için pastel kırmızı
};

// --- YARDIMCI BİLEŞEN: KENDİ MENÜ BUTONUMUZ ---
// Her menü butonu için ayrı ayrı stil yazmamak adına, tek bir şablon .
//  Bu sayede aynı tarzda buton üretiyor.
const MenuButonu = ({
  isim,
  yol,
  aktifYol,
  basincaCalisacakFonksiyon,
}: any) => {
  const aktifMi = aktifYol === yol; // Eğer şu anki sayfa (aktifYol) butonun yoluna eşitse, bu buton seçilidir.

  return (
    <Pressable
      style={[styles.menuItem, aktifMi && styles.activeMenuItem]} // Eğer aktifse activeMenuItem stilini de ekle
      onPress={() => basincaCalisacakFonksiyon(yol)}
    >
      <Text style={[styles.menuItemText, aktifMi && styles.activeMenuText]}>
        {isim}
      </Text>
    </Pressable>
  );
};

// --- 1. YAN MENÜNÜN TASARIMI (Görünür Kısım) ---
function CustomDrawerContent(props: any) {
  // context/AuthContext.ts dosyasından sisteme giriş yapmış kişiyi ve çıkış yapma fonksiyonunu alıyoruz.
  const { aktifKullanici, setAktifKullanici } = useAuth();

  const router = useRouter(); // Sayfa değiştirmek için navigasyon aracı
  const pathname = usePathname(); // Şu an uygulamanın hangi sayfasında olduğumuzu söyler (örnek: "/takvim")
  const insets = useSafeAreaInsets(); // iOS çentiği veya Android alt çizgisi için güvenlik boşlukları

  // Giriş yapan kullanıcının rolü "Yonetici" mi diye kontrol ediyoruz. Sonuç true veya false çıkar.
  const isYonetici = aktifKullanici?.rol === "Yonetici";

  // Sayfa değiştirme işlemini kısaltmak için küçük bir fonksiyon
  const sayfayaGit = (yol: string) => {
    router.push(yol);
  };

  const cikisYap = () => {
    setAktifKullanici(null); // AuthContext'teki kullanıcıyı siler, sistem bizi otomatik Login'e atar.
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: RENKLER.arkaplan,
        paddingTop: insets.top, // Üst çentik boşluğu
        paddingBottom: insets.bottom, // Alt çizgi boşluğu
      }}
    >
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {/* LOGO VE MARKA ALANI */}
        <View style={styles.drawerHeader}>
          <Text style={styles.logoText}>Easy M.</Text>
        </View>

        {/* ÜST MENÜ LİSTESİ */}
        <View style={styles.menuContainer}>
          {/* ORTAK: Herkesin göreceği Ana Sayfa butonu */}
          <MenuButonu
            isim="Ana Sayfa"
            yol="/"
            aktifYol={pathname}
            basincaCalisacakFonksiyon={sayfayaGit}
          />

          {/* SADECE YÖNETİCİ GÖREBİLİR */}
          {isYonetici && (
            <MenuButonu
              isim="İzin Talepleri"
              yol="/yonetici"
              aktifYol={pathname}
              basincaCalisacakFonksiyon={sayfayaGit}
            />
          )}

          {/* SADECE PERSONEL GÖREBİLİR */}
          {!isYonetici && (
            <MenuButonu
              isim="İzin Talebi Oluştur"
              yol="/izin-talep"
              aktifYol={pathname}
              basincaCalisacakFonksiyon={sayfayaGit}
            />
          )}

          {/* ORTAK: Herkesin göreceği Takvim ve Bildirimler */}
          {isYonetici && (
            <MenuButonu
              isim="İzin Geçmişi"
              yol="/bildirimler"
              aktifYol={pathname}
              basincaCalisacakFonksiyon={sayfayaGit}
            />
          )}
          {!isYonetici && (
            <MenuButonu
              isim="Bildirimler"
              yol="/bildirimler"
              aktifYol={pathname}
              basincaCalisacakFonksiyon={sayfayaGit}
            />
          )}

          <MenuButonu
            isim="Takvim"
            yol="/takvim"
            aktifYol={pathname}
            basincaCalisacakFonksiyon={sayfayaGit}
          />
        </View>
      </DrawerContentScrollView>

      {/* ALT KISIM: ÇIKIŞ YAP BUTONU */}
      <View style={styles.footer}>
        <Pressable style={styles.footerItem} onPress={cikisYap}>
          <Text style={styles.footerText}>Çıkış Yap</Text>
        </Pressable>
      </View>
    </View>
  );
}

// --- 2. UYGULAMANIN ANA İSKELETİ VE BAŞLIK AYARLARI (Arka Plan) ---
export default function MainLayout() {
  const { aktifKullanici, setAktifKullanici } = useAuth();
  const router = useRouter();

  const isYonetici =
    aktifKullanici?.rol === "Yonetici" || aktifKullanici?.rol === "Yönetici";

  const cikisYap = () => {
    setAktifKullanici(null);
  };

  return (
    <Drawer
      key={aktifKullanici?.id || "Kullanici YOk"}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: RENKLER.arkaplan }, // Başlık çubuğunun arka plan rengi
        headerTintColor: RENKLER.koyuKahve, // Başlık çubuğundaki yazıların rengi
        headerShadowVisible: false, // Başlığın altındaki gölgeyi kaldırarak daha sade bir görünüm elde ediyoruz
        headerRight: () => (
          <Pressable onPress={cikisYap} style={{ marginRight: 15 }}>
            <Text
              style={{
                color: RENKLER.kirmizi,
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Çıkış
            </Text>
          </Pressable>
        ),
      }}
    >
      {/* 
        Aşağıdaki kısımlar sayfalara gidildiğinde ÜST BAŞLIKTA ne yazacağını belirler.
        Menüde butonunun olup olmamasıyla ilgisi yoktur. 
      */}
      <Drawer.Screen
        name="index"
        // Yönetici ana sayfadaysa üstte "Ana Sayfa", personel ana sayfadaysa "Profilim" yazar.
        options={{ title: isYonetici ? "Ana Sayfa" : "Profilim" }}
      />

      <Drawer.Screen
        name="yonetici"
        options={{ title: "İzin Talepleri" }} // Senin isteğine göre başlık değiştirildi
      />

      <Drawer.Screen
        name="izin-talep"
        options={{ title: "İzin Talebi Oluştur" }}
      />

      <Drawer.Screen
        name="bildirimler"
        options={{ title: isYonetici ? "İzin Geçmişi" : "Bildirimler" }}
      />
      <Drawer.Screen name="takvim" options={{ title: "Sirket Takvimi" }} />

      {/* 
        Personel Detay sayfası. Buna menüden değil, yöneticinin listesinden tıklanarak gidilir.
        O yüzden bu sayfanın sol üstüne çekmece menüsü yerine, geri dönebileceği bir OK işareti koyuyoruz.
      */}
    </Drawer>
  );
}

// --- STİLLER (Görünüm Ayarları) ---
const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#EBE3D5", // Çizgi rengi
  },
  logoText: {
    color: RENKLER.koyuKahve,
    fontSize: 24,
    fontWeight: "900",
  },
  menuContainer: {
    padding: 15,
  },
  // Kendi oluşturduğumuz  (MenuButonu) kullandığı stiller:
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 5,
  },
  activeMenuItem: {
    backgroundColor: RENKLER.aktifKutu,
  },
  menuItemText: {
    fontSize: 16,
    color: RENKLER.pastelKahve,
    fontWeight: "600",
  },
  activeMenuText: {
    color: RENKLER.koyuKahve,
    fontWeight: "bold",
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#EBE3D5",
    paddingBottom: 20, // SafeArea ile çakışmaması için biraz boşluk
  },
  footerItem: {
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 18,
    color: RENKLER.kirmizi,
    fontWeight: "600",
  },
});
