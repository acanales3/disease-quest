import { reactive } from 'vue';
import type { Student } from '@/assets/interface/Student'

export interface EditModalBus {
  editData: any | null;
  openEditModal: boolean;
  openEdit: (data: Student) => void;
  closeEdit: () => void;
  saveEdit: (data: Student) => void;
}

export const modalBus: EditModalBus = reactive({
  editData: null as any, // data to edit
  openEditModal: false,     // controls visibility

  openEdit(data: Student) {
    this.editData = data;
    this.openEditModal = true;
  },

  closeEdit() {
    this.openEditModal = false;
    this.editData = null;
  },

  saveEdit(data: Student) {
    // TODO: save updated data to database and update frontend.
  }
});
