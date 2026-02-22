import { reactive } from "vue";
import type { Administrator } from "@/components/AdminDatatable/columns";

export interface EditModalBus {
  editData: Administrator | null;
  openEditModal: boolean;
  openEdit: (data: Administrator) => void;
  closeEdit: () => void;
}

export const modalBus = reactive<EditModalBus>({
  editData: null,
  openEditModal: false,

  openEdit(data: Administrator) {
    this.editData = data;
    this.openEditModal = true;
  },

  closeEdit() {
    this.openEditModal = false;
    this.editData = null;
  },
});
