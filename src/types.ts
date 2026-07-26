export interface Admin {
  admin_id: string;
  username: string;
  password_hash: string;
  password_salt: string;
  display_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

export interface Class {
  class_id: string;
  class_name: string;
  drive_folder_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  student_id: string;
  full_name: string;
  class_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Section {
  section_id: string;
  class_id: string;
  section_name: string;
  description: string;
  drive_folder_id: string;
  materials_folder_id: string;
  submissions_folder_id: string;
  publish_at: string; // ISO string or empty
  due_at: string; // ISO string or empty
  submission_enabled: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
}

export interface Instruction {
  instruction_id: string;
  section_id: string;
  title: string;
  content_html: string;
  attachment_file_id: string;
  attachment_name: string;
  attachment_mime_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  submission_id: string;
  timestamp: string;
  student_name: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  original_filename: string;
  current_filename: string;
  mime_type: string;
  file_size_bytes: number;
  drive_file_id: string;
  status: string;
}

export interface Score {
  score_id: string;
  submission_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  score: number;
  max_score: number;
  feedback: string;
  graded_at: string;
  graded_by: string;
}

export interface Setting {
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

export interface ApiConfig {
  appsScriptUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  isDemoMode: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  viewUrl?: string;
  parentName: string;
  createdAt: string;
  path?: string[];
}

