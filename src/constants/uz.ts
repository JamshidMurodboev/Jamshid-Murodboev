export const UZ = {
  attendance: {
    title: "Davomat va vazifalar jadvali",
    tab: "Davomat",
    navLabel: "Davomat",
    addLesson: "+ Dars qo'shish",
    noLessons: "Hali dars qo'shilmagan",
    loadError: "Ma'lumot yuklashda xatolik",
    colNum: "№",
    colName: "Ism Familiya",
    colAttendance: "Davomat",
    colAssignment: "Vazifa",
    lessonDefault: (n: number) => `${n}-dars`,
    selectBatch: "Kursni tanlang",
    selectBatchPlaceholder: "Kurs tanlang",

    markDone: "Qatnashdi / Bajarildi",
    markMissed: "Qatnashmadi / Bajarilmadi",
    markExcused: "Uzurli sabab",
    markEmpty: "Belgilanmagan",

    legendDone: "Qatnashdi / Vazifa bajarildi",
    legendMissed: "Bajarilmadi / Darsda qatnashmadi",
    legendExcused: "Uzurli sabab",

    warningBadge: "Ogohlantirish",
    expelBadge: "Chiqarilishi kerak",

    noteDefault: (missed: number, excused: number) =>
      `Eslatma: ${missed} ta ✕ yoki ${excused} ta ! olganlar kursdan chiqariladi va to'lovi qaytarib berilmaydi.`,

    exportMenu: "Yuklab olish",
    exportPng: "PNG (Telegram post)",
    exportPdf: "PDF (A4 Landscape)",
    exportExcel: "Excel (.xlsx)",
    exportCsv: "CSV",
    exporting: "Yuklanmoqda…",

    saveError: "Saqlashda xatolik yuz berdi",
    deleteConfirm: "Darsni o'chirishni tasdiqlaysizmi?",
    editLesson: "Darsni tahrirlash",
    lessonTitle: "Dars nomi",
    save: "Saqlash",
    cancel: "Bekor qilish",
    delete: "O'chirish",
  },
} as const;
