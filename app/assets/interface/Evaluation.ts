export interface Evaluation {
    id: number
    activityName: string
    date: string
    score: number
    feedback: string
}

export const evaluations: Evaluation[] = [
    {
        id: 1,
        activityName: 'Case Study: Pneumonia Diagnosis',
        date: '2024-11-15',
        score: 85,
        feedback:
            'Great diagnostic reasoning. Consider reviewing differential diagnoses.',
    },
    {
        id: 2,
        activityName: 'Lab Report Analysis',
        date: '2024-11-10',
        score: 92,
        feedback: 'Excellent interpretation of lab results. Well done!',
    },
    {
        id: 3,
        activityName: 'Case Study: Diabetes Management',
        date: '2024-11-05',
        score: 78,
        feedback:
            'Good understanding of disease management. Work on treatment optimization.',
    },
    {
        id: 4,
        activityName: 'Clinical Presentation Quiz',
        date: '2024-10-28',
        score: 88,
        feedback: 'Strong performance. Minor gaps in symptom recognition.',
    },
    {
        id: 5,
        activityName: 'Case Study: Cardiac Assessment',
        date: '2024-10-20',
        score: 81,
        feedback:
            'Solid work on patient assessment. Review cardiac pathophysiology.',
    },
    {
        id: 6,
        activityName: 'Documentation Exercise',
        date: '2024-10-15',
        score: 95,
        feedback:
            'Outstanding medical documentation. Excellent attention to detail.',
    },
    {
        id: 7,
        activityName: 'Case Study: Infection Management',
        date: '2024-10-08',
        score: 79,
        feedback:
            'Adequate antibiotic selection. Review current treatment guidelines.',
    },
    {
        id: 8,
        activityName: 'Emergency Response Simulation',
        date: '2024-10-01',
        score: 87,
        feedback: 'Good emergency management skills. Improve time management.',
    },
]
