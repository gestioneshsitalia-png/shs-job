
export enum JobType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  REMOTE = 'Remote',
  CONTRACT = 'Contract',
  INTERNSHIP = 'Internship'
}

export enum JobCategory {
  TECH = 'Tecnologia',
  MARKETING = 'Marketing',
  SALES = 'Vendite',
  DESIGN = 'Design',
  HR = 'Risorse Umane',
  OTHER = 'Altro'
}

export interface Job {
  id: string;
  title: string;
  company: string;
  category: JobCategory;
  type: JobType;
  location: string;
  description: string;
  requirements: string[];
  salaryRange?: string;
  postedAt: string;
  isFeatured: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  candidateName: string;
  email: string;
  phone: string;
  coverLetter: string;
  cvFileName: string;
  cvBase64: string;
  appliedAt: string;
  consentGiven: boolean;
}

export type ViewState = 'PUBLIC' | 'ADMIN' | 'JOB_DETAILS' | 'ADMIN_CREATE' | 'ADMIN_EDIT' | 'ADMIN_APPLICATIONS' | 'ADMIN_PROFILE' | 'ADMIN_SETTINGS' | 'THANK_YOU';
