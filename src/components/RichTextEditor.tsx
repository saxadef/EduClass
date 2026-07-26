import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Type,
  ChevronDown,
  Check,
  Palette
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const FONTS = [
  { name: 'Calibri', value: 'Calibri, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { name: 'Garamond', value: 'Garamond, serif' }
];

const STANDARD_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30'];

const PALETTE_COLORS = [
  { name: 'Hitam', value: '#171717' },
  { name: 'Abu-Abu', value: '#737373' },
  { name: 'Merah', value: '#dc2626' },
  { name: 'Oranye', value: '#ea580c' },
  { name: 'Kuning', value: '#eab308' },
  { name: 'Hijau', value: '#16a34a' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Biru', value: '#2563eb' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Ungu', value: '#9333ea' },
  { name: 'Pink', value: '#db2777' }
];

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // States for active toolbar properties
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [selectedFontFamily, setSelectedFontFamily] = useState('Calibri');
  const [selectedFontSize, setSelectedFontSize] = useState('11');
  const [sizeInputValue, setSizeInputValue] = useState('11');
  const [selectedColor, setSelectedColor] = useState('#171717');

  // Dropdown states
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);

  // Helper to convert RGB to Hex for color display matching
  const rgbToHex = (rgbStr: string): string | null => {
    if (!rgbStr) return null;
    if (rgbStr.startsWith('#')) return rgbStr;
    const match = rgbStr.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return null;
  };

  // Synchronize initial & external values to editor
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, argValue: string = '') => {
    editorRef.current?.focus();
    document.execCommand(command, false, argValue);
    handleInput();
    updateToolbarStates();
  };

  // Word-style font size application
  const applyFontSize = (sizeStr: string) => {
    const num = parseInt(sizeStr);
    if (isNaN(num) || num < 6 || num > 100) return;

    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
      // Insertion point collapsed: create styled container with zero-width space
      const span = document.createElement('span');
      span.style.fontSize = `${num}pt`;
      span.innerHTML = '&#8203;'; // zero-width space
      
      range.insertNode(span);
      
      // Place cursor inside the span after the zero-width space
      const newRange = document.createRange();
      newRange.setStart(span.firstChild!, 1);
      newRange.setEnd(span.firstChild!, 1);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      setSelectedFontSize(num.toString());
      setSizeInputValue(num.toString());
      handleInput();
    } else {
      // Normal range selection: use identifyable font tag trick
      document.execCommand('fontSize', false, '7');
      if (editorRef.current) {
        const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
        fontElements.forEach(fontEl => {
          const span = document.createElement('span');
          span.style.fontSize = `${num}pt`;
          const existingStyle = fontEl.getAttribute('style');
          if (existingStyle) {
            span.setAttribute('style', `${existingStyle}; font-size: ${num}pt`);
          }
          span.innerHTML = fontEl.innerHTML;
          fontEl.parentNode?.replaceChild(span, fontEl);
        });
        handleInput();
        setSelectedFontSize(num.toString());
        setSizeInputValue(num.toString());
      }
    }
    setIsSizeDropdownOpen(false);
  };

  const applyFontFamily = (fontValue: string, fontName: string) => {
    executeCommand('fontName', fontValue);
    setSelectedFontFamily(fontName);
    setIsFontDropdownOpen(false);
  };

  const applyColor = (colorHex: string) => {
    executeCommand('foreColor', colorHex);
    setSelectedColor(colorHex);
    setIsColorDropdownOpen(false);
  };

  // Dynamically pull currently active styling styles based on cursor selection
  const updateToolbarStates = () => {
    if (!editorRef.current) return;
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));

    if (document.queryCommandState('justifyLeft')) setAlignment('left');
    else if (document.queryCommandState('justifyCenter')) setAlignment('center');
    else if (document.queryCommandState('justifyRight')) setAlignment('right');
    else if (document.queryCommandState('justifyFull')) setAlignment('justify');
    else setAlignment('left');

    const rawFont = document.queryCommandValue('fontName');
    if (rawFont) {
      const cleanFontName = rawFont.replace(/['"]/g, '').split(',')[0];
      const found = FONTS.find(f => f.name.toLowerCase() === cleanFontName.toLowerCase() || f.value.toLowerCase().includes(cleanFontName.toLowerCase()));
      if (found) {
        setSelectedFontFamily(found.name);
      } else {
        setSelectedFontFamily(cleanFontName);
      }
    }

    const rawColor = document.queryCommandValue('foreColor');
    if (rawColor) {
      const hex = rgbToHex(rawColor);
      if (hex) setSelectedColor(hex);
    }

    // Inspect the selection to locate the nearest font size value
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let parent = selection.getRangeAt(0).commonAncestorContainer as HTMLElement;
      if (parent.nodeType === Node.TEXT_NODE) {
        parent = parent.parentNode as HTMLElement;
      }
      if (parent && editorRef.current.contains(parent)) {
        let sizeVal = '';
        let currentEl: HTMLElement | null = parent;
        while (currentEl && currentEl !== editorRef.current) {
          if (currentEl.style.fontSize) {
            sizeVal = currentEl.style.fontSize;
            break;
          }
          currentEl = currentEl.parentElement;
        }
        if (sizeVal) {
          const num = parseFloat(sizeVal);
          if (!isNaN(num)) {
            setSelectedFontSize(num.toString());
            setSizeInputValue(num.toString());
          }
        } else {
          setSelectedFontSize('11');
          setSizeInputValue('11');
        }
      }
    }
  };

  // Selection change listener to keep toolbar state accurate
  useEffect(() => {
    const handleSelectionChange = () => {
      updateToolbarStates();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.rte-dropdown-font')) setIsFontDropdownOpen(false);
      if (!target.closest('.rte-dropdown-size')) setIsSizeDropdownOpen(false);
      if (!target.closest('.rte-dropdown-color')) setIsColorDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSizeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFontSize(sizeInputValue);
      editorRef.current?.focus();
    }
  };

  const handleSizeInputBlur = () => {
    applyFontSize(sizeInputValue);
  };

  return (
    <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
      {/* MS Word/Google Docs Style Advanced Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-neutral-50 p-2 border-b border-neutral-200 select-none">
        
        {/* Font Family Dropdown */}
        <div className="relative rte-dropdown-font">
          <button
            type="button"
            onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
            className="h-8 px-2.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md text-xs font-medium text-neutral-800 flex items-center gap-1.5 min-w-[110px] justify-between cursor-pointer transition active:scale-98"
            title="Font"
          >
            <span className="truncate">{selectedFontFamily}</span>
            <ChevronDown className="w-3 h-3 text-neutral-500 shrink-0" />
          </button>
          
          {isFontDropdownOpen && (
            <div className="absolute left-0 mt-1 z-40 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 w-48 max-h-60 overflow-y-auto">
              {FONTS.map(font => (
                <button
                  key={font.name}
                  type="button"
                  onClick={() => applyFontFamily(font.value, font.name)}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-neutral-100 flex items-center justify-between cursor-pointer"
                  style={{ fontFamily: font.value }}
                >
                  <span>{font.name}</span>
                  {selectedFontFamily === font.name && (
                    <Check className="w-3.5 h-3.5 text-neutral-700" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Input + Standard List */}
        <div className="relative flex items-center rte-dropdown-size">
          <input
            type="text"
            value={sizeInputValue}
            onChange={(e) => setSizeInputValue(e.target.value)}
            onKeyDown={handleSizeInputKeyDown}
            onBlur={handleSizeInputBlur}
            className="w-10 h-8 text-center bg-white border border-neutral-200 border-r-0 rounded-l-md text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-300"
            title="Font Size (Ketik angka & tekan Enter)"
          />
          <button
            type="button"
            onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
            className="h-8 px-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-r-md flex items-center justify-center cursor-pointer transition active:scale-98"
            title="Ukuran Font Standar"
          >
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {isSizeDropdownOpen && (
            <div className="absolute left-0 mt-9 z-40 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 w-20 max-h-52 overflow-y-auto">
              {STANDARD_SIZES.map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => applyFontSize(sz)}
                  className="w-full px-3 py-1.5 text-center text-xs hover:bg-neutral-100 flex items-center justify-between cursor-pointer font-medium"
                >
                  <span>{sz}</span>
                  {selectedFontSize === sz && (
                    <Check className="w-3 h-3 text-neutral-700" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-[1px] bg-neutral-200 mx-1" />

        {/* Font Style: Bold, Italic, Underline */}
        <div className="flex items-center bg-white border border-neutral-200 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className={`p-1.5 hover:bg-neutral-100 transition cursor-pointer ${
              isBold ? 'bg-neutral-200 text-neutral-900 font-bold' : 'text-neutral-600'
            }`}
            title="Tebal (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className={`p-1.5 hover:bg-neutral-100 border-l border-neutral-200 transition cursor-pointer ${
              isItalic ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-600'
            }`}
            title="Miring (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            className={`p-1.5 hover:bg-neutral-100 border-l border-neutral-200 transition cursor-pointer ${
              isUnderline ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-600'
            }`}
            title="Garis Bawah (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Text Color Dropdown */}
        <div className="relative rte-dropdown-color">
          <button
            type="button"
            onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
            className="h-8 px-2 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md flex items-center gap-1.5 cursor-pointer transition active:scale-98"
            title="Warna Teks"
          >
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold leading-none -mt-0.5">A</span>
              <div
                className="w-4 h-1 rounded-sm mt-0.5 border border-neutral-300"
                style={{ backgroundColor: selectedColor }}
              />
            </div>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {isColorDropdownOpen && (
            <div className="absolute left-0 mt-1 z-40 bg-white border border-neutral-200 rounded-lg shadow-lg p-3 w-48 space-y-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Pilihan Warna</div>
              
              {/* Color Grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {PALETTE_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => applyColor(color.value)}
                    className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center transition hover:scale-110 cursor-pointer focus:outline-none"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {selectedColor.toLowerCase() === color.value.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-white mix-blend-difference" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Native Color Input */}
              <div className="border-t border-neutral-100 pt-2 flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-neutral-500">Custom:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    ref={colorInputRef}
                    value={selectedColor}
                    onChange={(e) => applyColor(e.target.value)}
                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer shrink-0"
                    title="Pilih Warna Custom"
                  />
                  <span className="text-[10px] font-mono font-semibold text-neutral-700 uppercase bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                    {selectedColor}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-[1px] bg-neutral-200 mx-1" />

        {/* Paragraph Alignment */}
        <div className="flex items-center bg-white border border-neutral-200 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => executeCommand('justifyLeft')}
            className={`p-1.5 hover:bg-neutral-100 transition cursor-pointer ${
              alignment === 'left' ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-600'
            }`}
            title="Rata Kiri"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyCenter')}
            className={`p-1.5 hover:bg-neutral-100 border-l border-neutral-200 transition cursor-pointer ${
              alignment === 'center' ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-600'
            }`}
            title="Rata Tengah"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyRight')}
            className={`p-1.5 hover:bg-neutral-100 border-l border-neutral-200 transition cursor-pointer ${
              alignment === 'right' ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-600'
            }`}
            title="Rata Kanan"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyFull')}
            className={`p-1.5 hover:bg-neutral-100 border-l border-neutral-200 transition cursor-pointer ${
              alignment === 'justify' ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-600'
            }`}
            title="Rata Kiri Kanan (Justified)"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        <div className="h-5 w-[1px] bg-neutral-200 mx-1" />

        {/* Lists: Bullets and Numberings */}
        <div className="flex items-center bg-white border border-neutral-200 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 hover:bg-neutral-100 text-neutral-600 transition cursor-pointer"
            title="Bullet List (Daftar Simbol)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 hover:bg-neutral-100 border-l border-neutral-200 text-neutral-600 transition cursor-pointer"
            title="Numbered List (Daftar Angka)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editable Text Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[180px] max-h-[350px] overflow-y-auto focus:outline-none prose max-w-none text-neutral-800 text-sm leading-relaxed"
        style={{ direction: 'ltr' }}
      />
    </div>
  );
}

