-- Seed: Amelia Thompson - Acute Bacterial Meningitis case
-- Run this after the migration to insert the case data

INSERT INTO public.cases (name, description, content)
VALUES (
  'Amelia Thompson — Acute Bacterial Meningitis',
  'A 9-month-old previously healthy infant presenting with acute high-grade fever unresponsive to acetaminophen, lethargy, and systemic illness. High acuity pediatric sepsis/meningitis case for MS1-MS3 learners. Estimated 45 minutes.',
  '{
    "schema_version": "1.0",
    "case_id": "DQ-ABM-0001",
    "title": "Amelia Thompson — Acute Bacterial Meningitis (Streptococcus pneumoniae)",
    "setting": "Emergency Department → PICU",
    "learner_level": ["MS1", "MS2", "MS3"],
    "estimated_minutes": 45,
    "difficulty": "High acuity pediatric sepsis/meningitis",
    "core_skills": [
      "clinical_reasoning_whole_task",
      "pediatric_emergency_triage",
      "infectious_vs_noninfectious_meningitis",
      "diagnostic_strategy_and_interpretation",
      "antimicrobial_selection_and_justification",
      "complication_prediction_and_prevention",
      "patient_family_communication",
      "interprofessional_collaboration"
    ],
    "correct_diagnosis": "Acute Bacterial Meningitis due to Streptococcus pneumoniae",
    "key_findings": [
      "High fever unresponsive to antipyretics",
      "Lethargy and decreased responsiveness",
      "Bulging anterior fontanelle",
      "Petechial rash on lower extremities",
      "Positive Brudzinski sign",
      "Hypotension with prolonged capillary refill (shock)",
      "CSF showing neutrophilic pleocytosis, low glucose, high protein",
      "Gram-positive diplococci on CSF Gram stain"
    ],
    "success_conditions": [
      "student_identifies_ABM_and_initiates_appropriate_empiric_therapy",
      "student_stabilizes_shock_seizure_scenario_when_triggered",
      "student_deescalates_to_definitive_therapy_after_cultures",
      "student_addresses_prevention_vaccine_family_education"
    ],
    "failure_conditions": [
      "persistent_delay_in_antibiotics_no_shock_management",
      "unsafe_management_decisions_no_airway_support_during_apnea"
    ],
    "initial_vitals": {
      "temp_f": 103.5,
      "bp_systolic": 70,
      "bp_diastolic": 50,
      "hr_bpm": 180,
      "rr_bpm": 50,
      "spo2_percent": 98,
      "cap_refill_sec": 6
    },
    "initial_patient_state": {
      "patient_id": "amelia_thompson_001",
      "name": "Amelia Thompson",
      "age_months": 9,
      "sex": "Female",
      "chief_complaint": "Fever 103°F unresponsive to acetaminophen; lethargy; decreased appetite",
      "history_of_present_illness": "9-month-old female brought in by parents with 2-day history of fever up to 103°F that has not responded to acetaminophen. Parents note she has been increasingly lethargic, not feeding well, and seems irritable when picked up. They noticed some spots on her legs this morning. Mother works minimum wage job with no health benefits.",
      "past_medical_history": ["Full-term delivery", "Normal development", "No prior hospitalizations"],
      "medications": ["Acetaminophen PRN for fever"],
      "allergies": ["NKDA"],
      "family_history": ["No significant family history"],
      "social_history": {
        "living_situation": "Lives with parents in rural area",
        "daycare": "Attends daycare 3 days/week",
        "siblings": "No siblings",
        "water_source": "Well water",
        "heating": "Wood burning stove"
      },
      "social_context": {
        "rural": true,
        "limited_primary_care_access": true,
        "well_water": true,
        "wood_burning_stove": true,
        "daycare_exposure": true,
        "vaccines_up_to_date": true,
        "no_pets": true,
        "no_tobacco": true
      },
      "ros_positives": ["fatigue", "lethargy", "decreased appetite", "rash on legs", "irritability with handling"],
      "ros_negatives": [
        "no cough", "no vomiting", "no diarrhea", "no prior seizures", "no recent URI symptoms",
        "no weight loss", "no wheezing", "no murmurs", "no joint pain", "no bruising"
      ],
      "emotional_state": "Parents are anxious and worried",
      "cooperation_level": "cooperative",
      "physiology": {
        "vitals": {
          "temp_f": 103.5,
          "bp_systolic": 70,
          "bp_diastolic": 50,
          "hr_bpm": 180,
          "rr_bpm": 50,
          "spo2_percent": 98,
          "cap_refill_sec": 6.0,
          "weight_kg": 8.5
        },
        "mental_status": "lethargic",
        "neuro_signs": ["neck_tenderness", "brudzinski_positive", "bulging_fontanelle"],
        "rash": "petechiae lower legs",
        "skin_findings": ["petechial rash on lower extremities", "pale", "mottled"],
        "has_shock": false,
        "has_seizure": false,
        "has_respiratory_failure": false,
        "is_intubated": false,
        "antibiotics_started": false,
        "fluids_given": false,
        "vasopressors_started": false,
        "dexamethasone_given": false
      }
    },
    "learning_objectives": [
      {"id": "LO1", "text": "Analyze key clinical signs/symptoms to formulate a prioritized differential diagnosis for ABM.", "tags": ["differential", "problem_representation"]},
      {"id": "LO2", "text": "Evaluate diagnostic criteria to differentiate non-infectious vs infectious meningitis (bacterial/viral/fungal/parasitic).", "tags": ["classification", "diagnostic_criteria"]},
      {"id": "LO3", "text": "Design a step-wise approach to laboratory investigations for suspected ABM.", "tags": ["diagnostic_strategy", "labs"]},
      {"id": "LO4", "text": "Interpret laboratory findings to narrow the etiologic agent in ABM.", "tags": ["interpretation", "etiology"]},
      {"id": "LO5", "text": "Classify potential bacterial pathogens causing ABM based on microbiological properties.", "tags": ["microbiology", "pathogen_classification"]},
      {"id": "LO6", "text": "Assess epidemiology of ABM by age group and identify risk factors.", "tags": ["epidemiology", "risk_factors"]},
      {"id": "LO7", "text": "Differentiate pathogens by virulence factors, pathogenesis, and clinical presentation.", "tags": ["virulence", "pathogenesis", "presentation"]},
      {"id": "LO8", "text": "Explain pathophysiology behind ABM symptoms by integrating bacterial properties with clinical findings.", "tags": ["pathophysiology", "integration"]},
      {"id": "LO9", "text": "Predict complications of untreated/improperly managed ABM.", "tags": ["complications", "safety"]},
      {"id": "LO10", "text": "Relate presentation to classic ABM symptoms and complications.", "tags": ["classic_presentation", "complications"]},
      {"id": "LO11", "text": "Construct empiric + definitive antibiotic plan based on presentation and labs.", "tags": ["treatment", "empiric", "definitive"]},
      {"id": "LO12", "text": "Justify antibiotic therapy based on suspected/confirmed etiology.", "tags": ["antibiotic_justification", "stewardship"]},
      {"id": "LO13", "text": "Propose hospital/community preventive measures to prevent spread.", "tags": ["infection_control", "public_health"]},
      {"id": "LO14", "text": "Appraise role of vaccines in ABM prevention.", "tags": ["vaccines", "prevention"]},
      {"id": "LO15", "text": "Collaborate interprofessionally for rapid diagnosis/management/prevention.", "tags": ["teamwork", "systems"]},
      {"id": "LO16", "text": "Educate patients/families on early intervention in suspected ABM.", "tags": ["communication", "education"]}
    ],
    "disclosures": [
      {
        "id": "D1", "title": "Chief Complaint & History",
        "unlock": {"type": "START"},
        "content": {
          "chief_complaint": "Fever 103°F unresponsive to acetaminophen; lethargy; decreased appetite",
          "history_narrative": "9-month-old Amelia''s parents discovered her radiating an unsettling warmth. A rectal thermometer reading revealed a fever spiking to 103°F, unresponsive to acetaminophen. Amelia''s condition, void of common cold markers, propelled her family to the ED. Mother (27yo) balances a minimum-wage job without health benefits. Rural setting with well water and wood-burning stove.",
          "context": {"rural_limited_care": true, "daycare": true, "vaccines_up_to_date": true, "no_uri_symptoms": true, "environment": "Well water, wood-burning stove, no pets, no tobacco"},
          "ros_summary": {
            "positives": ["fatigue", "lethargy", "current_rash"],
            "negatives": ["no_cough", "no_vomiting", "no_diarrhea", "no_prior_seizures", "no_weight_loss", "no_wheezing", "no_murmurs", "no_joint_pain", "no_bruising"]
          }
        },
        "maps_to_objectives": ["LO1", "LO2", "LO6", "LO10", "LO16"]
      },
      {
        "id": "D2", "title": "Physical Exam & Vitals",
        "unlock": {"type": "ACTION_OR_TIME", "condition": "student_requests_exam OR time >= 2"},
        "content": {
          "vitals": {"temp_f": 103.5, "bp_mmHg": "70/50", "hr_bpm": 180, "rr_bpm": 50, "spo2_percent": 98, "weight_kg": 8.5, "length_cm": 70, "head_circ_cm": 45, "cap_refill_sec": 6},
          "general": "Lies quietly, vibrancy dimmed to pale quietude, vulnerable appearance.",
          "heent": "Bulging anterior fontanelle. Fundi difficult to visualize but red reflex positive. TMs normal. Nose clear. Throat unremarkable.",
          "chest": "Normal breath sounds.",
          "heart": "Regular rate and rhythm, no murmurs.",
          "abdomen": "No organomegaly or masses.",
          "skin": "Pale. Petechial rash on lower legs bilaterally.",
          "neurologic": "Pronounced lethargy, minimal response. Agitated when neck palpated (Brudzinski''s sign positive). No focal signs.",
          "key_findings": ["bulging_anterior_fontanelle", "petechial_rash_lower_legs", "lethargy_minimal_response", "neck_palpation_agitation", "brudzinski_positive"]
        },
        "maps_to_objectives": ["LO1", "LO2", "LO8", "LO9", "LO10"]
      },
      {
        "id": "D3", "title": "Initial ED Orders",
        "unlock": {"type": "STATE", "condition": "student_places_orders OR time >= 5"},
        "content": {
          "ordered_tests_default": ["cbc", "chem7", "coags", "lfts", "ua", "crp"],
          "note": "Blood cultures should be ordered before antibiotics (scoring event)."
        },
        "maps_to_objectives": ["LO3", "LO15"]
      },
      {
        "id": "D4", "title": "Initial Lab Results",
        "unlock": {"type": "ACTION", "condition": "student_orders_any_of([''cbc'',''chem7'',''coags'',''lfts'',''ua'',''crp''])"},
        "content": {
          "labs": {
            "cbc": {"wbc": "82,000/µL", "bands_percent": "20%", "note": "Severe leukocytosis with left shift"},
            "crp_mg_L": 48,
            "chem7": {"sodium_mEq_L": "122 (LOW)", "chloride_mEq_L": "117 (HIGH)", "note": "Hyponatremia (possible SIADH), Hyperchloremia"},
            "coags": {"pt_sec": "20 (HIGH)", "inr": "2.1 (HIGH)", "note": "Coagulopathy / early DIC"},
            "lfts": {"ast": "85 (HIGH)", "alt": "90 (HIGH)"},
            "ua": {"note": "Unremarkable, renal function preserved"}
          }
        },
        "maps_to_objectives": ["LO3", "LO4", "LO8", "LO9"]
      },
      {
        "id": "D5", "title": "Empiric Management + ICU Admission",
        "unlock": {"type": "ACTION_OR_TIME", "condition": "student_flags_meningitis OR time >= 10"},
        "content": {
          "narrative": "Decision to admit to ICU, draw blood cultures, and initiate empirical antibiotic therapy. LP planned as no contraindications found.",
          "recommended_actions_expected": ["blood_cultures", "start_empiric_antibiotics", "consider_dexamethasone_timing", "PICU_admission", "LP_if_no_contraindications"],
          "empiric_regimen_reference": {"antibiotics": ["ceftriaxone", "vancomycin"], "adjunct": ["dexamethasone"]}
        },
        "maps_to_objectives": ["LO11", "LO12", "LO15", "LO9"]
      },
      {
        "id": "D6", "title": "CSF Studies + Gram Stain",
        "unlock": {"type": "ACTION", "condition": "student_orders_lp_and_csf_panel"},
        "content": {
          "csf_panel_available": ["opening_pressure", "cell_count_with_diff", "glucose", "protein", "lactate", "gram_stain", "culture", "pcr_or_latex"],
          "gram_stain": "gram_positive_diplococci",
          "cultures": "pending"
        },
        "maps_to_objectives": ["LO3", "LO4", "LO5", "LO7", "LO8"]
      },
      {
        "id": "D7", "title": "Final CSF Pattern + Biomarkers",
        "unlock": {"type": "ACTION_OR_TIME", "condition": "student_reviews_csf_results OR time >= 18"},
        "content": {
          "csf_pattern": {"opening_pressure": "225 mmH2O (HIGH)", "wbc": "5,000/µL (HIGH)", "neutrophils_percent": "High", "glucose": "10 mg/dL (LOW)", "protein": "200 mg/dL (HIGH)"},
          "biomarkers": {"procalcitonin": "2.8 ng/mL (HIGH)", "repeat_crp": "120 mg/L (HIGH)", "csf_lactate": "High"}
        },
        "maps_to_objectives": ["LO4", "LO7", "LO8", "LO9", "LO10", "LO11"]
      },
      {
        "id": "D8", "title": "Acute Deterioration (Seizure + Shock)",
        "unlock": {"type": "EVENT", "condition": "event == ''seizure_and_shock_event''"},
        "content": {
          "narrative": "Suddenly becomes apneic and cyanotic. Seizures wrack her body. Arterial line placed -> BP 45 systolic. Critical state of shock.",
          "events": ["apnea_cyanosis", "seizures", "bp_systolic_45"],
          "required_management": ["airway_support", "benzodiazepine_for_seizure", "fluid_bolus", "vasopressors_if_fluid_refractory"]
        },
        "maps_to_objectives": ["LO9", "LO11", "LO15", "LO16"]
      },
      {
        "id": "D9", "title": "PICU Management",
        "unlock": {"type": "ACTION_OR_STAGE", "condition": "student_transfers_to_picu OR time >= 22"},
        "content": {
          "interventions": ["bvm_oxygen_100", "intubation_mechanical_ventilation", "diazepam_0_15_mg_per_kg_IV", "LR_350_ml_no_response", "consider_vasopressors"],
          "imaging": {"chest_xray": "clear; ETT positioned"},
          "abg": "within_normal_limits"
        },
        "maps_to_objectives": ["LO9", "LO11", "LO15"]
      },
      {
        "id": "D10", "title": "Day 2 Stabilization + Parent Communication",
        "unlock": {"type": "TIME", "condition": "time >= 28"},
        "content": {
          "hemodynamics": {"dopamine": "20 mcg/kg/min", "epinephrine": "0.5 mcg/kg/min"},
          "parent_questions": ["what_is_meningitis", "how_did_she_get_it", "survival_chances", "long_term_effects", "is_anyone_else_at_risk"]
        },
        "maps_to_objectives": ["LO9", "LO13", "LO16", "LO15"]
      },
      {
        "id": "D11", "title": "Day 3 PICU Monitoring",
        "unlock": {"type": "TIME", "condition": "time >= 33"},
        "content": {
          "monitoring_goals": {"sbp_target_mmHg": 80, "urine_output_target": "500 mL/m^2/day", "fluid_strategy": "avoid cerebral edema; ensure perfusion"}
        },
        "maps_to_objectives": ["LO9", "LO15"]
      },
      {
        "id": "D12", "title": "Repeat Labs + Culture Results",
        "unlock": {"type": "TIME_OR_ACTION", "condition": "time >= 38 OR student_checks_cultures"},
        "content": {
          "cultures": {"csf": "Streptococcus pneumoniae", "blood": "Streptococcus pneumoniae"},
          "susceptibilities": {"ceftriaxone": "Sensitive", "vancomycin": "Sensitive"},
          "repeat_labs": {"cbc": "WBC improving", "coags": "Improving", "chem7": "Na improving"}
        },
        "maps_to_objectives": ["LO4", "LO5", "LO7", "LO11", "LO12"]
      },
      {
        "id": "D13", "title": "Day 4 ID Consult + Antibiotic De-escalation",
        "unlock": {"type": "ACTION", "condition": "student_requests_id_consult OR time >= 42"},
        "content": {
          "definitive_therapy": {
            "continue": {"drug": "ceftriaxone", "dose": "50 mg/kg/dose IV q12h (max 2000 mg/dose)", "duration_days": 10},
            "stop": "vancomycin (after susceptibility confirmed)",
            "interventions": "FFP for coagulopathy"
          },
          "stewardship_note": "Narrow when pathogen + susceptibility confirmed.",
          "prevention_discussion": {
            "pathogen": "S. pneumoniae",
            "transmission": "respiratory droplets; close contact risk in childcare",
            "prophylaxis_note": "Rifampin prophylaxis for contacts (babysitter, other children)"
          }
        },
        "maps_to_objectives": ["LO11", "LO12", "LO13", "LO14", "LO15", "LO16"]
      },
      {
        "id": "D14", "title": "Discharge + Follow-up + Sequelae Screening",
        "unlock": {"type": "TIME", "condition": "time >= 50"},
        "content": {
          "course": ["weaned_off_pressors_by_day_3", "extubated", "transferred_to_ward", "completed_10_days_targeted_therapy", "discharged"],
          "follow_up": ["audiology_referral_for_hearing_loss_screen", "monitor neurodevelopmental outcomes (cognitive, speech, motor)"],
          "education_points": ["early medical intervention for fever/lethargy", "vaccine reinforcement and routine follow-up"]
        },
        "maps_to_objectives": ["LO9", "LO10", "LO13", "LO14", "LO16"]
      }
    ],
    "diagnostic_tests": [
      {"id": "cbc", "display_name": "CBC with differential", "cost_points": 2, "tat_minutes": 1, "result_schema": ["wbc", "neutrophils_percent", "bands_percent", "hgb", "platelets"]},
      {"id": "chem7", "display_name": "Basic metabolic panel (Chem 7)", "cost_points": 2, "tat_minutes": 1, "result_schema": ["sodium", "potassium", "chloride", "bicarb", "bun", "creatinine", "glucose"]},
      {"id": "crp", "display_name": "C-Reactive Protein", "cost_points": 1, "tat_minutes": 1, "result_schema": ["crp_mg_L"]},
      {"id": "procalcitonin", "display_name": "Procalcitonin", "cost_points": 2, "tat_minutes": 1, "result_schema": ["pct_ng_mL"]},
      {"id": "coags", "display_name": "Coagulation studies", "cost_points": 2, "tat_minutes": 1, "result_schema": ["pt", "inr", "ptt", "fibrinogen", "d_dimer"]},
      {"id": "lfts", "display_name": "Liver function tests", "cost_points": 1, "tat_minutes": 1, "result_schema": ["ast", "alt", "bilirubin_total"]},
      {"id": "ua", "display_name": "Urinalysis", "cost_points": 1, "tat_minutes": 1, "result_schema": ["leukocyte_esterase", "nitrites", "wbc", "rbc", "specific_gravity"]},
      {"id": "blood_cultures", "display_name": "Blood cultures x2", "cost_points": 3, "tat_minutes": 1, "result_schema": ["organism", "time_to_positivity", "susceptibilities"]},
      {"id": "lp_csf_panel", "display_name": "Lumbar puncture + CSF panel", "cost_points": 5, "tat_minutes": 1, "prerequisites": ["hemodynamic_stability_check", "no_focal_neuro_deficits"], "result_schema": ["opening_pressure", "wbc", "diff_neutrophils_percent", "glucose", "protein", "lactate", "gram_stain", "culture", "pcr_or_latex"]},
      {"id": "abg", "display_name": "Arterial blood gas", "cost_points": 2, "tat_minutes": 1, "result_schema": ["pH", "pCO2", "pO2", "HCO3", "lactate"]},
      {"id": "chest_xray", "display_name": "Chest X-ray", "cost_points": 2, "tat_minutes": 1, "result_schema": ["findings", "ett_position"]}
    ],
    "test_results": {
      "cbc": {
        "wbc": "82,000/µL (HIGH)", "wbc_value": 82000, "neutrophils_percent": "55%", "bands_percent": "20% (LEFT SHIFT)",
        "lymphocytes_percent": "17%", "monocytes_percent": "5%", "eosinophils_percent": "2%", "basophils_percent": "1%",
        "hemoglobin": "13 g/dL", "hematocrit": "37%", "platelets": "82,000/µL (LOW)",
        "interpretation": "Severe leukocytosis with significant left shift and thrombocytopenia, concerning for sepsis/DIC risk"
      },
      "chem7": {
        "sodium": "122 mmol/L (LOW)", "potassium": "4.5 mmol/L", "chloride": "117 mmol/L (HIGH)",
        "bicarbonate": "18 mmol/L (LOW)", "bun": "14 mg/dL", "creatinine": "0.8 mg/dL (HIGH)", "glucose": "68 mg/dL",
        "interpretation": "Hyponatremia (possible SIADH), Hyperchloremia, Mild metabolic acidosis, Mild creatinine elevation"
      },
      "crp": {"crp_mg_L": "48 mg/L (HIGH) -> 120 mg/L", "reference_range": "<10 mg/L", "interpretation": "Severe bacterial inflammation"},
      "procalcitonin": {"pct_ng_mL": "2.8 ng/mL (HIGH)", "reference_range": "<0.05 ng/mL", "interpretation": "Strongly suggestive of bacterial infection"},
      "coags": {"pt": "20 seconds (HIGH)", "inr": "2.1 (HIGH)", "ptt": "40 seconds (HIGH)", "interpretation": "Coagulopathy / early DIC, Sepsis-associated coagulopathy"},
      "lfts": {"ast": "85 U/L (HIGH)", "alt": "90 U/L (HIGH)", "alp": "100 U/L", "bilirubin_total": "1.0 mg/dL", "bilirubin_direct": "0.2 mg/dL", "albumin": "4.0 g/dL", "interpretation": "Reactive hepatitis, Systemic inflammation"},
      "ua": {"appearance": "Clear", "specific_gravity": "1.015", "pH": "N/A", "protein": "Negative", "glucose": "Negative", "blood": "Negative", "wbc": "2/hpf", "rbc": "1/hpf", "bacteria": "Negative", "interpretation": "Renal system preserved, No UTI"},
      "blood_cultures": {
        "status": "Positive", "organism": "Streptococcus pneumoniae",
        "susceptibilities": {"ceftriaxone": "Sensitive", "cefotaxime": "Sensitive", "vancomycin": "Sensitive", "penicillin_g": "Resistant", "ampicillin": "Resistant", "meropenem": "Sensitive"},
        "interpretation": "Streptococcus pneumoniae bacteremia confirmed"
      },
      "lp_csf_panel": {
        "opening_pressure": "225 mmH2O (HIGH, normal <160)", "appearance": "Cloudy",
        "wbc": "5,000/µL (HIGH, normal 0-20)", "glucose": "10 mg/dL (LOW, normal 50-75)",
        "protein": "200 mg/dL (HIGH, normal 15-70)", "gram_stain": "Gram-positive diplococci",
        "culture": "Pending -> Streptococcus pneumoniae",
        "interpretation": "Bacterial meningitis (Strep. pneumoniae), BBB disruption, bacterial consumption"
      },
      "abg": {
        "pH": "7.32 (LOW)", "pCO2": "32 mmHg (LOW)", "pO2": "92 mmHg",
        "HCO3": "16 mEq/L (LOW)", "base_excess": "-8 mEq/L", "lactate": "4.2 mmol/L (HIGH)",
        "interpretation": "Partially compensated metabolic acidosis with elevated lactate, consistent with sepsis/shock"
      },
      "chest_xray": {
        "findings": "Clear lung fields bilaterally. No infiltrates or effusions. Heart size normal.",
        "ett_position": "N/A (if intubated: ETT tip 2 cm above carina, appropriately positioned)",
        "interpretation": "No pulmonary pathology identified"
      }
    },
    "interventions": [
      {"id": "start_empiric_abx", "display_name": "Start empiric antibiotics for pediatric ABM", "options": ["ceftriaxone", "vancomycin"], "safety_rules": ["penalty_if_delayed_after_meningitis_suspected"]},
      {"id": "give_dexamethasone", "display_name": "Administer dexamethasone adjunct", "timing_rule": "best_before_or_with_first_antibiotic_dose"},
      {"id": "fluid_bolus", "display_name": "Fluid bolus for shock", "dose_reference": "20 mL/kg NS or LR"},
      {"id": "vasopressors", "display_name": "Initiate vasopressors for fluid-refractory shock", "options": ["dopamine", "epinephrine"]},
      {"id": "seizure_abort", "display_name": "Abort seizure (benzodiazepine)", "options": ["diazepam 0.15 mg/kg IV", "lorazepam 0.1 mg/kg IV"]},
      {"id": "intubate", "display_name": "Endotracheal intubation + mechanical ventilation"},
      {"id": "deescalate_antibiotics", "display_name": "De-escalate to definitive therapy after culture/susceptibility", "rules": ["stop_vancomycin_if_pneumococcus_susceptible_to_ceftriaxone"]},
      {"id": "infection_control", "display_name": "Institute infection control measures", "options": ["droplet_precautions", "hand_hygiene", "notify_public_health_if_required"]},
      {"id": "family_education", "display_name": "Provide parent education and discharge counseling", "topics": ["early_warning_signs", "vaccine_importance", "follow_up_audiology"]}
    ],
    "scoring_categories": {
      "diagnostic_efficiency": {
        "max_points": 20,
        "rules": [
          {"id": "DE1", "when": "student_prioritizes_meningitis_in_top3_after_D2", "points": 8},
          {"id": "DE2", "when": "student_orders_lp_csf_panel_after_stabilization", "points": 6},
          {"id": "DE3", "when": "student_avoids_excess_low_yield_tests", "points": 6}
        ]
      },
      "resource_management": {
        "max_points": 15,
        "rules": [
          {"id": "RM1", "when": "orders_essential_labs_first", "points": 8},
          {"id": "RM2", "when": "documents_reason_for_each_test", "points": 7}
        ]
      },
      "critical_finding_identification": {
        "max_points": 15,
        "rules": [
          {"id": "CF1", "when": "recognizes_petechiae_as_invasive_bacterial_signal", "points": 5},
          {"id": "CF2", "when": "recognizes_shock", "points": 5},
          {"id": "CF3", "when": "interprets_gram_positive_diplococci_as_pneumococcus", "points": 5}
        ]
      },
      "patient_safety": {
        "max_points": 25,
        "rules": [
          {"id": "PS1", "when": "starts_antibiotics_promptly_after_suspicion", "points": 10},
          {"id": "PS2", "when": "orders_blood_cultures_before_antibiotics", "points": 5},
          {"id": "PS3", "when": "addresses_airway_seizure_shock_in_D8", "points": 10}
        ],
        "penalties": [
          {"id": "PSP1", "when": "delays_antibiotics_beyond_time_threshold", "points": -10},
          {"id": "PSP2", "when": "ignores_shock_signs", "points": -10}
        ]
      },
      "final_diagnosis_and_plan": {
        "max_points": 25,
        "rules": [
          {"id": "FD1", "when": "final_diagnosis_matches_ABM_S_pneumoniae", "points": 10},
          {"id": "FD2", "when": "justifies_empiric_regimen_for_age_group", "points": 8},
          {"id": "FD3", "when": "deescalates_to_ceftriaxone_only_after_susceptibilities", "points": 7}
        ]
      }
    },
    "achievements": [
      {"id": "A1", "name": "Red Flag Recognizer", "criteria": "identifies >=3 red flags by end of D2"},
      {"id": "A2", "name": "Shock First Responder", "criteria": "initiates shock bundle during D8/D9"},
      {"id": "A3", "name": "Micro-to-Clinic Integrator", "criteria": "links gram+ diplococci + CSF pattern to pneumococcus"},
      {"id": "A4", "name": "Stewardship Specialist", "criteria": "de-escalates appropriately and documents rationale"},
      {"id": "A5", "name": "Family Communicator", "criteria": "answers parent questions with clarity + empathy"}
    ],
    "evaluation_rubrics": [
      {"id": "CR_DATA_GATHERING", "name": "Data Gathering & Acquisition", "anchors": {"excellent": "Asks high-yield pediatric meningitis history + targeted ROS; recognizes urgent features", "needs_improvement": "Misses key meningitis/shock questions; unfocused questioning"}},
      {"id": "CR_PROBLEM_REP", "name": "Problem Representation", "anchors": {"excellent": "Concise statement: age + fever + lethargy + meningeal signs + shock + petechiae", "needs_improvement": "Lists facts without synthesis"}},
      {"id": "CR_DDX", "name": "Hypothesis Generation & Differential", "anchors": {"excellent": "Prioritized infectious DDx (bacterial/viral) + noninfectious mimics + sepsis", "needs_improvement": "Anchors prematurely; omits life threats"}},
      {"id": "CR_TEST_STRATEGY", "name": "Diagnostic Verification Strategy", "anchors": {"excellent": "Cultures before antibiotics; LP timing; interprets CSF correctly; rational sequencing", "needs_improvement": "Overorders or delays critical diagnostics"}},
      {"id": "CR_TREATMENT", "name": "Treatment Plan + Justification", "anchors": {"excellent": "Correct empiric regimen, steroids timing, de-escalation, duration rationale", "needs_improvement": "Inadequate coverage or poor justification"}},
      {"id": "CR_PREVENTION", "name": "Prevention + Vaccines", "anchors": {"excellent": "Discusses droplet precautions, vaccination role, public health/close contact counseling", "needs_improvement": "Omits prevention/vaccine discussion"}},
      {"id": "CR_COMM_TEAM", "name": "Communication & Teamwork", "anchors": {"excellent": "Clear handoffs, consults PICU/ID appropriately; family education is actionable", "needs_improvement": "Poor escalation/communication; incomplete counseling"}}
    ],
    "deterioration_rules": [
      {"if": "suspected_meningitis_flagged == false AND time >= 5", "then": {"event": "clinical_worsening_warning", "notes": "Prompt urgency without giving diagnosis"}},
      {"if": "antibiotics_started == false AND time >= 8", "then": {"event": "seizure_and_shock_event", "notes": "Unlock Disclosure 8 deterioration"}},
      {"if": "shock_unaddressed == true AND time >= 12", "then": {"event": "multi_organ_risk", "notes": "Increase penalties; require PICU interventions"}}
    ]
  }'::jsonb
)
ON CONFLICT DO NOTHING;
