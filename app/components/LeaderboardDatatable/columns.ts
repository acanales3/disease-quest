import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import { ArrowUpDown, ChevronDown } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';

export const baseColumns: ColumnDef<LeaderboardEntry>[] = [
  {
    accessorKey: 'position',
    header: () => h('div', { class: 'text-center font-normal text-black' }, 'Rank'),
    cell: ({ row }) => {
      const position = row.getValue('position') as number;
      return h('div', { class: 'text-center font-normal text-gray-600' }, position.toString());
    },
  },
  {
    accessorKey: 'nickname',
    header: () => h('div', { class: 'text-center font-normal text-black' }, 'Nickname'),
    cell: ({ row }) => {
      const nickname = row.getValue('nickname') as string;
      return h('div', { class: 'text-center font-normal text-gray-600' }, nickname);
    },
  },
  {
    accessorKey: 'score',
    header: () => h('div', { class: 'text-center font-normal text-black' }, 'Score'),
    cell: ({ row }) => {
      const score = row.getValue('score') as number;
      return h('div', { class: 'text-center font-normal text-gray-600' }, score.toString());
    },
  },
];

export const adminColumns: ColumnDef<LeaderboardEntry>[] = [
  ...baseColumns.slice(0,1),
  {
    accessorKey: "studentName",
    header: () => h("div", { class: "text-center font-normal text-black" }, "Student Name"),
    cell: ({ row }) => h("div", { class: "text-center font-normal text-gray-600" }, row.getValue("studentName")),
  },
  ...baseColumns.slice(1),
];

export interface LeaderboardEntry {
  id: number;
  studentId: number;
  classroomId: number;
  nickname: string;
  score: number;
  position?: number;
  studentName?: string;
}
