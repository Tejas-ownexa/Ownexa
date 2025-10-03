import React, { useState } from 'react';
import { X, ChevronDown, Bold, Italic, Underline, Strikethrough, List, Link, RotateCcw, RotateCw } from 'lucide-react';

const ComposeEmailModal = ({ isOpen, onClose }) => {
  const [from, setFrom] = useState('Tejas Choksi (reply.managebuilding.com)');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [template, setTemplate] = useState('');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50">
      <div className="bg-white w-full max-w-4xl mt-8 rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">New email</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-500 dark:text-gray-300 hover:text-gray-700">
              <span className="text-2xl">−</span>
            </button>
            <button className="text-gray-500 dark:text-gray-300 hover:text-gray-700">
              <span className="text-xl">⤢</span>
            </button>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-300 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Email Form */}
        <div className="p-4">
          {/* From Field */}
          <div className="mb-4">
            <label className="block text-gray-600 mb-1">From:</label>
            <div className="relative">
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-blue-500"
                readOnly
              />
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 h-4 w-4" />
            </div>
          </div>

          {/* To Field */}
          <div className="mb-4">
            <label className="block text-gray-600 mb-1">To</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Subject Field */}
          <div className="mb-4">
            <label className="block text-gray-600 mb-1">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Template Field */}
          <div className="mb-4">
            <label className="block text-gray-600 mb-1">Template:</label>
            <div className="relative">
              <input
                type="text"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-blue-500"
                placeholder="Select template..."
              />
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 h-4 w-4" />
            </div>
          </div>

          {/* Rich Text Editor Toolbar */}
          <div className="border rounded-t p-2 flex items-center gap-2 bg-gray-50">
            <select className="border rounded px-2 py-1">
              <option>sans-serif</option>
            </select>
            <select className="border rounded px-2 py-1">
              <option>12pt</option>
            </select>
            <div className="flex items-center gap-1 border-l border-r px-2">
              <button className="p-1 hover:bg-gray-200 rounded"><Bold className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-gray-200 rounded"><Italic className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-gray-200 rounded"><Underline className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-gray-200 rounded"><Strikethrough className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-gray-200 rounded"><List className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-gray-200 rounded"><Link className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button className="p-1 hover:bg-gray-200 rounded"><RotateCcw className="h-4 w-4" /></button>
              <button className="p-1 hover:bg-gray-200 rounded"><RotateCw className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Editor Content */}
          <div className="border-l border-r border-b rounded-b p-4 min-h-[300px]">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[300px] focus:outline-none resize-none"
              placeholder="Type your message here..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <button className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
            Send
          </button>
          <div className="flex items-center gap-4">
            <button className="text-blue-600 hover:text-blue-700">Write with AI</button>
            <button className="text-gray-600 hover:text-gray-700"><Link className="h-5 w-5" /></button>
            <button className="text-gray-600 hover:text-gray-700">⏲</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeEmailModal;
