// Medication database for validation and interaction checking

export interface Medication {
  name: string;
  aliases: string[]; // Common variations/brand names
  category: 'antibiotic' | 'analgesic' | 'anticoagulant' | 'antidiabetic' | 'cardiovascular' | 'respiratory' | 'other';
  requiresCooling: boolean;
  requiresHeating: boolean;
  standardDosage?: string;
  estimatedWeight: number; // kg per typical dose/package
  specialHandling?: string[];
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'major' | 'moderate' | 'minor';
  description: string;
}

// Common medications database
export const MEDICATIONS: Medication[] = [
  // Antibiotics
  {
    name: 'Amoxicillin',
    aliases: ['amoxicillin', 'amoxil', 'trimox'],
    category: 'antibiotic',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '500mg capsules',
    estimatedWeight: 0.05
  },
  {
    name: 'Azithromycin',
    aliases: ['azithromycin', 'zithromax', 'z-pak'],
    category: 'antibiotic',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '250mg tablets',
    estimatedWeight: 0.05
  },
  {
    name: 'Ciprofloxacin',
    aliases: ['ciprofloxacin', 'cipro'],
    category: 'antibiotic',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '500mg tablets',
    estimatedWeight: 0.05
  },

  // Analgesics
  {
    name: 'Paracetamol',
    aliases: ['paracetamol', 'acetaminophen', 'tylenol', 'panadol'],
    category: 'analgesic',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '500mg tablets',
    estimatedWeight: 0.05
  },
  {
    name: 'Ibuprofen',
    aliases: ['ibuprofen', 'advil', 'nurofen', 'motrin'],
    category: 'analgesic',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '400mg tablets',
    estimatedWeight: 0.05
  },
  {
    name: 'Morphine',
    aliases: ['morphine', 'morphine sulfate'],
    category: 'analgesic',
    requiresCooling: true,
    requiresHeating: false,
    standardDosage: '10mg vials',
    estimatedWeight: 0.1,
    specialHandling: ['controlled substance', 'requires cold chain']
  },

  // Anticoagulants
  {
    name: 'Warfarin',
    aliases: ['warfarin', 'coumadin'],
    category: 'anticoagulant',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '5mg tablets',
    estimatedWeight: 0.05
  },
  {
    name: 'Heparin',
    aliases: ['heparin'],
    category: 'anticoagulant',
    requiresCooling: true,
    requiresHeating: false,
    standardDosage: '5000 units/ml vials',
    estimatedWeight: 0.15,
    specialHandling: ['requires refrigeration']
  },

  // Antidiabetics
  {
    name: 'Insulin',
    aliases: ['insulin', 'humalog', 'novolog', 'lantus', 'levemir'],
    category: 'antidiabetic',
    requiresCooling: true,
    requiresHeating: false,
    standardDosage: '10ml vial (100 units/ml)',
    estimatedWeight: 0.15,
    specialHandling: ['requires refrigeration 2-8°C', 'temperature sensitive']
  },
  {
    name: 'Metformin',
    aliases: ['metformin', 'glucophage'],
    category: 'antidiabetic',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '500mg tablets',
    estimatedWeight: 0.05
  },

  // Cardiovascular
  {
    name: 'Aspirin',
    aliases: ['aspirin', 'acetylsalicylic acid', 'asa'],
    category: 'cardiovascular',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '75mg tablets',
    estimatedWeight: 0.03
  },
  {
    name: 'Atorvastatin',
    aliases: ['atorvastatin', 'lipitor'],
    category: 'cardiovascular',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '20mg tablets',
    estimatedWeight: 0.05
  },
  {
    name: 'Lisinopril',
    aliases: ['lisinopril', 'zestril', 'prinivil'],
    category: 'cardiovascular',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '10mg tablets',
    estimatedWeight: 0.05
  },

  // Respiratory
  {
    name: 'Salbutamol',
    aliases: ['salbutamol', 'albuterol', 'ventolin'],
    category: 'respiratory',
    requiresCooling: false,
    requiresHeating: false,
    standardDosage: '100mcg inhaler',
    estimatedWeight: 0.1
  },

  // Blood products (special handling)
  {
    name: 'Blood Products',
    aliases: ['blood', 'blood products', 'plasma', 'platelets', 'red blood cells', 'whole blood'],
    category: 'other',
    requiresCooling: false,
    requiresHeating: true,
    standardDosage: 'Various',
    estimatedWeight: 0.5,
    specialHandling: ['requires heating to 37°C', 'time sensitive', 'strict temperature control']
  },
  {
    name: 'Vaccines',
    aliases: ['vaccine', 'vaccines', 'vaccination'],
    category: 'other',
    requiresCooling: true,
    requiresHeating: false,
    standardDosage: 'Various',
    estimatedWeight: 0.2,
    specialHandling: ['cold chain required', 'temperature logging', 'light sensitive']
  }
];

// Known drug interactions
export const DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    drug1: 'Warfarin',
    drug2: 'Aspirin',
    severity: 'major',
    description: 'Increased risk of bleeding. Combined use should be carefully monitored.'
  },
  {
    drug1: 'Warfarin',
    drug2: 'Ibuprofen',
    severity: 'major',
    description: 'NSAIDs can increase bleeding risk when combined with anticoagulants.'
  },
  {
    drug1: 'Aspirin',
    drug2: 'Ibuprofen',
    severity: 'moderate',
    description: 'May reduce the cardioprotective effects of aspirin. Take ibuprofen at least 2 hours after aspirin.'
  },
  {
    drug1: 'Metformin',
    drug2: 'Insulin',
    severity: 'minor',
    description: 'Can be used together but may increase risk of hypoglycemia. Monitor blood sugar closely.'
  },
  {
    drug1: 'Ciprofloxacin',
    drug2: 'Warfarin',
    severity: 'moderate',
    description: 'Ciprofloxacin may increase the effects of warfarin, increasing bleeding risk.'
  },
  {
    drug1: 'Morphine',
    drug2: 'Warfarin',
    severity: 'moderate',
    description: 'Opioids may affect INR levels. Monitor anticoagulation status.'
  },
  {
    drug1: 'Lisinopril',
    drug2: 'Aspirin',
    severity: 'moderate',
    description: 'High-dose aspirin may reduce the effectiveness of ACE inhibitors.'
  }
];

// Find medication by name or alias
export function findMedication(searchTerm: string): Medication | undefined {
  const normalized = searchTerm.toLowerCase().trim();
  return MEDICATIONS.find(
    med =>
      med.name.toLowerCase() === normalized ||
      med.aliases.some(alias => alias.toLowerCase() === normalized || normalized.includes(alias.toLowerCase()))
  );
}

// Extract all medications from text
export function extractMedications(text: string): Medication[] {
  const found: Medication[] = [];
  const lowerText = text.toLowerCase();

  for (const med of MEDICATIONS) {
    // Check if medication name or any alias appears in text
    // Use word boundary matching to avoid false positives
    const appears = [med.name, ...med.aliases].some(term => {
      const lowerTerm = term.toLowerCase();
      // Try exact match first
      if (lowerText.includes(lowerTerm)) {
        return true;
      }
      // Try word boundary match (e.g., "warfarin" should match "Warfarin 5mg")
      const wordBoundaryRegex = new RegExp(`\\b${lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return wordBoundaryRegex.test(text);
    });

    if (appears && !found.includes(med)) {
      found.push(med);
    }
  }

  return found;
}

// Check for drug interactions
export function checkInteractions(medications: Medication[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];

  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1 = medications[i];
      const med2 = medications[j];

      // Check both directions
      const interaction = DRUG_INTERACTIONS.find(
        int =>
          (int.drug1 === med1.name && int.drug2 === med2.name) ||
          (int.drug1 === med2.name && int.drug2 === med1.name)
      );

      if (interaction) {
        interactions.push(interaction);
      }
    }
  }

  return interactions;
}
