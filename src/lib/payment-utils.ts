export function computeStatus(due: number, paid: number, dueDate: Date): "PAID" | "PENDING" | "OVERDUE" {
  if (paid >= due) return "PAID";
  if (new Date() > dueDate) return "OVERDUE";
  return "PENDING";
}
