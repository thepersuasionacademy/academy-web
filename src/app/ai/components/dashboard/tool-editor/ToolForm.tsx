//src/app/ai/components/dashboard/ToolForm.tsx
'use client'

import { ChevronDown } from 'lucide-react'
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
  categoryInput: string
  suiteInput: string
  loading: boolean
  error: string
  initialData?: Tool // For editing mode
}

export function ToolForm({
  onSubmit,
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

  return (
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
  )
}