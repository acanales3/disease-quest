import { reactive } from "vue";



export interface CaseEvaluationModalBus {
  caseId: number | null;
  classroomId: number | null;
  sessionId: string | null;
  openModal: boolean;
  open: (caseId: number, classroomId: number, sessionId: string) => void;
  close: () => void;
}

export const caseEvaluationModalBus = reactive<CaseEvaluationModalBus>({
  caseId: null,
  classroomId: null,
  sessionId: null,
  openModal: false,

  open(caseId: number, classroomId: number, sessionId: string) {
    this.caseId = caseId;
    this.classroomId = classroomId;
    this.sessionId = sessionId;
    this.openModal = true;
  },

  close() {
    this.openModal = false;
    this.caseId = null;
    this.classroomId = null;
    this.sessionId = null;
  }

});
