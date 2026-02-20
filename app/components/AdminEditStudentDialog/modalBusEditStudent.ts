import { reactive } from "vue";
import type { Student } from "@/assets/interface/Student";

export interface EditModalBus {
  editData: Student | null;
  openEditModal: boolean;
  openEdit: (data: Student) => void;
  closeEdit: () => void;
}

export const modalBus = reactive<EditModalBus>({
  editData: null,
  openEditModal: false,

  openEdit(data: Student) {
    this.editData = data;
    this.openEditModal = true;
  },

  closeEdit() {
    this.openEditModal = false;
    this.editData = null;
  },
});
