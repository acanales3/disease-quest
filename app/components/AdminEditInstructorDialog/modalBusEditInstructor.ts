import { reactive } from 'vue';
import type { InstructorEdit } from '~/assets/interface/InstructorEdit';

export interface EditModalBus {
  editData: InstructorEdit | null;
  openEditModal: boolean;
  openEdit: (data: InstructorEdit) => void;
  closeEdit: () => void;
}

export const modalBus: EditModalBus = reactive ({
  editData: null,
  openEditModal: false,

  openEdit(data: InstructorEdit) {
    this.editData = data;
    this.openEditModal = true;
  },

  closeEdit() {
    this.openEditModal = false;
    this.editData = null;
  },
});
