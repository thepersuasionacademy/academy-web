//src/app/ai/components/dashboard/ToolForm.tsx
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { type Tool } from './types'

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

  const updateInputField = (id: string, field: 'name' | 'description', value: string) => {
    setInputFields(prevFields => 
      prevFields.map(input => 
        input.id === id ? { ...input, [field]: value } : input
      )
    )
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      onSubmit(formData)
    }} className="space-y-8">
      {/* Tool Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Tool Name
        </label>
        <input
          type="text"
          name="name"
          required
          defaultValue={initialData?.name}
          placeholder="Enter a name for your tool..."
          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Description
        </label>
        <textarea
          name="description"
          required
          defaultValue={initialData?.description}
          placeholder="Describe what your tool does..."
          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200 min-h-24 resize-none"
        />
      </div>

      {/* Input Fields Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-200">
            Input Fields
          </label>
          <button
            type="button"
            onClick={() => setShowAdditionalFields(!showAdditionalFields)}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-2"
          >
            {showAdditionalFields ? 'Hide' : 'Show'} Additional Fields
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAdditionalFields ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Required Field */}
        <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Field 1 Name (Required)
              </label>
              <input
                type="text"
                name="inputField1"
                value={inputFields[0].name}
                onChange={(e) => updateInputField('1', 'name', e.target.value)}
                placeholder="e.g., Content"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Field 1 Description (Optional)
              </label>
              <input
                type="text"
                name="inputField1Description"
                value={inputFields[0].description}
                onChange={(e) => updateInputField('1', 'description', e.target.value)}
                placeholder="Help text for field 1..."
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        {/* Additional Fields */}
        {showAdditionalFields && inputFields.slice(1).map((field, index) => (
          <div key={field.id} className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Field {index + 2} Name
                </label>
                <input
                  type="text"
                  name={`inputField${index + 2}`}
                  value={field.name}
                  onChange={(e) => updateInputField(field.id, 'name', e.target.value)}
                  placeholder={`e.g., ${index === 0 ? 'Tone' : 'Keywords'}`}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Field {index + 2} Description (Optional)
                </label>
                <input
                  type="text"
                  name={`inputField${index + 2}Description`}
                  value={field.description}
                  onChange={(e) => updateInputField(field.id, 'description', e.target.value)}
                  placeholder={`Help text for field ${index + 2}...`}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prompt Template */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Prompt Template
        </label>
        <textarea
          name="promptTemplate"
          required
          defaultValue={initialData?.promptTemplate}
          placeholder="Enter the Claude prompt template..."
          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200 min-h-32 resize-none"
        />
        <p className="text-sm text-gray-400">
          Use {'{fieldName}'} to reference input fields in your template
        </p>
      </div>

      {/* Credit Cost */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Credit Cost
        </label>
        <input
          type="number"
          name="creditCost"
          min="1"
          required
          defaultValue={initialData?.creditCost}
          placeholder="Cost per use..."
          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-800/50 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#9d042b] hover:bg-[#8a0326] disabled:bg-[#6d021f] disabled:cursor-not-allowed text-white rounded-lg py-3 px-4 font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
      >
        {loading ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Tool' : 'Create Tool')}
      </button>
    </form>
  )
}