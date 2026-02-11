-- =============================================================
-- FULL CONTENT UPDATE: Amelia Thompson Case
-- Run this in Supabase SQL Editor to populate all narratives,
-- disclosures, test results, interventions, and scoring.
-- =============================================================

UPDATE public.cases
SET
  name = 'Amelia Thompson Case',
  description = '9-month-old female brought in by parents with acute high-grade fever, lethargy, and systemic illness.',
  content = '{
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

  "introduction": {
    "paragraphs": [
      "On a seemingly ordinary day, enriched by the vibrant pulse of city life, 9-month-old Amelia''s parents, encased in the sanctuary of their modest home, were met with alarming signs. Despite the ambient glow of health that typically surrounded their daughter, they discovered her radiating an unsettling warmth. A rectal thermometer reading revealed a fever spiking to 103°F, unresponsive to acetaminophen, marking the onset of a deepening concern. Amelia''s condition, void of the common markers of a simple cold, propelled her family into a state of heightened anxiety. Urged by a pediatrician''s advice, they navigated their way to the emergency department, a journey fraught with the weight of Amelia''s sudden illness and the broader concerns of their life''s stability.",
      "Amelia''s mother, balancing the demands of a minimum-wage job devoid of health benefits, faced the harrowing reality of a child in distress amidst a landscape where primary care was a luxury. The reliance on telehealth recommendations and the convenience of over-the-counter medications highlighted the gaps in a system struggling to meet the needs of its most vulnerable. The backdrop of a rural setting, with its limited access to healthcare, well water usage, and reliance on a wood-burning stove were the environmental factors that could influence Amelia''s condition.",
      "The day unfolded with an air of anxiety as Amelia''s mother, a 27-year-old woman embodying both the strength and worries of parenthood, found herself confronting the possibility that her daughter''s condition might be more serious than a simple fever. Her intuition, honed by months of nurturing and caring for Amelia, whispered that something was amiss, a sentiment echoed by the pediatrician''s urgent recommendation to seek immediate medical attention.",
      "Amelia''s medical history painted a picture of a typically healthy infant, thriving under the watchful eyes of her devoted parents. Her diet, consisting of baby food, cereal, and iron-fortified formula, had been momentarily cast aside by her lack of appetite, an unusual deviation from her normal routine. Remarkably, her vaccinations were up to date, providing a shield against the common threats that loom over the early years of life. The family''s home, free from the presence of pets and the haze of tobacco, offered a safe haven for Amelia''s growth and development, further supported by a community of healthy relatives and a childcare environment shared with other young children."
    ],
    "instructions": [
      "Interview the patient''s family to gather a thorough history",
      "Perform a focused physical examination",
      "Order appropriate diagnostic tests based on your clinical reasoning",
      "Develop and refine a differential diagnosis",
      "Initiate management as indicated",
      "You can consult your mentor at any time for guidance"
    ]
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
      "no weight loss", "no wheezing", "no murmurs", "no joint pain", "no bruising",
      "no history of asthma", "no history of eczema", "no history of seizures",
      "no history of easy bruising or bleeding", "no known endocrine issues"
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
        "weight_kg": 8.5,
        "length_cm": 70,
        "head_circumference_cm": 45
      },
      "mental_status": "lethargic",
      "neuro_signs": ["neck_tenderness", "brudzinski_positive", "bulging_fontanelle"],
      "rash": "petechiae lower legs bilaterally",
      "skin_findings": ["petechial rash on lower extremities", "pale", "capillary refill 6 seconds"],
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
        "narrative": "Upon arrival at the Emergency Department, Amelia Thompson, a 9-month-old infant presenting with a high fever and concern from her parents, undergoes a comprehensive physical examination.",
        "vitals": {"temp_f": 103.5, "bp_mmHg": "70/50", "hr_bpm": 180, "rr_bpm": 50, "spo2_percent": 98, "weight_kg": 8.5, "length_cm": 70, "head_circ_cm": 45, "cap_refill_sec": 6},
        "general": "Amelia lies quietly on the gurney, her usual vibrancy dimmed to a pale quietude, painting a picture of vulnerability.",
        "heent": "Head: Slight bulge of anterior fontanelle. Eyes: Positive red reflex, fundi difficult to visualize. Ears: Tympanic membranes normal. Nose: Clear, no exudate. Throat: Unremarkable.",
        "lymph_nodes": "No signs of lymphadenopathy.",
        "chest": "Normal breath sounds.",
        "heart": "Regular rate and rhythm, no murmurs detected.",
        "abdomen": "No signs of organomegaly or masses.",
        "extremities": "Petechial rash observed on lower legs bilaterally.",
        "skin": "Pale. Capillary refill time 6 seconds (normal <2 seconds).",
        "neurologic": "Pronounced lethargy, minimal response to examination and external stimuli. Becomes agitated when neck is palpated. Brudzinski''s sign is present. No focal neurologic signs.",
        "key_findings": ["bulging_anterior_fontanelle", "petechial_rash_lower_legs", "lethargy_minimal_response", "neck_palpation_agitation", "brudzinski_positive", "capillary_refill_6_seconds", "pale_appearance"]
      },
      "maps_to_objectives": ["LO1", "LO2", "LO8", "LO9", "LO10"]
    },
    {
      "id": "D3", "title": "Initial ED Laboratory Orders",
      "unlock": {"type": "STATE", "condition": "student_places_orders OR time >= 5"},
      "content": {
        "narrative": "As the physical examination concludes, the medical team orders a battery of tests, each selected with the dual purpose of peeling away layers of uncertainty and zeroing in on the enemy lurking within.",
        "ordered_tests_default": ["cbc", "chem7", "coags", "lfts", "ua", "crp"],
        "note": "Blood cultures should be ordered before antibiotics (scoring event)."
      },
      "maps_to_objectives": ["LO3", "LO15"]
    },
    {
      "id": "D4", "title": "Initial Lab Results",
      "unlock": {"type": "ACTION", "condition": "student_orders_any_of([''cbc'',''chem7'',''coags'',''lfts'',''ua'',''crp''])"},
      "content": {
        "narrative": "As the lab results start to trickle in, the pieces of the puzzle begin to find their places, drawing the medical team ever closer to a diagnosis.",
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
        "narrative": "The CBC results show leukocytosis with a left shift. CRP elevation to 48 mg/L reflects intense systemic inflammatory response. Serum chemistry identified hyponatremia and hyperchloremia indicative of SIADH. Coagulation profile reveals prolonged PT and elevated INR suggesting potential underlying coagulopathy consistent with DIC. The decision to admit Amelia to ICU, draw blood cultures, and initiate empirical antibiotic therapy demonstrates evidence-based guidelines for management of suspected sepsis and bacterial meningitis.",
        "recommended_actions_expected": ["blood_cultures", "start_empiric_antibiotics", "consider_dexamethasone_timing", "PICU_admission", "LP_if_no_contraindications"],
        "empiric_regimen_reference": {
          "antibiotics": ["ceftriaxone", "vancomycin"],
          "adjunct": ["dexamethasone"],
          "note": "Ceftriaxone, Vancomycin, and Dexamethasone administered. Empiric therapy launched to cover a broad spectrum of potential pathogens."
        }
      },
      "maps_to_objectives": ["LO11", "LO12", "LO15", "LO9"]
    },
    {
      "id": "D6", "title": "CSF Studies + Gram Stain",
      "unlock": {"type": "ACTION", "condition": "student_orders_lp_and_csf_panel"},
      "content": {
        "narrative": "The CSF analysis is poised to uncover the nature of the intruder. CSF Cell Count will reveal white blood cells mobilized to the site of infection. CSF Glucose and Protein Levels offer insight into the biochemical siege within Amelia''s central nervous system. CSF Gram Stain and Culture seeks to identify the specific bacteria.",
        "csf_panel_available": ["opening_pressure", "cell_count_with_diff", "glucose", "protein", "lactate", "gram_stain", "culture", "pcr_or_latex"],
        "gram_stain": "gram_positive_diplococci",
        "gram_stain_detail": "Small gram-positive diplococci identified on microscopy",
        "cultures": "pending"
      },
      "maps_to_objectives": ["LO3", "LO4", "LO5", "LO7", "LO8"]
    },
    {
      "id": "D7", "title": "Final CSF Pattern + Biomarkers",
      "unlock": {"type": "ACTION_OR_TIME", "condition": "student_reviews_csf_results OR time >= 18"},
      "content": {
        "narrative": "The CSF analysis delineates a scenario typical of severe bacterial meningitis: opening pressure significantly beyond normal, elevated WBC count dominated by neutrophils, drastically reduced glucose, and heightened protein levels. These markers confirm bacterial infection within the meningeal spaces and signify its pyogenic nature. The Gram stain''s revelation of small gram-positive diplococci validates the empirical use of Ceftriaxone and Vancomycin, squarely targeting Streptococcus pneumoniae.",
        "csf_pattern": {"opening_pressure": "225 mmH2O (HIGH)", "wbc": "5,000/µL (HIGH)", "neutrophils_percent": "High", "glucose": "10 mg/dL (LOW)", "protein": "200 mg/dL (HIGH)"},
        "biomarkers": {"procalcitonin": "2.8 ng/mL (HIGH)", "repeat_crp": "120 mg/L (HIGH)", "csf_lactate": "High"}
      },
      "maps_to_objectives": ["LO4", "LO7", "LO8", "LO9", "LO10", "LO11"]
    },
    {
      "id": "D8", "title": "Acute Deterioration (Seizure + Shock)",
      "unlock": {"type": "EVENT", "condition": "event == ''seizure_and_shock_event''"},
      "content": {
        "narrative": "Before the transfer to PICU can take place, a chilling development halts the nurses in their tracks. Amelia suddenly becomes apneic and cyanotic. Seizures wrack her tiny body. An arterial line is placed — the readings confirm the worst fears: her blood pressure has plummeted to a mere 45 systolic, revealing a critical state of shock that compounds the emergency of her neurological decline. With Amelia''s life hanging in the balance, the planned transfer to the PICU is abruptly delayed.",
        "events": ["apnea_cyanosis", "seizures", "bp_systolic_45"],
        "required_management": ["airway_support", "benzodiazepine_for_seizure", "fluid_bolus", "vasopressors_if_fluid_refractory"]
      },
      "maps_to_objectives": ["LO9", "LO11", "LO15", "LO16"]
    },
    {
      "id": "D9", "title": "PICU Management",
      "unlock": {"type": "ACTION_OR_STAGE", "condition": "student_transfers_to_picu OR time >= 22"},
      "content": {
        "narrative": "As Amelia becomes apneic and cyanotic, the team promptly initiates bag-valve-mask ventilation with 100% oxygen. Recognizing the gravity of her respiratory failure, endotracheal intubation is performed, transitioning Amelia to mechanical ventilation. Amelia''s seizure prompts immediate administration of Diazepam at 0.15 mg/Kg IV, effectively halting the seizure. Despite the team''s efforts, Amelia''s blood pressure remains perilously low, indicative of septic shock. Administration of 350 ml of lactated Ringer''s fails to significantly raise her blood pressure, underscoring the need for vasopressor therapy.",
        "interventions": ["bvm_oxygen_100", "intubation_mechanical_ventilation", "diazepam_0_15_mg_per_kg_IV", "LR_350_ml_no_response", "consider_vasopressors"],
        "imaging": {"chest_xray": "Clear of infiltrates, adequate ETT placement confirmed"},
        "abg": "Within normal limits — offering a glimmer of hope that immediate interventions have begun to stabilize Amelia"
      },
      "maps_to_objectives": ["LO9", "LO11", "LO15"]
    },
    {
      "id": "D10", "title": "Day 2 Stabilization + Parent Communication",
      "unlock": {"type": "TIME", "condition": "time >= 28"},
      "content": {
        "narrative": "The medical team escalates treatment to include dopamine (20 µg/Kg/min) and epinephrine (0.5 µg/Kg/min) drips to combat persistent hypotension indicative of septic shock. Pastoral care steps in, offering a compassionate bridge to a private waiting room. Once Amelia is somewhat stabilized, the medical team prepares to meet her parents.",
        "hemodynamics": {"dopamine": "20 µg/Kg/min", "epinephrine": "0.5 µg/Kg/min"},
        "parent_questions": [
          {"question": "What is meningitis?", "answer": "Meningitis is an inflammation of the protective membranes covering the brain and spinal cord, caused in Amelia''s case by a bacterial infection. This inflammation can lead to symptoms such as fever, seizures, and changes in consciousness."},
          {"question": "How did Amelia get it?", "answer": "Bacterial meningitis can occur when bacteria enter the bloodstream and migrate to the brain and spinal cord. Common routes include respiratory infections or direct contact with someone carrying the bacteria."},
          {"question": "What are her chances of survival?", "answer": "While bacterial meningitis has a notable mortality rate, her treatment is aligned with best practices. Antibiotics, supportive therapies, and close monitoring in the PICU are all measures aimed at optimizing her chances of recovery."},
          {"question": "Are there any long-term effects?", "answer": "Some children may experience hearing loss, learning difficulties, or other neurological impairments. Early and aggressive treatment can minimize these risks, and Amelia will be closely monitored."},
          {"question": "Is anyone else at risk?", "answer": "Certain types of bacterial meningitis can be contagious. Close contacts may be advised to receive prophylactic antibiotics based on the identified pathogen."}
        ]
      },
      "maps_to_objectives": ["LO9", "LO13", "LO16", "LO15"]
    },
    {
      "id": "D11", "title": "Day 3 PICU Monitoring",
      "unlock": {"type": "TIME", "condition": "time >= 33"},
      "content": {
        "narrative": "The team closely monitors Amelia''s fluid intake, urine output, and serum electrolytes. The goal is to maintain systolic BP around 80 mmHg and urinary output at 500 mL/m²/day, ensuring adequate tissue perfusion while minimizing risk of cerebral edema. Continuous monitoring of vital signs and neurologic status provides essential insights. The team is prepared to use dopamine and other inotropic agents to support blood pressure and circulation.",
        "monitoring_goals": {"sbp_target_mmHg": 80, "urine_output_target": "500 mL/m²/day", "fluid_strategy": "Maintain adequate tissue perfusion while minimizing risk of brain edema"},
        "additional_considerations": ["Interdisciplinary consultation with pediatric infectious disease and critical care", "Seizure vigilance", "Antithrombotic therapy consideration for stroke prevention"]
      },
      "maps_to_objectives": ["LO9", "LO15"]
    },
    {
      "id": "D12", "title": "Repeat Labs + Culture Results",
      "unlock": {"type": "TIME_OR_ACTION", "condition": "time >= 38 OR student_checks_cultures"},
      "content": {
        "narrative": "Both blood and cerebrospinal fluid cultures have grown Streptococcus pneumoniae, marking a pivotal moment in Amelia''s treatment journey. This bacterium, notorious for its role in causing severe bacterial meningitis among pediatric patients, confirms the medical team''s suspicions and validates their initial choice of empiric antibiotic therapy.",
        "cultures": {"csf": "Streptococcus pneumoniae", "blood": "Streptococcus pneumoniae"},
        "susceptibilities": {"ceftriaxone": "Sensitive", "cefotaxime": "Sensitive", "vancomycin": "Sensitive", "penicillin_g": "Resistant", "ampicillin": "Resistant", "meropenem": "Sensitive"},
        "repeat_labs": {"cbc": "WBC improving", "coags": "Improving", "chem7": "Na improving"}
      },
      "maps_to_objectives": ["LO4", "LO5", "LO7", "LO11", "LO12"]
    },
    {
      "id": "D13", "title": "Day 4 ID Consult + Antibiotic De-escalation",
      "unlock": {"type": "ACTION", "condition": "student_requests_id_consult OR time >= 42"},
      "content": {
        "narrative": "With the definitive identification of the pathogen, the medical team makes an evidence-based decision to adjust Amelia''s antibiotic treatment. Ceftriaxone is continued as the cornerstone of recovery. With specific sensitivity of Streptococcus pneumoniae to Ceftriaxone confirmed, Vancomycin is discontinued — reflecting antimicrobial stewardship principles. Early detection of coagulopathy necessitates administration of fresh frozen plasma (FFP).",
        "definitive_therapy": {
          "continue": {"drug": "ceftriaxone", "dose": "50 mg/kg/dose IV q12h (max 2000 mg/dose)", "duration_days": 10},
          "stop": "vancomycin (after susceptibility confirmed — antimicrobial stewardship)",
          "interventions": "FFP for coagulopathy"
        },
        "stewardship_note": "Narrow when pathogen + susceptibility confirmed. Maximizing efficacy while minimizing unnecessary exposure to broad-spectrum antibiotics.",
        "prevention_discussion": {
          "pathogen": "S. pneumoniae",
          "transmission": "Respiratory droplets; close contact risk in childcare settings",
          "prophylaxis_note": "Rifampin prophylaxis recommended for babysitter, other children under her care, and their immediate families who had significant close contact with Amelia."
        }
      },
      "maps_to_objectives": ["LO11", "LO12", "LO13", "LO14", "LO15", "LO16"]
    },
    {
      "id": "D14", "title": "Discharge + Follow-up + Sequelae Screening",
      "unlock": {"type": "TIME", "condition": "time >= 50"},
      "content": {
        "narrative": "After the critical initial days in the PICU, Amelia''s condition showed signs of improvement, allowing her medical team to wean her off pressors by Day 3. She was successfully extubated and transferred to the infectious disease ward. After 10 days on targeted antibiotic therapy (aligned with EBM guidelines for Streptococcus pneumoniae meningitis), Amelia was deemed ready for discharge. Hearing loss, a recognized complication of bacterial meningitis, prompted referral to the Pediatric Speech and Audiology Clinic.",
        "course": ["weaned_off_pressors_by_day_3", "extubated", "transferred_to_infectious_disease_ward", "completed_10_days_targeted_therapy", "discharged"],
        "follow_up": [
          "Referral to Pediatric Speech and Audiology Clinic for hearing loss screening",
          "Screen for cognitive delays, speech and language impairment, and motor skills deficits",
          "Monitor neurodevelopmental outcomes"
        ],
        "education_points": [
          "Early medical intervention for fever/lethargy",
          "Vaccine reinforcement and routine follow-up",
          "Importance of early intervention for ABM sequelae"
        ]
      },
      "maps_to_objectives": ["LO9", "LO10", "LO13", "LO14", "LO16"]
    }
  ],

  "diagnostic_tests": [
    {"id": "cbc", "display_name": "CBC with differential", "cost_points": 2, "tat_minutes": 1, "result_schema": ["wbc", "neutrophils_percent", "bands_percent", "hgb", "platelets"]},
    {"id": "chem7", "display_name": "Serum Chemistry (Chem 7)", "cost_points": 2, "tat_minutes": 1, "result_schema": ["sodium", "potassium", "chloride", "bicarb", "bun", "creatinine", "glucose"]},
    {"id": "crp", "display_name": "C-Reactive Protein (CRP)", "cost_points": 1, "tat_minutes": 1, "result_schema": ["crp_mg_L"]},
    {"id": "procalcitonin", "display_name": "Procalcitonin", "cost_points": 2, "tat_minutes": 1, "result_schema": ["pct_ng_mL"]},
    {"id": "coags", "display_name": "Coagulation Studies", "cost_points": 2, "tat_minutes": 1, "result_schema": ["pt", "inr", "ptt", "fibrinogen", "d_dimer"]},
    {"id": "lfts", "display_name": "Liver Function Tests (LFTs)", "cost_points": 1, "tat_minutes": 1, "result_schema": ["ast", "alt", "bilirubin_total"]},
    {"id": "ua", "display_name": "Urinalysis", "cost_points": 1, "tat_minutes": 1, "result_schema": ["leukocyte_esterase", "nitrites", "wbc", "rbc", "specific_gravity"]},
    {"id": "blood_cultures", "display_name": "Blood Cultures x2", "cost_points": 3, "tat_minutes": 1, "result_schema": ["organism", "time_to_positivity", "susceptibilities"]},
    {"id": "lp_csf_panel", "display_name": "Lumbar Puncture + CSF Panel", "cost_points": 5, "tat_minutes": 1, "prerequisites": ["hemodynamic_stability_check", "no_focal_neuro_deficits"], "result_schema": ["opening_pressure", "wbc", "diff_neutrophils_percent", "glucose", "protein", "lactate", "gram_stain", "culture", "pcr_or_latex"]},
    {"id": "abg", "display_name": "Arterial Blood Gas (ABG)", "cost_points": 2, "tat_minutes": 1, "result_schema": ["pH", "pCO2", "pO2", "HCO3", "lactate"]},
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
    "crp": {"crp_mg_L": "48 mg/L (HIGH) → 120 mg/L", "reference_range": "<10 mg/L", "interpretation": "Severe bacterial inflammation"},
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
      "culture": "Pending → Streptococcus pneumoniae",
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
    {"id": "start_empiric_abx", "display_name": "Start empiric antibiotics (Ceftriaxone + Vancomycin)", "options": ["ceftriaxone", "vancomycin"], "safety_rules": ["penalty_if_delayed_after_meningitis_suspected"]},
    {"id": "give_dexamethasone", "display_name": "Administer dexamethasone adjunct", "timing_rule": "best_before_or_with_first_antibiotic_dose"},
    {"id": "fluid_bolus", "display_name": "Fluid bolus for shock (20 mL/kg NS or LR)", "dose_reference": "20 mL/kg NS or LR"},
    {"id": "vasopressors", "display_name": "Initiate vasopressors (dopamine/epinephrine)", "options": ["dopamine 20 µg/Kg/min", "epinephrine 0.5 µg/Kg/min"]},
    {"id": "seizure_abort", "display_name": "Abort seizure (benzodiazepine)", "options": ["diazepam 0.15 mg/kg IV", "lorazepam 0.1 mg/kg IV"]},
    {"id": "intubate", "display_name": "Endotracheal intubation + mechanical ventilation"},
    {"id": "deescalate_antibiotics", "display_name": "De-escalate to Ceftriaxone monotherapy (stop Vancomycin)", "rules": ["stop_vancomycin_if_pneumococcus_susceptible_to_ceftriaxone"]},
    {"id": "infection_control", "display_name": "Institute infection control measures", "options": ["droplet_precautions", "hand_hygiene", "notify_public_health", "rifampin_prophylaxis_for_contacts"]},
    {"id": "family_education", "display_name": "Provide parent education and discharge counseling", "topics": ["early_warning_signs", "vaccine_importance", "follow_up_audiology", "meningitis_explanation"]}
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
    {"id": "A1", "name": "Red Flag Recognizer", "criteria": "Identifies >=3 red flags by end of D2"},
    {"id": "A2", "name": "Shock First Responder", "criteria": "Initiates shock bundle during D8/D9"},
    {"id": "A3", "name": "Micro-to-Clinic Integrator", "criteria": "Links gram+ diplococci + CSF pattern to pneumococcus"},
    {"id": "A4", "name": "Stewardship Specialist", "criteria": "De-escalates appropriately and documents rationale"},
    {"id": "A5", "name": "Family Communicator", "criteria": "Answers parent questions with clarity + empathy"}
  ],

  "evaluation_rubrics": [
    {
      "id": "history_taking_synthesis", "name": "History Taking and Synthesis", "max_points": 15,
      "db_column": "history_taking_synthesis",
      "emerging_range": [0, 5], "emerging_description": "History is incomplete or disorganized, missing many critical details; little to no synthesis of information.",
      "developing_range": [6, 9], "developing_description": "Gathers basic history including some relevant details but misses others; somewhat organized but limited synthesis or linking of information.",
      "proficient_range": [10, 13], "proficient_description": "Obtains a thorough and organized history covering most key details; synthesizes findings into a coherent summary with minor omissions.",
      "exemplary_range": [14, 15], "exemplary_description": "Elicits a comprehensive, focused history covering all pertinent information; highly organized, with clear synthesis into an accurate problem representation."
    },
    {
      "id": "physical_exam_interpretation", "name": "Physical Exam Interpretation", "max_points": 10,
      "db_column": "physical_exam_interpretation",
      "emerging_range": [0, 3], "emerging_description": "Identifies few exam findings or misinterprets key physical signs; lacks understanding of findings'' significance.",
      "developing_range": [4, 6], "developing_description": "Recognizes obvious exam findings but misses subtler cues; demonstrates partial understanding of their significance and may misinterpret some findings.",
      "proficient_range": [7, 8], "proficient_description": "Correctly identifies and interprets important physical exam findings; understands their significance for the diagnosis, with only minor gaps.",
      "exemplary_range": [9, 10], "exemplary_description": "Accurately interprets all pertinent exam findings, including subtle abnormalities; fully understands their implications and integrates them into diagnostic reasoning."
    },
    {
      "id": "differential_diagnosis_formulation", "name": "Differential Diagnosis Formulation", "max_points": 15,
      "db_column": "differential_diagnosis_formulation",
      "emerging_range": [0, 5], "emerging_description": "Offers an incomplete or incorrect differential (few or irrelevant possibilities); misses obvious diagnoses and provides no clear reasoning.",
      "developing_range": [6, 9], "developing_description": "Lists some plausible diagnoses but misses important ones or includes unrelated options; limited prioritization with vague or minimal justification.",
      "proficient_range": [10, 13], "proficient_description": "Generates a solid differential with most likely diagnoses and some less-common considerations; prioritizes diagnoses based on patient data and provides reasoning for each choice.",
      "exemplary_range": [14, 15], "exemplary_description": "Provides a comprehensive, well-prioritized differential including all likely and relevant alternate diagnoses; clearly articulates evidence-based reasoning for each possibility, demonstrating a systematic and rigorous approach."
    },
    {
      "id": "diagnostic_tests", "name": "Diagnostic Tests (Labs/Imaging)", "max_points": 10,
      "db_column": "diagnostic_tests",
      "emerging_range": [0, 3], "emerging_description": "Selects diagnostic tests unsystematically or misses key investigations; may order unnecessary tests and fails to interpret results correctly.",
      "developing_range": [4, 6], "developing_description": "Chooses some appropriate labs/imaging but omits a few important tests or includes low-yield ones; shows basic result interpretation, though misses finer points; limited prioritization of tests.",
      "proficient_range": [7, 8], "proficient_description": "Selects appropriate, high-yield tests with minimal unnecessary investigations; interprets results accurately, recognizing most significant findings; uses results to refine the differential diagnosis effectively.",
      "exemplary_range": [9, 10], "exemplary_description": "Strategically selects tests based on clinical evidence and priorities (avoids unnecessary investigations); interprets all results correctly; seamlessly integrates data to confirm or narrow diagnoses with exceptional efficiency."
    },
    {
      "id": "management_reasoning", "name": "Management Reasoning (Treatment Plan)", "max_points": 15,
      "db_column": "management_reasoning",
      "emerging_range": [0, 5], "emerging_description": "Proposes an incomplete or inappropriate management plan; misses critical interventions or orders; reasoning is unclear, not evidence-based, or unsafe.",
      "developing_range": [6, 9], "developing_description": "Outlines a basic treatment plan addressing some issues, but important components are missing or poorly prioritized; reasoning shows partial understanding of standard care.",
      "proficient_range": [10, 13], "proficient_description": "Formulates a generally sound treatment plan covering major aspects of care (acute management, further workup, patient education, follow-up); plan is mostly evidence-based and appropriately prioritized, with only minor omissions.",
      "exemplary_range": [14, 15], "exemplary_description": "Develops a comprehensive, evidence-based treatment plan addressing immediate and long-term needs; prioritizes interventions logically, including appropriate consultations, education, and follow-up; provides clear rationale aligned with best practices."
    },
    {
      "id": "communication_empathy", "name": "Communication and Empathy", "max_points": 15,
      "db_column": "communication_empathy",
      "emerging_range": [0, 5], "emerging_description": "Communication is unclear or overly clinical; shows minimal empathy or listening, failing to address patient concerns or build rapport.",
      "developing_range": [6, 9], "developing_description": "Communicates adequately with some lay language and occasional empathy, but consistency is lacking; addresses patient questions or emotions partially, with moderate rapport.",
      "proficient_range": [10, 13], "proficient_description": "Clearly and respectfully communicates in patient-friendly language; consistently demonstrates empathy and active listening, addresses concerns and emotions; establishes good rapport and trust.",
      "exemplary_range": [14, 15], "exemplary_description": "Exhibits outstanding patient-centered, compassionate communication; uses clear, jargon-free language with exceptional empathy, responding to concerns and emotional cues effectively; builds a strong therapeutic alliance."
    },
    {
      "id": "reflection_metacognition", "name": "Reflection and Metacognition", "max_points": 10,
      "db_column": "reflection_metacognition",
      "emerging_range": [0, 3], "emerging_description": "Shows little to no reflection on decisions or outcomes; fails to identify errors, knowledge gaps, or areas for improvement.",
      "developing_range": [4, 6], "developing_description": "Demonstrates some reflection after the case, identifying a few basic lessons or obvious mistakes, but insights are superficial; limited analysis of reasoning process.",
      "proficient_range": [7, 8], "proficient_description": "Thoughtfully reflects on performance and reasoning, identifying important successes and mistakes; offers clear insights into how to improve future practice or fill knowledge gaps.",
      "exemplary_range": [9, 10], "exemplary_description": "Engages in deep, critical reflection on decision-making and outcomes; insightfully identifies subtle gaps in knowledge or reasoning and formulates concrete strategies for improvement; demonstrates rigorous self-assessment."
    }
  ],

  "deterioration_rules": [
    {"if": "suspected_meningitis_flagged == false AND time >= 5", "then": {"event": "clinical_worsening_warning", "notes": "Prompt urgency without giving diagnosis"}},
    {"if": "antibiotics_started == false AND time >= 8", "then": {"event": "seizure_and_shock_event", "notes": "Unlock Disclosure 8 deterioration"}},
    {"if": "shock_unaddressed == true AND time >= 12", "then": {"event": "multi_organ_risk", "notes": "Increase penalties; require PICU interventions"}}
  ]
}'::jsonb
WHERE name ILIKE '%Amelia Thompson%';
