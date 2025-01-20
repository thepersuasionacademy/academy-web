'use client'

import { ChevronDown, Trash2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { type Tool } from '../types'
import { useTheme } from '@/app/context/ThemeContext'

type InputField = {
  id: string
  name: string
  description: string
}

interface ToolFormProps {
  onSubmit: (formData: FormData) => Promise<void>
  onDelete?: () => Promise<void>
  categoryInput: string
  suiteInput: string
  loading: boolean
  error: string
  initialData?: Tool
}

export function ToolForm({
  onSubmit,
  onDelete,
  categoryInput,
  suiteInput,
  loading,
  error,
  initialData
}: ToolFormProps) {
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)
  const [inputFields, setInputFields] = useState<InputField[]>([
    { id: '1', name: initialData?.inputField1 || '', description: initialData?.inputField1Description || '' },
    { id: '2', name: '', description: '' },
    { id: '3', name: '', description: '' }
  ])
  const { theme } = useTheme()

  const updateInputField = (id: string, field: 'name' | 'description', value: string) => {
    setInputFields(prevFields => 
      prevFields.map(input => 
        input.id === id ? { ...input, [field]: value } : input
      )
    )
  }

  const inputStyles = `w-full px-4 py-3 
    ${theme === 'dark' 
      ? 'bg-gray-900/50 border-gray-700/50 text-gray-100 placeholder:text-gray-500' 
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
    } 
    border rounded-lg 
    focus:outline-none focus:border-[var(--accent)] focus:border-2 
    transition-colors duration-200`

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        onSubmit(formData)
      }} className="space-y-8">
        {/* Tool Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Tool Name
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={initialData?.name}
            placeholder="Enter a name for your tool..."
            className={inputStyles}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Description
          </label>
          <textarea
            name="description"
            required
            defaultValue={initialData?.description}
            placeholder="Describe what your tool does..."
            className={`${inputStyles} min-h-24 resize-none`}
          />
        </div>

        {/* Input Fields Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Input Fields
            </label>
            <button
              type="button"
              onClick={() => setShowAdditionalFields(!showAdditionalFields)}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--foreground)] flex items-center gap-2"
            >
              {showAdditionalFields ? 'Hide' : 'Show'} Additional Fields
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAdditionalFields ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Required Field */}
          <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Field 1 Name (Required)
                </label>
                <input
                  type="text"
                  name="inputField1"
                  value={inputFields[0].name}
                  onChange={(e) => updateInputField('1', 'name', e.target.value)}
                  placeholder="e.g., Content"
                  className={inputStyles}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Field 1 Description (Optional)
                </label>
                <input
                  type="text"
                  name="inputField1Description"
                  value={inputFields[0].description}
                  onChange={(e) => updateInputField('1', 'description', e.target.value)}
                  placeholder="Help text for field 1..."
                  className={inputStyles}
                />
              </div>
            </div>
          </div>

          {/* Additional Fields */}
          {showAdditionalFields && inputFields.slice(1).map((field, index) => (
            <div key={field.id} className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Field {index + 2} Name
                  </label>
                  <input
                    type="text"
                    name={`inputField${index + 2}`}
                    value={field.name}
                    onChange={(e) => updateInputField(field.id, 'name', e.target.value)}
                    placeholder={`e.g., ${index === 0 ? 'Tone' : 'Keywords'}`}
                    className={inputStyles}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Field {index + 2} Description (Optional)
                  </label>
                  <input
                    type="text"
                    name={`inputField${index + 2}Description`}
                    value={field.description}
                    onChange={(e) => updateInputField(field.id, 'description', e.target.value)}
                    placeholder={`Help text for field ${index + 2}...`}
                    className={inputStyles}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Prompt Template */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Prompt Template
          </label>
          <textarea
            name="promptTemplate"
            required
            defaultValue={initialData?.promptTemplate}
            placeholder="Enter the Claude prompt template..."
            className={`${inputStyles} min-h-32 resize-none font-mono`}
          />
          <p className="text-sm text-[var(--text-secondary)]">
            Use {'{fieldName}'} to reference input fields in your template
          </p>
        </div>

        {/* Credit Cost */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Credit Cost
          </label>
          <input
            type="number"
            name="creditCost"
            min="1"
            required
            defaultValue={initialData?.creditCost}
            placeholder="Cost per use..."
            className={inputStyles}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className={`${
            theme === 'dark' 
              ? 'bg-red-900/50 border-red-800/50 text-red-200' 
              : 'bg-red-100 border-red-200 text-red-800'
            } border rounded-lg p-4`}
          >
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-3 px-4 font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          {loading ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Tool' : 'Create Tool')}
        </button>
      </form>

      {/* Delete Button - Only show when editing and onDelete is provided */}
      {initialData && onDelete && (
        <>
          <div className="pt-8 border-t border-[var(--border-color)] flex flex-col items-center">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={loading}
              className="group flex flex-col items-center px-4 py-2 text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Trash2 className="w-5 h-5 mb-1" />
              <span className="text-sm">Delete</span>
            </button>
          </div>

          {isDeleteModalOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-[var(--background)]/50 backdrop-blur-sm transition-opacity z-50"
                onClick={() => setIsDeleteModalOpen(false)}
              />

              {/* Modal */}
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-[var(--card-bg)] rounded-xl shadow-xl border border-[var(--border-color)] z-50">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                    Delete Tool
                  </h3>
                  
                  <p className="text-[var(--text-secondary)] mb-6">
                    Are you sure you want to delete &quot;{initialData.name}&quot;? This action cannot be undone.
                  </p>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 rounded-lg bg-[var(--hover-bg)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]/80 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={() => {
                        onDelete();
                        setIsDeleteModalOpen(false);
                      }}
                      disabled={loading}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}