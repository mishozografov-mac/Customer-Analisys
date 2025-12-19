
export interface ProductGroup {
  id: string;
  name: string;
  description: string;
}

export interface ContactPerson {
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

export type SuitabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface MatchedCategory {
  categoryName: string;
  suitability: SuitabilityLevel;
  reasoning: string;
}

export interface Client {
  id: string;
  name: string;
  vat?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  activity?: string;
  clientType?: string;
  locationsCount?: string;
  locationDetails?: string;
  website?: string;
  matches?: MatchedCategory[];
  sources?: Array<{ title: string; uri: string }>;
  emails?: string[];
  phoneNumbers?: string[];
  isEmailValid?: boolean;
  responsiblePersons?: ContactPerson[];
  correctedName?: string;
}

export interface AnalysisResult {
  activity: string;
  clientType: string;
  locationsCount?: string;
  locationDetails?: string;
  website?: string;
  matches: MatchedCategory[];
  sources: Array<{ title: string; uri: string }>;
  emails: string[];
  phoneNumbers: string[];
  responsiblePersons: ContactPerson[];
  correctedName?: string;
}
