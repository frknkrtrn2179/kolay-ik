// DİKKAT: Buradaki .png veya .jpg isimlerini senin klasöründeki gerçek resim isimleriyle değiştirmelisin!
export const resimler: Record<string, any> = {
  "p1": require("../../assets/images/furkan.jpg"), 
  "p2": require("../../assets/images/ayse.jpg"),
  "p3": require("../../assets/images/ceo.jpg"),
  "p4": require("../../assets/images/ahmet.jpg"),
  "p5": require("../../assets/images/zeynep.jpg"),
  "p6": require("../../assets/images/can.jpg"),
  
  // Eğer veritabanında foto_kodu boş olan biri olursa uygulama çökmesin diye varsayılan bir resim
  "varsayilan": require("../../assets/images/icon.png") 
};