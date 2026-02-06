import { reactive } from 'vue';
import type { Instructor } from '~/assets/interface/Instructor';

export interface EditModalBus {
  editData: Instructor | null;
  openEditModal: boolean;
  openEdit: (data: Instructor) => void;
  closeEdit: () => void;
}

export const modalBus: EditModalBus = reactive ({
  editData: null,
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
