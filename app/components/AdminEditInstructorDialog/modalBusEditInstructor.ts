import { reactive } from 'vue';
import type { Instructor } from '@/assets/interface/Instructor';

export interface EditModalBus {
  editData: any | null;
  openEditModal: boolean;
  openEdit: (data: Instructor) => void;
  closeEdit: () => void;
}

export const modalBus: EditModalBus = reactive ({
  editData: null as any,
  openEditModal: false,

  openEdit(data: Instructor) {
    this.editData = data;
    this.openEditModal = true;
  },

  closeEdit() {
    this.openEditModal = false;
    this.editData = null;
  },
});
