
export interface ProductGroup {
  id: string;
  name: string;
  description: string;
}

export interface ResponsiblePerson {
  name: string;
  role: string;
  direct_contact: string;
}

export interface GeneralContacts {
  phones: string[];
  emails: string[];
  website: string;
}

export interface ScaleAnalysis {
  estimated_locations: string;
  scale_category: 'Single' | 'Small Chain' | 'Medium Chain' | 'Large Chain' | 'Unknown';
  details: string;
}

export type ScoreLevel = 'High' | 'Medium' | 'Low' | 'NONE';

export interface Client {
  id: string;
  name: string;
  vat?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  activity?: string;
  clientType?: string;
  website?: string;
  category_scores?: { [categoryId: string]: ScoreLevel };
  analysis?: string;
  sources?: Array<{ title: string; uri: string }>;
  contacts?: {
    responsible_persons: ResponsiblePerson[];
    general_contacts: GeneralContacts;
  };
  correctedName?: string;
  scale_analysis?: ScaleAnalysis;
}

export interface AnalysisResult {
  correctedName?: string;
  activity: string;
  clientType: string;
  category_scores: { [categoryId: string]: ScoreLevel };
  analysis: string;
  scale_analysis: ScaleAnalysis;
  contacts: {
    responsible_persons: ResponsiblePerson[];
    general_contacts: GeneralContacts;
  };
}
