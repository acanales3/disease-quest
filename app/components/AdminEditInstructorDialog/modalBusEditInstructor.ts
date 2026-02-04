import { reactive } from 'vue';
import type { Instructor } from '@/components/InstructorDatatable/columns';

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
    this.editData = {
      id: data.userId,
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      email: data.email ?? '',
      school: data.school ?? '',
      classroom: typeof data.classroom === 'number' ? data.classroom : null,
      status: data.status ?? 'active',
    };
    this.openEditModal = true;
  },

  closeEdit() {
    this.openEditModal = false;
    this.editData = null;
  },
});
