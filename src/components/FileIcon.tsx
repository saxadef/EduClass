import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  File, 
  FileSpreadsheet, 
  Film, 
  Presentation,
  Music,
  Code
} from 'lucide-react';

export const getFileIcon = (mimeType: string) => {
  if (!mimeType) return File;
  const mt = mimeType.toLowerCase();
  
  if (mt.startsWith('image/')) {
    return ImageIcon;
  }
  if (mt.includes('pdf')) {
    return FileText;
  }
  if (
    mt.includes('spreadsheet') || 
    mt.includes('excel') || 
    mt.includes('csv') || 
    mt.includes('sheet')
  ) {
    return FileSpreadsheet;
  }
  if (
    mt.includes('presentation') || 
    mt.includes('powerpoint') || 
    mt.includes('keynote')
  ) {
    return Presentation;
  }
  if (
    mt.includes('word') || 
    mt.includes('document') || 
    mt.includes('text') || 
    mt.includes('rtf')
  ) {
    return FileText;
  }
  if (mt.startsWith('video/')) {
    return Film;
  }
  if (mt.startsWith('audio/')) {
    return Music;
  }
  if (mt.includes('javascript') || mt.includes('html') || mt.includes('css') || mt.includes('json')) {
    return Code;
  }
  return File;
};

interface FileIconProps {
  mimeType: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ mimeType, className = "w-5 h-5 text-neutral-500" }) => {
  const IconComponent = getFileIcon(mimeType);
  return <IconComponent className={className} />;
};
