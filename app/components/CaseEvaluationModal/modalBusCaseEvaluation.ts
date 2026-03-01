import { reactive } from "vue";



export interface CaseEvaluationModalBus {
  caseId: number | null;
  openModal: boolean;
  open: (caseId: number) => void;
  close: () => void;
}

export const caseEvaluationModalBus = reactive<CaseEvaluationModalBus>({
  caseId: null,
  openModal: false,

  open(caseId: number) {
    this.caseId = caseId;
    this.openModal = true;
  },

  close() {
    this.openModal = false;
    this.caseId = null;
  }

});
