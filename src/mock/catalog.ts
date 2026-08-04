import type { CatalogProduct, FormSection } from "../types";

export const CATALOG: CatalogProduct[] = [
  {
    code: "SRS-2",
    name: "Social Responsiveness Scale, Second Edition",
    shortName: "SRS-2",
    area: "Autism & Social Communication",
    description:
      "Measures social awareness, cognition, communication, motivation, and restricted interests/repetitive behaviors.",
    forms: [
      {
        id: "srs2-parent",
        name: "Parent/Caregiver Form",
        raterRoleDefault: "parent_caregiver",
        estimatedMinutes: 15,
      },
      {
        id: "srs2-teacher",
        name: "Teacher Form",
        raterRoleDefault: "teacher",
        estimatedMinutes: 15,
      },
    ],
  },
  {
    code: "ABAS-3",
    name: "Adaptive Behavior Assessment System, Third Edition",
    shortName: "ABAS-3",
    area: "Adaptive Behavior",
    description:
      "Assesses conceptual, social, and practical adaptive skills across home and school settings.",
    forms: [
      {
        id: "abas3-parent",
        name: "Parent Form",
        raterRoleDefault: "parent_caregiver",
        estimatedMinutes: 20,
      },
      {
        id: "abas3-teacher",
        name: "Teacher Form",
        raterRoleDefault: "teacher",
        estimatedMinutes: 20,
      },
    ],
  },
  {
    code: "SPM-2",
    name: "Sensory Processing Measure, Second Edition",
    shortName: "SPM-2",
    area: "Sensory Processing",
    description:
      "Evaluates sensory processing, praxis, and social participation at home and school.",
    forms: [
      {
        id: "spm2-home",
        name: "Home Form",
        raterRoleDefault: "parent_caregiver",
        estimatedMinutes: 20,
      },
      {
        id: "spm2-school",
        name: "School Form",
        raterRoleDefault: "teacher",
        estimatedMinutes: 20,
      },
    ],
  },
  {
    code: "DP-4",
    name: "Developmental Profile 4",
    shortName: "DP-4",
    area: "Development",
    description:
      "Screens developmental functioning across physical, adaptive, social-emotional, cognitive, and communication domains.",
    forms: [
      {
        id: "dp4-parent",
        name: "Parent/Caregiver Interview",
        raterRoleDefault: "parent_caregiver",
        estimatedMinutes: 25,
      },
    ],
  },
  {
    code: "CASL-2",
    name: "Comprehensive Assessment of Spoken Language, Second Edition",
    shortName: "CASL-2",
    area: "Speech & Language",
    description:
      "Measures oral language skills; clinician-entered demo form for this portal.",
    forms: [
      {
        id: "casl2-clinician",
        name: "Clinician Record Form (Demo)",
        raterRoleDefault: "clinician",
        estimatedMinutes: 30,
      },
    ],
  },
];

const LIKERT = ["Never", "Sometimes", "Often", "Almost Always"];

/** Shared short mock instrument used for all forms in the demo. */
export function getFormSections(formName: string): FormSection[] {
  return [
    {
      id: "sec-awareness",
      title: "Social Awareness & Engagement",
      items: [
        {
          id: "q1",
          text: `Notices when others are upset or need help (${formName}).`,
          scale: LIKERT,
        },
        {
          id: "q2",
          text: "Initiates appropriate social interaction with peers or adults.",
          scale: LIKERT,
        },
        {
          id: "q3",
          text: "Understands unwritten social rules in group settings.",
          scale: LIKERT,
        },
      ],
    },
    {
      id: "sec-adaptive",
      title: "Daily Living & Adaptive Skills",
      items: [
        {
          id: "q4",
          text: "Completes multi-step routines with age-expected independence.",
          scale: LIKERT,
        },
        {
          id: "q5",
          text: "Manages transitions between activities without significant distress.",
          scale: LIKERT,
        },
        {
          id: "q6",
          text: "Uses available supports when tasks become difficult.",
          scale: LIKERT,
        },
      ],
    },
    {
      id: "sec-communication",
      title: "Communication & Flexibility",
      items: [
        {
          id: "q7",
          text: "Expresses needs and ideas clearly for the situation.",
          scale: LIKERT,
        },
        {
          id: "q8",
          text: "Adjusts behavior when given feedback.",
          scale: LIKERT,
        },
        {
          id: "q9",
          text: "Tolerates changes in plans or unexpected events.",
          scale: LIKERT,
        },
      ],
    },
  ];
}

export function getProduct(code: string): CatalogProduct | undefined {
  return CATALOG.find((p) => p.code === code);
}
