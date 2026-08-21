import { COLORS } from "../../constants/colors";
import { LeaveStatus } from "../../types/leave";

export function getLeaveStatus(startDate: string, endDate: string, status: LeaveStatus) {
  if (status === "Bekliyor") return { text: "Yönetici onayı bekleniyor...", color: COLORS.warning };
  if (status === "Reddedildi") return { text: "Talebiniz onaylanmadı.", color: COLORS.danger };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilStart = Math.ceil((new Date(startDate).getTime() - today.getTime()) / 86_400_000);
  const daysUntilEnd = Math.ceil((new Date(endDate).getTime() - today.getTime()) / 86_400_000);

  if (daysUntilStart > 0) return { text: `Başlamasına ${daysUntilStart} gün kaldı.`, color: COLORS.success };
  if (daysUntilEnd >= 0) return { text: `Bitmesine ${daysUntilEnd} gün kaldı.`, color: COLORS.success };
  return { text: "İzin süresi tamamlandı.", color: COLORS.brown };
}
