import { AuthProvider, useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import {
  useRouter,
  useSegments,
  useRootNavigationState,
  Slot,
} from "expo-router";

function RootLayoutNav() {
  const { aktifKullanici } = useAuth();
  const segments = useSegments(); // hangi klasör yolunda olduğumuzu söyler dizi olarak tutar.
  const router = useRouter(); //sayfalar arası geçiş
  const rootNavigationState = useRootNavigationState(); //wxpo routerın arkplanda navigasyon ağacını yükleyip yüklemediğini kontrol

  useEffect(() => {
    // önce ekranı hazırla  sonra yönledirme yap konrtolünü sağlıyor
    if (!rootNavigationState?.key) return;

    // Kullanıcı (auth) grubunda mı (yani login ekranında mı)?
    const inAuthGroup = segments[0] === "(auth)";

    setTimeout(() => {
      // useEffetct kontorlü sağlamış olsada ecpo router route tree yi bitirmemiş olabilir navigation state hatası almamak için , sistem arka planı için yönlendirmeleri en son sıraya atıyor
      if (!aktifKullanici && !inAuthGroup) {
        // Giriş yapmadıysa auth grubuna yönlendir
        router.replace("/(auth)/login"); // neden router.replace .push kullanabilirdik ma tel fiziksel geri tuşu güvenlik açığı oluşturuyor , .repalce geçmişi siler
      } else if (aktifKullanici && inAuthGroup) {
        // Giriş yaptıysa ana uygulamaya yönlendir
        router.replace("/(main)");
      }
    }, 1);
  }, [aktifKullanici, segments, rootNavigationState]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
