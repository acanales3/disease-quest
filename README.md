# DiseaseQuest

DiseaseQuest is a clinical case simulation platform designed to enhance medical students’ clinical reasoning skills through interactive, AI-driven, end-to-end patient scenarios. The platform supplements existing medical curriculum by providing asynchronous, realistic case studies that emphasize analytical thinking and decision-making rather than rote memorization.

---

## Introduction

The purpose of this document is to define the high-level business needs, desired outcomes, and core capabilities of DiseaseQuest. It outlines the stakeholders’ needs and the rationale behind the platform. Detailed feature behavior and implementation specifications are documented separately in the use-case and supplementary specification documents.

---

## Background

Medical students in the Burnett School of Medicine have expressed a need for more flexible, asynchronous study options. Existing solutions primarily reinforce knowledge-based concepts and do not adequately simulate real clinical reasoning or longitudinal patient care.

---

## Objectives

DiseaseQuest aims to:

1. Provide realistic, end-to-end virtual patient case simulations.
2. Strengthen clinical reasoning skills through guided and unguided decision-making.
3. Support self-paced, asynchronous learning for students.
4. Improve learner engagement through structured case progression and interactive elements.
5. Offer reusable agent-based architecture for consistent and scalable case development.

---

## System Overview

DiseaseQuest is built using a modern, modular, and extensible architecture that combines AI agents, a modern web application front end, serverless backend logic, and a vector-based knowledge retrieval system.

---

## Technology Stack

### Agent Builder / Agentic Workflow

- Platform: OpenAI Agent Platform  
  https://platform.openai.com/docs/overview
- Language: Python

### Front End

| Category           | Technology                                                     |
| ------------------ | -------------------------------------------------------------- |
| Language           | TypeScript                                                     |
| Framework          | Nuxt 4.2.0                                                     |
| Data Visualization | Mermaid.js — https://mermaid.js.org/                           |
| Component Library  | shadcn-vue — https://www.shadcn-vue.com/docs/introduction.html |

### Back End

- Framework: Nuxt server routes (`/server/api`)
- Serverless API endpoints for data handling, agent orchestration, and system logic

### Database and Storage

| Component            | Service                                       |
| -------------------- | --------------------------------------------- |
| Primary Database     | Supabase (PostgreSQL) — https://supabase.com/ |
| Authentication       | Supabase Auth                                 |
| Vector Store for RAG | Pinecone — https://www.pinecone.io/           |

### Deployment and DevOps

- Hosting Provider: Vercel — https://vercel.com/
- CI/CD pipelines configured for multi-environment deployments (development, staging, production)

---

## Local Development Setup

Coming soon

---

## License

Coming soon
