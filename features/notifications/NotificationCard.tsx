import { Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { COLORS } from "../../constants/colors";
import { LeaveRequest } from "../../types/leave";
import { getLeaveStatus } from "./notification.utils";

type Props = {
  request: LeaveRequest;
  isManager: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onReevaluate: () => void;
};

export function NotificationCard({ request, isManager, isExpanded, onToggle, onDelete, onReevaluate }: Props) {
  const status = isManager
    ? { text: `Durum: ${request.durum}`, color: request.durum === "Onaylandı" ? COLORS.success : COLORS.danger }
    : getLeaveStatus(request.baslangic_tarihi, request.bitis_tarihi, request.durum);

  const card = (
    <Pressable style={[styles.card, { borderLeftColor: status.color }]} onPress={isManager ? onToggle : undefined}>
      {isManager && <Text style={styles.name}>{request.personel?.adSoyad || request.personel?.adsoyad}</Text>}
      <Text style={styles.date}>{request.baslangic_tarihi} - {request.bitis_tarihi}</Text>
      <Text style={styles.days}>{request.gunsayisi} Günlük İzin Talebi</Text>
      <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
      {isManager && isExpanded && (
        <View style={styles.expanded}>
          <View style={styles.divider} />
          <Pressable style={styles.reevaluate} onPress={onReevaluate}>
            <Text style={styles.reevaluateText}>Tekrar Değerlendir</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );

  if (isManager) return card;
  return (
    <Swipeable renderRightActions={() => (
      <Pressable style={styles.deleteButton} onPress={onDelete}><Text style={styles.deleteText}>Sil</Text></Pressable>
    )}>{card}</Swipeable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, padding: 18, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 5 },
  name: { fontSize: 16, fontWeight: "bold", color: COLORS.darkBrown, marginBottom: 4 },
  date: { fontSize: 15, fontWeight: "bold", color: COLORS.darkBrown },
  days: { fontSize: 14, color: COLORS.brown, marginVertical: 6 },
  status: { fontSize: 14, fontWeight: "bold", marginTop: 4 },
  expanded: { marginTop: 15 },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 15 },
  reevaluate: { backgroundColor: COLORS.background, paddingVertical: 12, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: COLORS.brown },
  reevaluateText: { color: COLORS.darkBrown, fontWeight: "bold", fontSize: 15 },
  deleteButton: { backgroundColor: COLORS.delete, justifyContent: "center", alignItems: "center", width: 80, borderRadius: 10, marginBottom: 12, marginLeft: 10 },
  deleteText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
