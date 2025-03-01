export type TransparencyLevel = 'none' | 'partial' | 'full';
export type ContactType = 'personal' | 'business';
export type Subcategory = 'Stranger' | 'Business' | 'Family' | 'Friends' | 'Other';

export interface Goal {
  id: string;
  title: string;
  callType: 'Business' | 'Personal';
  template: string;
  aiPrompt: string;
  urls: string[];
  files: string[];
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  type: ContactType;
  goals?: Goal[];
  transparencyLevel: TransparencyLevel;
  subcategory?: string;
  customSubcategory?: string;
  campaignId?: string;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
}

export interface TimelineEvent {
  id: string;
  contactId: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Task';
  title: string;
  description: string;
  date: Date;
  completed?: boolean;
  dueDate?: Date;
}
