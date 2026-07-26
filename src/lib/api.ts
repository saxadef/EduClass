import { Class, Student, Section, Instruction, Submission, Score, Setting, Admin, DriveFile } from '../types';

// Helper for unique ID generation
const generateId = () => Math.random().toString(36).substring(2, 11).toUpperCase();

// Default Settings
const DEFAULT_SETTINGS: Record<string, string> = {
  MAX_UPLOAD_SIZE_MB: '10',
  TELEGRAM_BOT_TOKEN: '',
  TELEGRAM_CHAT_ID: '',
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyZaN8JMolf5MTpHIlIveMQ4O_xFrOX2dFRstLOFATsRQDLXVfPc6Q99LQ2cQxOIYKEmg/exec',
  ADMIN_DISPLAY_NAME: 'EduClass Admin',
  PORTAL_HEADER_TEXT: 'Portal Pengumpulan EduClass',
  PORTAL_LOGO_TEXT: 'Edu',
  PORTAL_LOGO_IMAGE_URL: '',
  STUDENT_DESK_TITLE: 'Student Dashboard',
  STUDENT_DESK_DESC: 'Pilih Kelas Anda untuk memeriksa pelajaran, mengunduh panduan belajar atau templat yang dilampirkan, dan mengumpulkan tugas Anda dengan aman.',
  SUBMISSION_FORM_TITLE: 'Formulir Pengumpulan',
};

// Initialize localStorage mock data if empty
const initMockDatabase = () => {
  if (!localStorage.getItem('educlass_classes')) {
    localStorage.setItem('educlass_classes', JSON.stringify([
      { class_id: 'C1', class_name: '8A', drive_folder_id: 'mock_folder_8a', status: 'ACTIVE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { class_id: 'C2', class_name: '8B', drive_folder_id: 'mock_folder_8b', status: 'ACTIVE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]));
  }
  if (!localStorage.getItem('educlass_students')) {
    localStorage.setItem('educlass_students', JSON.stringify([
      { student_id: 'S1', full_name: 'Setiawan', class_id: 'C1', status: 'ACTIVE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { student_id: 'S2', full_name: 'Andri', class_id: 'C1', status: 'ACTIVE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { student_id: 'S3', full_name: 'Dewi', class_id: 'C2', status: 'ACTIVE', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]));
  }
  if (!localStorage.getItem('educlass_sections')) {
    localStorage.setItem('educlass_sections', JSON.stringify([
      {
        section_id: 'SEC1',
        class_id: 'C1',
        section_name: 'Assignment 1',
        description: 'Please study the following materials and upload your homework.',
        drive_folder_id: 'mock_folder_sec1',
        materials_folder_id: 'mock_folder_sec1_materials',
        submissions_folder_id: 'mock_folder_sec1_submissions',
        publish_at: new Date().toISOString(),
        due_at: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
        submission_enabled: true,
        status: 'PUBLISHED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        section_id: 'SEC2',
        class_id: 'C2',
        section_name: 'Meeting 1',
        description: 'Reading chapter 1 exercises.',
        drive_folder_id: 'mock_folder_sec2',
        materials_folder_id: 'mock_folder_sec2_materials',
        submissions_folder_id: 'mock_folder_sec2_submissions',
        publish_at: new Date().toISOString(),
        due_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday (expired)
        submission_enabled: true,
        status: 'PUBLISHED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]));
  }
  if (!localStorage.getItem('educlass_instructions')) {
    localStorage.setItem('educlass_instructions', JSON.stringify([
      {
        instruction_id: 'INS1',
        section_id: 'SEC1',
        title: 'Assignment 1 Guide',
        content_html: '<p>Please answer exercises 1 to 5 from chapter 1 of your mathematics textbook.</p><p>Ensure your steps are written clearly on a piece of paper, scan it as a PDF or capture high-quality images, and upload them here.</p>',
        attachment_file_id: 'mock_material_file_id',
        attachment_name: 'assignment-1-material.pdf',
        attachment_mime_type: 'application/pdf',
        status: 'PUBLISHED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]));
  }
  if (!localStorage.getItem('educlass_submissions')) {
    localStorage.setItem('educlass_submissions', JSON.stringify([
      {
        submission_id: 'SUB1',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        student_name: 'Andri',
        class_id: 'C1',
        class_name: '8A',
        section_id: 'SEC1',
        section_name: 'Assignment 1',
        original_filename: 'Tugas Matematika Andri.docx',
        current_filename: 'Tugas Matematika Andri.docx',
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size_bytes: 1024 * 105, // 105 KB
        drive_file_id: 'mock_drive_file_1',
        status: 'SUBMITTED'
      }
    ]));
  }
  if (!localStorage.getItem('educlass_scores')) {
    localStorage.setItem('educlass_scores', JSON.stringify([]));
  }
  if (!localStorage.getItem('educlass_settings')) {
    const arr: Setting[] = Object.keys(DEFAULT_SETTINGS).map(key => ({
      setting_key: key,
      setting_value: DEFAULT_SETTINGS[key],
      updated_at: new Date().toISOString()
    }));
    localStorage.setItem('educlass_settings', JSON.stringify(arr));
  } else {
    // Pastikan jika ada setting_key APPS_SCRIPT_URL yang kosong, kita update dengan URL yang aktif
    try {
      const stored = localStorage.getItem('educlass_settings');
      if (stored) {
        const arr: Setting[] = JSON.parse(stored);
        const urlIdx = arr.findIndex(s => s.setting_key === 'APPS_SCRIPT_URL');
        if (urlIdx !== -1 && (!arr[urlIdx].setting_value || arr[urlIdx].setting_value === '')) {
          arr[urlIdx].setting_value = 'https://script.google.com/macros/s/AKfycbyZaN8JMolf5MTpHIlIveMQ4O_xFrOX2dFRstLOFATsRQDLXVfPc6Q99LQ2cQxOIYKEmg/exec';
          localStorage.setItem('educlass_settings', JSON.stringify(arr));
        }
      }
    } catch (e) {
      console.error('Gagal memperbarui APPS_SCRIPT_URL di localStorage:', e);
    }
  }
  if (!localStorage.getItem('educlass_admins')) {
    // default admin: admin / admin123
    localStorage.setItem('educlass_admins', JSON.stringify([
      {
        admin_id: 'ADM1',
        username: 'admin',
        password_hash: 'admin123', // plain for simple mock, Apps Script will use salt/hash
        password_salt: 'salt',
        display_name: 'EduClass Admin',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: ''
      }
    ]));
  }
  if (!localStorage.getItem('educlass_drive_files')) {
    localStorage.setItem('educlass_drive_files', JSON.stringify([
      {
        id: 'mock_material_file_id',
        name: 'assignment-1-material.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024 * 350,
        downloadUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800',
        parentName: 'Materials',
        path: ['EduClass', 'Classes', '8A', 'Tugas 1 - Matematika', 'Materials'],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'mock_drive_file_1',
        name: 'Tugas Matematika Andri.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 1024 * 105,
        downloadUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800',
        parentName: 'Submissions',
        path: ['EduClass', 'Classes', '8A', 'Tugas 1 - Matematika', 'Submissions'],
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'mock_img_1',
        name: 'contoh_jawaban_diagram.png',
        mimeType: 'image/png',
        sizeBytes: 1024 * 540,
        downloadUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800',
        parentName: 'Materials',
        path: ['EduClass', 'Classes', '8A', 'Tugas 1 - Matematika', 'Materials'],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'mock_guide_ppt',
        name: 'Materi_Presentasi_Kelas_8.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        sizeBytes: 1024 * 1024 * 4.2,
        downloadUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800',
        parentName: 'Materials',
        path: ['EduClass', 'Classes', '8B', 'Tugas 2 - IPA', 'Materials'],
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ]));
  }
};

// Initialize mock DB
initMockDatabase();

// API Helper
export class ApiClient {
  private static getUrl(): string {
    const settings = this.getMockSettings();
    return settings.APPS_SCRIPT_URL || '';
  }

  // Get active config status
  public static isLiveMode(): boolean {
    const url = this.getUrl();
    return url.startsWith('http://') || url.startsWith('https://');
  }

  // General poster to Apps Script (bypassing preflight via plain/text)
  private static async request<T>(action: string, params: Record<string, any> = {}): Promise<T> {
    const url = this.getUrl();
    if (!this.isLiveMode()) {
      throw new Error('Not in Live Mode');
    }

    const publicActions = ['login', 'getPublicSettings', 'getPublicSections', 'getPublicInstructions', 'submitAssignment', 'getClasses'];
    const sessionToken = localStorage.getItem('educlass_session');

    if (!publicActions.includes(action) && !sessionToken) {
      throw new Error('Access Denied: Session token is missing.');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain', // Crucial to prevent CORS preflight OPTIONS blocking
        },
        body: JSON.stringify({
          action,
          sessionToken,
          ...params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const resText = await response.text();
      let result;
      try {
        result = JSON.parse(resText);
      } catch (e) {
        throw new Error('Invalid JSON response from Apps Script: ' + resText.substring(0, 200));
      }

      if (result.success === false) {
        const errorMsg = result.error || 'Operation failed';
        if (errorMsg.includes('expired session') || errorMsg.includes('session token') || errorMsg.includes('Access Denied')) {
          localStorage.removeItem('educlass_session');
          localStorage.removeItem('educlass_display_name');
          if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        }
        throw new Error(errorMsg);
      }

      return result.data as T;
    } catch (err: any) {
      console.error('Apps Script Request Failed:', err);
      throw err;
    }
  }

  // === LOCAL STORAGE MOCK READS/WRITES ===
  private static getMockItem<T>(key: string): T[] {
    return JSON.parse(localStorage.getItem(`educlass_${key}`) || '[]');
  }

  private static setMockItem<T>(key: string, data: T[]): void {
    localStorage.setItem(`educlass_${key}`, JSON.stringify(data));
  }

  private static getMockSettings(): Record<string, string> {
    const list = this.getMockItem<Setting>('settings');
    const map: Record<string, string> = {};
    list.forEach(s => {
      map[s.setting_key] = s.setting_value;
    });
    // Fill in defaults
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      if (map[key] === undefined) {
        map[key] = DEFAULT_SETTINGS[key];
      }
    });
    return map;
  }

  // === EXPOSED API METHODS ===

  // Authentication
  public static async login(username: string, password_hash: string): Promise<{ sessionToken: string; display_name: string }> {
    if (this.isLiveMode()) {
      const res = await this.request<{ sessionToken: string; display_name: string }>('login', { username, password_hash });
      localStorage.setItem('educlass_session', res.sessionToken);
      localStorage.setItem('educlass_display_name', res.display_name);
      return res;
    } else {
      // Mock Login
      const admins = this.getMockItem<any>('admins');
      const found = admins.find((a: any) => a.username === username && a.password_hash === password_hash);
      if (!found) {
        throw new Error('Invalid username or password.');
      }
      const token = 'MOCK_TOKEN_' + generateId();
      localStorage.setItem('educlass_session', token);
      localStorage.setItem('educlass_display_name', found.display_name);
      return { sessionToken: token, display_name: found.display_name };
    }
  }

  public static logout(): void {
    localStorage.removeItem('educlass_session');
    localStorage.removeItem('educlass_display_name');
  }

  public static getSessionToken(): string | null {
    return localStorage.getItem('educlass_session');
  }

  public static getAdminDisplayName(): string {
    return localStorage.getItem('educlass_display_name') || 'Administrator';
  }

  // Settings
  public static async getPublicSettings(): Promise<Record<string, string>> {
    if (this.isLiveMode()) {
      return this.request<Record<string, string>>('getPublicSettings');
    } else {
      return this.getMockSettings();
    }
  }

  public static async getSettings(): Promise<Record<string, string>> {
    if (this.isLiveMode()) {
      return this.request<Record<string, string>>('getSettings');
    } else {
      return this.getMockSettings();
    }
  }

  public static async saveSettings(settings: Record<string, string>): Promise<boolean> {
    if (this.isLiveMode()) {
      await this.request<any>('saveSettings', { settings });
      // update local cache
      const curr = this.getMockItem<Setting>('settings');
      Object.keys(settings).forEach(key => {
        const idx = curr.findIndex(s => s.setting_key === key);
        if (idx > -1) {
          curr[idx].setting_value = settings[key];
          curr[idx].updated_at = new Date().toISOString();
        } else {
          curr.push({ setting_key: key, setting_value: settings[key], updated_at: new Date().toISOString() });
        }
      });
      this.setMockItem('settings', curr);
      return true;
    } else {
      const curr = this.getMockItem<Setting>('settings');
      Object.keys(settings).forEach(key => {
        const idx = curr.findIndex(s => s.setting_key === key);
        if (idx > -1) {
          curr[idx].setting_value = settings[key];
          curr[idx].updated_at = new Date().toISOString();
        } else {
          curr.push({ setting_key: key, setting_value: settings[key], updated_at: new Date().toISOString() });
        }
      });
      this.setMockItem('settings', curr);
      return true;
    }
  }

  // Classes
  public static async getClasses(): Promise<Class[]> {
    if (this.isLiveMode()) {
      return this.request<Class[]>('getClasses');
    } else {
      return this.getMockItem<Class>('classes');
    }
  }

  public static async createClass(className: string): Promise<Class> {
    if (this.isLiveMode()) {
      return this.request<Class>('createClass', { className });
    } else {
      const classes = this.getMockItem<Class>('classes');
      if (classes.some(c => c.class_name.toLowerCase() === className.toLowerCase())) {
        throw new Error('Class already exists');
      }
      const newClass: Class = {
        class_id: 'C_' + generateId(),
        class_name: className,
        drive_folder_id: 'mock_folder_' + className.toLowerCase(),
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      classes.push(newClass);
      this.setMockItem('classes', classes);
      return newClass;
    }
  }

  public static async updateClass(classId: string, className: string, driveFolderId: string): Promise<Class> {
    if (this.isLiveMode()) {
      return this.request<Class>('updateClass', { classId, className, driveFolderId });
    } else {
      const classes = this.getMockItem<Class>('classes');
      const idx = classes.findIndex(c => c.class_id === classId);
      if (idx === -1) throw new Error('Class not found');
      classes[idx] = {
        ...classes[idx],
        class_name: className,
        drive_folder_id: driveFolderId,
        updated_at: new Date().toISOString()
      };
      this.setMockItem('classes', classes);
      return classes[idx];
    }
  }

  public static async deleteClass(classId: string): Promise<boolean> {
    if (this.isLiveMode()) {
      return this.request<boolean>('deleteClass', { classId });
    } else {
      const classes = this.getMockItem<Class>('classes');
      const filtered = classes.filter(c => c.class_id !== classId);
      this.setMockItem('classes', filtered);
      return true;
    }
  }

  // Students
  public static async getStudents(): Promise<Student[]> {
    if (this.isLiveMode()) {
      return this.request<Student[]>('getStudents');
    } else {
      return this.getMockItem<Student>('students');
    }
  }

  public static async createStudent(fullName: string, classId: string): Promise<Student> {
    if (this.isLiveMode()) {
      return this.request<Student>('createStudent', { fullName, classId });
    } else {
      const students = this.getMockItem<Student>('students');
      const newStudent: Student = {
        student_id: 'S_' + generateId(),
        full_name: fullName,
        class_id: classId,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      students.push(newStudent);
      this.setMockItem('students', students);
      return newStudent;
    }
  }

  public static async updateStudent(studentId: string, fullName: string, classId: string): Promise<Student> {
    if (this.isLiveMode()) {
      return this.request<Student>('updateStudent', { studentId, fullName, classId });
    } else {
      const students = this.getMockItem<Student>('students');
      const idx = students.findIndex(s => s.student_id === studentId);
      if (idx === -1) throw new Error('Student not found');
      students[idx] = {
        ...students[idx],
        full_name: fullName,
        class_id: classId,
        updated_at: new Date().toISOString()
      };
      this.setMockItem('students', students);
      return students[idx];
    }
  }

  public static async deleteStudent(studentId: string): Promise<boolean> {
    if (this.isLiveMode()) {
      return this.request<boolean>('deleteStudent', { studentId });
    } else {
      const students = this.getMockItem<Student>('students');
      const filtered = students.filter(s => s.student_id !== studentId);
      this.setMockItem('students', filtered);
      return true;
    }
  }

  // Sections
  public static async getPublicSections(): Promise<Section[]> {
    if (this.isLiveMode()) {
      return this.request<Section[]>('getPublicSections');
    } else {
      const all = this.getMockItem<Section>('sections');
      return all.filter(s => s.status === 'PUBLISHED');
    }
  }

  public static async getSections(): Promise<Section[]> {
    if (this.isLiveMode()) {
      return this.request<Section[]>('getSections');
    } else {
      return this.getMockItem<Section>('sections');
    }
  }

  public static async createSection(data: Partial<Section>): Promise<Section> {
    if (this.isLiveMode()) {
      return this.request<Section>('createSection', { data });
    } else {
      const sections = this.getMockItem<Section>('sections');
      const newSection: Section = {
        section_id: 'SEC_' + generateId(),
        class_id: data.class_id || '',
        section_name: data.section_name || '',
        description: data.description || '',
        drive_folder_id: 'mock_folder_sec_' + generateId(),
        materials_folder_id: 'mock_folder_sec_mat_' + generateId(),
        submissions_folder_id: 'mock_folder_sec_sub_' + generateId(),
        publish_at: data.publish_at || '',
        due_at: data.due_at || '',
        submission_enabled: data.submission_enabled !== false,
        status: data.status || 'DRAFT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      sections.push(newSection);
      this.setMockItem('sections', sections);
      return newSection;
    }
  }

  public static async updateSection(sectionId: string, data: Partial<Section>): Promise<Section> {
    if (this.isLiveMode()) {
      return this.request<Section>('updateSection', { sectionId, data });
    } else {
      const sections = this.getMockItem<Section>('sections');
      const idx = sections.findIndex(s => s.section_id === sectionId);
      if (idx === -1) throw new Error('Section not found');
      sections[idx] = {
        ...sections[idx],
        ...data,
        updated_at: new Date().toISOString()
      };
      this.setMockItem('sections', sections);
      return sections[idx];
    }
  }

  public static async deleteSection(sectionId: string): Promise<boolean> {
    if (this.isLiveMode()) {
      return this.request<boolean>('deleteSection', { sectionId });
    } else {
      const sections = this.getMockItem<Section>('sections');
      const filtered = sections.filter(s => s.section_id !== sectionId);
      this.setMockItem('sections', filtered);
      return true;
    }
  }

  // Instructions
  public static async getPublicInstructions(): Promise<Instruction[]> {
    if (this.isLiveMode()) {
      return this.request<Instruction[]>('getPublicInstructions');
    } else {
      const all = this.getMockItem<Instruction>('instructions');
      return all.filter(i => i.status === 'PUBLISHED');
    }
  }

  public static async getInstructions(): Promise<Instruction[]> {
    if (this.isLiveMode()) {
      return this.request<Instruction[]>('getInstructions');
    } else {
      return this.getMockItem<Instruction>('instructions');
    }
  }

  public static async createInstruction(data: Partial<Instruction>): Promise<Instruction> {
    if (this.isLiveMode()) {
      return this.request<Instruction>('createInstruction', { data });
    } else {
      const insts = this.getMockItem<Instruction>('instructions');
      const newInst: Instruction = {
        instruction_id: 'INS_' + generateId(),
        section_id: data.section_id || '',
        title: data.title || '',
        content_html: data.content_html || '',
        attachment_file_id: data.attachment_file_id || '',
        attachment_name: data.attachment_name || '',
        attachment_mime_type: data.attachment_mime_type || '',
        status: data.status || 'PUBLISHED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      insts.push(newInst);
      this.setMockItem('instructions', insts);
      return newInst;
    }
  }

  public static async updateInstruction(instructionId: string, data: Partial<Instruction>): Promise<Instruction> {
    if (this.isLiveMode()) {
      return this.request<Instruction>('updateInstruction', { instructionId, data });
    } else {
      const insts = this.getMockItem<Instruction>('instructions');
      const idx = insts.findIndex(i => i.instruction_id === instructionId);
      if (idx === -1) throw new Error('Instruction not found');
      insts[idx] = {
        ...insts[idx],
        ...data,
        updated_at: new Date().toISOString()
      };
      this.setMockItem('instructions', insts);
      return insts[idx];
    }
  }

  public static async deleteInstruction(instructionId: string): Promise<boolean> {
    if (this.isLiveMode()) {
      return this.request<boolean>('deleteInstruction', { instructionId });
    } else {
      const insts = this.getMockItem<Instruction>('instructions');
      const filtered = insts.filter(i => i.instruction_id !== instructionId);
      this.setMockItem('instructions', filtered);
      return true;
    }
  }

  // Submissions
  public static async getSubmissions(): Promise<Submission[]> {
    if (this.isLiveMode()) {
      return this.request<Submission[]>('getSubmissions');
    } else {
      return this.getMockItem<Submission>('submissions');
    }
  }

  public static async submitAssignment(payload: {
    fullName: string;
    classId: string;
    sectionId: string;
    fileName: string;
    fileBase64: string;
    mimeType: string;
    fileSize: number;
  }): Promise<Submission> {
    if (this.isLiveMode()) {
      return this.request<Submission>('submitAssignment', payload);
    } else {
      // Mock Submission
      const classes = this.getMockItem<Class>('classes');
      const sections = this.getMockItem<Section>('sections');
      const submissions = this.getMockItem<Submission>('submissions');

      const cls = classes.find(c => c.class_id === payload.classId);
      const sec = sections.find(s => s.section_id === payload.sectionId);

      const newSub: Submission = {
        submission_id: 'SUB_' + generateId(),
        timestamp: new Date().toISOString(),
        student_name: payload.fullName,
        class_id: payload.classId,
        class_name: cls ? cls.class_name : 'Unknown Class',
        section_id: payload.sectionId,
        section_name: sec ? sec.section_name : 'Unknown Section',
        original_filename: payload.fileName,
        current_filename: payload.fileName,
        mime_type: payload.mimeType,
        file_size_bytes: payload.fileSize,
        drive_file_id: 'mock_drive_file_' + generateId(),
        status: 'SUBMITTED'
      };

      submissions.push(newSub);
      this.setMockItem('submissions', submissions);

      // Trigger Telegram notification
      await this.triggerMockTelegram(newSub);

      return newSub;
    }
  }

  public static async renameSubmissionFile(submissionId: string, newFileName: string): Promise<boolean> {
    if (this.isLiveMode()) {
      return this.request<boolean>('renameSubmissionFile', { submissionId, newFileName });
    } else {
      const subs = this.getMockItem<Submission>('submissions');
      const idx = subs.findIndex(s => s.submission_id === submissionId);
      if (idx === -1) throw new Error('Submission not found');
      subs[idx].current_filename = newFileName;
      this.setMockItem('submissions', subs);
      return true;
    }
  }

  public static async deleteSubmission(submissionId: string): Promise<boolean> {
    if (this.isLiveMode()) {
      return this.request<boolean>('deleteSubmission', { submissionId });
    } else {
      // 1. Delete submission
      const subs = this.getMockItem<Submission>('submissions');
      const filteredSubs = subs.filter(s => s.submission_id !== submissionId);
      this.setMockItem('submissions', filteredSubs);

      // 2. Delete score
      const scores = this.getMockItem<Score>('scores');
      const filteredScores = scores.filter(s => s.submission_id !== submissionId);
      this.setMockItem('scores', filteredScores);

      return true;
    }
  }

  // Scores
  public static async getScores(): Promise<Score[]> {
    if (this.isLiveMode()) {
      return this.request<Score[]>('getScores');
    } else {
      return this.getMockItem<Score>('scores');
    }
  }

  public static async saveScore(data: {
    submissionId: string;
    score: number;
    maxScore: number;
    feedback: string;
  }): Promise<Score> {
    if (this.isLiveMode()) {
      return this.request<Score>('saveScore', data);
    } else {
      const scores = this.getMockItem<Score>('scores');
      const subs = this.getMockItem<Submission>('submissions');
      const sub = subs.find(s => s.submission_id === data.submissionId);

      if (!sub) throw new Error('Submission not found');

      const existingIdx = scores.findIndex(s => s.submission_id === data.submissionId);
      const gradedBy = this.getAdminDisplayName();

      const newScore: Score = {
        score_id: existingIdx > -1 ? scores[existingIdx].score_id : 'SC_' + generateId(),
        submission_id: data.submissionId,
        student_name: sub.student_name,
        class_id: sub.class_id,
        class_name: sub.class_name,
        section_id: sub.section_id,
        section_name: sub.section_name,
        score: data.score,
        max_score: data.maxScore,
        feedback: data.feedback,
        graded_at: new Date().toISOString(),
        graded_by: gradedBy
      };

      if (existingIdx > -1) {
        scores[existingIdx] = newScore;
      } else {
        scores.push(newScore);
      }

      this.setMockItem('scores', scores);
      return newScore;
    }
  }

  // Mock Telegram sender
  private static async triggerMockTelegram(sub: Submission): Promise<void> {
    const settings = this.getMockSettings();
    const token = settings.TELEGRAM_BOT_TOKEN;
    const chatId = settings.TELEGRAM_CHAT_ID;

    const formattedTime = new Date(sub.timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const text = `New Submission\n\nName:\n${sub.student_name}\n\nClass:\n${sub.class_name}\n\nAssignment:\n${sub.section_name}\n\nFile:\n${sub.original_filename}\n\nTime:\n${formattedTime}`;

    console.log('Sending Notification to Telegram Bot:', text);

    if (token && chatId) {
      try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: text }),
        });
      } catch (err) {
        console.warn('Mock Telegram failed (non-blocking as per spec):', err);
      }
    }
  }

  // === ADMINS CRUD ===
  public static async getAdmins(): Promise<Admin[]> {
    if (this.isLiveMode()) {
      return this.request<Admin[]>('getAdmins');
    } else {
      return this.getMockItem<Admin>('admins');
    }
  }

  public static async createAdmin(username: string, passwordHash: string, displayName: string): Promise<Admin> {
    if (this.isLiveMode()) {
      return this.request<Admin>('createAdmin', { username, password_hash: passwordHash, display_name: displayName });
    } else {
      const admins = this.getMockItem<Admin>('admins');
      const exists = admins.some(a => a.username === username);
      if (exists) {
        throw new Error('Username sudah digunakan oleh administrator lain.');
      }
      const newAdmin: Admin = {
        admin_id: 'ADM_' + generateId(),
        username,
        password_hash: passwordHash,
        password_salt: 'salt',
        display_name: displayName,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: ''
      };
      admins.push(newAdmin);
      this.setMockItem('admins', admins);
      return newAdmin;
    }
  }

  public static async updateAdmin(adminId: string, username: string, passwordHash: string | null, displayName: string): Promise<boolean> {
    if (this.isLiveMode()) {
      return this.request<boolean>('updateAdmin', { adminId, username, password_hash: passwordHash, display_name: displayName });
    } else {
      const admins = this.getMockItem<Admin>('admins');
      const idx = admins.findIndex(a => a.admin_id === adminId);
      if (idx === -1) {
        throw new Error('Admin tidak ditemukan');
      }
      admins[idx] = {
        ...admins[idx],
        username,
        display_name: displayName,
        updated_at: new Date().toISOString()
      };
      if (passwordHash) {
        admins[idx].password_hash = passwordHash;
      }
      this.setMockItem('admins', admins);
      return true;
    }
  }

  public static async deleteAdmin(adminId: string): Promise<boolean> {
    if (this.isLiveMode()) {
      return this.request<boolean>('deleteAdmin', { adminId });
    } else {
      const admins = this.getMockItem<Admin>('admins');
      if (admins.length <= 1) {
        throw new Error('Tidak dapat menghapus admin terakhir.');
      }
      const filtered = admins.filter(a => a.admin_id !== adminId);
      this.setMockItem('admins', filtered);
      return true;
    }
  }

  // === LOGO UPLOAD ===
  public static async uploadLogo(fileName: string, mimeType: string, base64Data: string): Promise<{ url: string }> {
    if (this.isLiveMode()) {
      return this.request<{ url: string }>('uploadLogo', { fileName, mimeType, base64Data });
    } else {
      // Mock logo upload: save the base64 as the logo image URL directly
      const logoUrl = `data:${mimeType};base64,${base64Data}`;
      const settings = this.getMockItem<Setting>('settings');
      const idx = settings.findIndex(s => s.setting_key === 'PORTAL_LOGO_IMAGE_URL');
      if (idx > -1) {
        settings[idx].setting_value = logoUrl;
        settings[idx].updated_at = new Date().toISOString();
      } else {
        settings.push({
          setting_key: 'PORTAL_LOGO_IMAGE_URL',
          setting_value: logoUrl,
          updated_at: new Date().toISOString()
        });
      }
      this.setMockItem('settings', settings);
      return { url: logoUrl };
    }
  }

  // === FILE MANAGER & DRIVE INTEGRATION ===
  public static async listDriveFiles(): Promise<DriveFile[]> {
    if (this.isLiveMode()) {
      return this.request<DriveFile[]>('listDriveFiles');
    } else {
      return JSON.parse(localStorage.getItem('educlass_drive_files') || '[]');
    }
  }

  public static async uploadDriveFile(fileName: string, mimeType: string, base64Data: string, folderName: string = 'Materials'): Promise<DriveFile> {
    if (this.isLiveMode()) {
      return this.request<DriveFile>('uploadDriveFile', { fileName, mimeType, base64Data, folderName });
    } else {
      const files = JSON.parse(localStorage.getItem('educlass_drive_files') || '[]');
      const fileUrl = `data:${mimeType};base64,${base64Data}`;
      const newFile: DriveFile = {
        id: 'mock_drive_file_' + generateId(),
        name: fileName,
        mimeType: mimeType,
        sizeBytes: Math.round(base64Data.length * 0.75), // Estimate real binary size
        downloadUrl: fileUrl, // keep local url for mock download/preview
        parentName: folderName,
        path: ['EduClass', 'Materials', fileName],
        createdAt: new Date().toISOString()
      };
      files.unshift(newFile);
      localStorage.setItem('educlass_drive_files', JSON.stringify(files));
      return newFile;
    }
  }

  public static async deleteDriveFile(fileId: string): Promise<boolean> {
    if (this.isLiveMode()) {
      return this.request<boolean>('deleteDriveFile', { fileId });
    } else {
      const files = JSON.parse(localStorage.getItem('educlass_drive_files') || '[]');
      const filtered = files.filter((f: any) => f.id !== fileId);
      localStorage.setItem('educlass_drive_files', JSON.stringify(filtered));
      return true;
    }
  }
}
