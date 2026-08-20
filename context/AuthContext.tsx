import { createContext, useContext, useState } from "react";
import { supabase } from "../lib/supabase"; // Az önce açtığımız kapıyı buraya çağırdık!

const AuthContext = createContext<any>(null);
// uygulamının tüm sayflarını (childeren) buraya koy ,
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [aktifKullanici, setAktifKullanici] = useState<any>(null);

  //  GİRİŞ FONKSİYONU:  doğrudan Supabase'e soruyor , email şifre kontrolü varsa supabasede , tel hafızasına at
  const girisYap = async (email: string, sifre: string) => {
    try {
      // Supabase'deki 'personeller' tablosuna git ve bu email/sifre ile eşleşen var mı bak
      const { data, error } = await supabase
        .from("personeller")
        .select("*")
        .eq("email", email)
        .eq("sifre", sifre)
        .single();

      if (error || !data) {
        return { basarili: false, mesaj: "E-posta veya şifre hatalı!" };
      }

      // Veritabanından gelen kişiyi  hafızaya kaydet
      setAktifKullanici(data);
      return { basarili: true };
    } catch (err) {
      return { basarili: false, mesaj: "Sunucu bağlantı hatası." };
    }
  };

  return (
    <AuthContext.Provider
      value={{ aktifKullanici, setAktifKullanici, girisYap }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // diğer sayfalardaki verilere ulaşmak için  const{aktifKullanici}=useAuth()
  return useContext(AuthContext);
}
