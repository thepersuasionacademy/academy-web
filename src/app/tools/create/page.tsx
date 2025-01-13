'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'

type Category = {
  id: string
  name: string
}

type Suite = {
  id: string
  name: string
}

type InputField = {
  id: string
  name: string
  description: string
}

type SuccessState = {
  name: string
  category: string
  suite: string
  inputField1: string
  inputField1Description: string
  inputField2?: string
  inputField2Description?: string
  inputField3?: string
  inputField3Description?: string
}

const inputStyles = "w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200"
const comboboxStyles = "w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#9d042b] focus:border-2 transition-colors duration-200"

export default function CreateToolPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [suites, setSuites] = useState<Suite[]>([])
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)
  const [inputFields, setInputFields] = useState<InputField[]>([
    { id: '1', name: '', description: '' },
    { id: '2', name: '', description: '' },
    { id: '3', name: '', description: '' }
  ])
  
  const [categoryInput, setCategoryInput] = useState('')
  const [suiteInput, setSuiteInput] = useState('')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isSuiteDropdownOpen, setIsSuiteDropdownOpen] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingSuites, setIsLoadingSuites] = useState(false)

  // Add refs for the dropdown containers
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  const suiteDropdownRef = useRef<HTMLDivElement>(null)

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categoryInput.toLowerCase())
  )
  
  const filteredSuites = suites.filter(suite => 
    suite.name.toLowerCase().includes(suiteInput.toLowerCase())
  )

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
      if (suiteDropdownRef.current && !suiteDropdownRef.current.contains(event.target as Node)) {
        setIsSuiteDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const response = await fetch('/api/ai/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        if (Array.isArray(data.categories)) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError('Failed to load categories')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    if (!categoryInput) {
      setSuites([])
      return
    }

    const fetchSuites = async () => {
      try {
        setIsLoadingSuites(true)
        const category = categories.find(c => c.name === categoryInput)
        if (category) {
          const response = await fetch(`/api/ai/categories/${category.id}/suites`)
          if (!response.ok) {
            throw new Error('Failed to fetch suites')
          }
          const data = await response.json()
          if (Array.isArray(data.suites)) {
            // Log the raw data to see what we're getting
            console.log('Raw suites data:', data.suites)
            
            // Filter to only include items where the name property doesn't include 'TOOL'
            const filteredSuites = data.suites.filter((suite: Suite) => 
              !suite.name.includes('TOOL')
            )
            console.log('Filtered suites:', filteredSuites)
            setSuites(filteredSuites)
          }
        }
      } catch (error) {
        console.error('Error fetching suites:', error)
        setError('Failed to load suites')
      } finally {
        setIsLoadingSuites(false)
      }
    }

    fetchSuites()
  }, [categoryInput, categories])

  const updateInputField = (id: string, field: 'name' | 'description', value: string) => {
    setInputFields(prevFields => 
      prevFields.map(input => 
        input.id === id ? { ...input, [field]: value } : input
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(null)

    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)

      // Check if category exists
      let categoryId: string
      const existingCategory = categories.find(c => c.name === categoryInput)

      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        const categoryResponse = await fetch('/api/ai/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryInput })
        })

        if (!categoryResponse.ok) {
          throw new Error(`Failed to create category: ${await categoryResponse.text()}`)
        }
        const categoryData = await categoryResponse.json()
        categoryId = categoryData.category.id
      }

      // Check if suite exists
      let suiteId: string
      const existingSuite = suites.find(s => s.name === suiteInput)

      if (existingSuite) {
        suiteId = existingSuite.id
      } else {
        const suiteResponse = await fetch(`/api/ai/categories/${categoryId}/suites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: suiteInput })
        })

        if (!suiteResponse.ok) {
          throw new Error(`Failed to create suite: ${await suiteResponse.text()}`)
        }
        const suiteData = await suiteResponse.json()
        suiteId = suiteData.suite.id
      }

      const toolData = {
        categoryName: categoryInput,
        suiteName: suiteInput,
        name: formData.get('name'),
        description: formData.get('description'),
        promptTemplate: formData.get('promptTemplate'),
        creditCost: Number(formData.get('creditCost')),
        inputField1: inputFields[0].name,
        inputField1Description: inputFields[0].description,
        ...(inputFields[1].name && {
          inputField2: inputFields[1].name,
          inputField2Description: inputFields[1].description
        }),
        ...(inputFields[2].name && {
          inputField3: inputFields[2].name,
          inputField3Description: inputFields[2].description
        })
      }

      const toolResponse = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toolData)
      })

      if (!toolResponse.ok) {
        const text = await toolResponse.text()
        try {
          const json = JSON.parse(text)
          throw new Error(json.details || json.error || text)
        } catch {
          throw new Error(text)
        }
      }

      const result = await toolResponse.json()
      
      setSuccess({
        name: toolData.name as string,
        category: categoryInput,
        suite: suiteInput,
        inputField1: toolData.inputField1,
        inputField1Description: toolData.inputField1Description,
        ...(toolData.inputField2 && {
          inputField2: toolData.inputField2,
          inputField2Description: toolData.inputField2Description
        }),
        ...(toolData.inputField3 && {
          inputField3: toolData.inputField3,
          inputField3Description: toolData.inputField3Description
        })
      })

      form.reset()
      setInputFields([
        { id: '1', name: '', description: '' },
        { id: '2', name: '', description: '' },
        { id: '3', name: '', description: '' }
      ])
      setCategoryInput('')
      setSuiteInput('')
      setShowAdditionalFields(false)

    } catch (err) {
      const error = err as Error
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Create New AI Tool</h1>
          <p className="text-lg text-gray-400">Add a new tool to your AI suite</p>
        </div>

        {success && (
          <div className="bg-green-900/50 border border-green-800/50 rounded-lg p-4 text-green-200">
            <h3 className="font-semibold mb-2">Tool Successfully Created!</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Name: {success.name}</li>
              <li>Category: {success.category}</li>
              <li>Suite: {success.suite}</li>
              <li>Input Fields: {[
                success.inputField1,
                success.inputField2,
                success.inputField3
              ].filter(Boolean).length}</li>
            </ul>
          </div>
        )}

        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {/* Category Combobox */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-200">Category</label>
                <div ref={categoryDropdownRef} className="relative">
                  <input
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onClick={() => setIsCategoryDropdownOpen(true)}
                    placeholder="Type or select a category..."
                    className={comboboxStyles}
                  />
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                  <ChevronDown 
                    className="absolute right-3 top-3.5 h-5 w-5 text-gray-500 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                    }}
                  />
                  
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700/50 rounded-lg shadow-xl max-h-60 overflow-auto">
                      {isLoadingCategories ? (
                        <div className="px-4 py-2 text-gray-400">Loading categories...</div>
                      ) : filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                          <div
                            key={category.id}
                            className="px-4 py-2 hover:bg-gray-700/50 cursor-pointer text-gray-200"
                            onClick={() => {
                              setCategoryInput(category.name)
                              setIsCategoryDropdownOpen(false)
                            }}
                          >
                            {category.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-400">
                          {categories.length === 0 ? 'No categories found' : 'No matching categories'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Suite Combobox */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-200">Suite</label>
                <div ref={suiteDropdownRef} className="relative">
                  <input
                    type="text"
                    value={suiteInput}
                    onChange={(e) => setSuiteInput(e.target.value)}
                    onClick={() => setIsSuiteDropdownOpen(true)}
                    placeholder="Type or select a suite..."
                    className={comboboxStyles}
                  />
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                  <ChevronDown 
                    className="absolute right-3 top-3.5 h-5 w-5 text-gray-500 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsSuiteDropdownOpen(!isSuiteDropdownOpen)
                    }}
                  />
                  
                  {isSuiteDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700/50 rounded-lg shadow-xl max-h-60 overflow-auto">
                      {isLoadingSuites ? (
                        <div className="px-4 py-2 text-gray-400">Loading suites...</div>
                      ) : filteredSuites.length > 0 ? (
                        filteredSuites.map((suite) => (
                          <div
                            key={suite.id}
                            className="px-4 py-2 hover:bg-gray-700/50 cursor-pointer text-gray-200"
                            onClick={() => {
                              setSuiteInput(suite.name)
                              setIsSuiteDropdownOpen(false)
                            }}
                          >
                            {suite.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-400">
                          {categoryInput ? 'No suites found' : 'Select a category first'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tool Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">
                  Tool Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter a name for your tool..."
                  className={inputStyles}
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
                  placeholder="Describe what your tool does..."
                  className={`${inputStyles} min-h-24 resize-none`}
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
                
                <div className="space-y-4">
                  {/* Required Field */}
                  <div className="relative bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Field 1 Name (Required)
                        </label>
                        <input
                          type="text"
                          value={inputFields[0].name}
                          onChange={(e) => updateInputField('1', 'name', e.target.value)}
                          placeholder="e.g., Content"
                          className={inputStyles}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Field 1 Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={inputFields[0].description}
                          onChange={(e) => updateInputField('1', 'description', e.target.value)}
                          placeholder="Help text for field 1..."
                          className={inputStyles}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Fields */}
                  {showAdditionalFields && (
                    <>
                      {[inputFields[1], inputFields[2]].map((field, index) => (
                        <div key={field.id} className="relative bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Field {index + 2} Name
                              </label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) => updateInputField(field.id, 'name', e.target.value)}
                                placeholder={`e.g., ${index === 0 ? 'Tone' : 'Keywords'}`}
                                className={inputStyles}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Field {index + 2} Description (Optional)
                              </label>
                              <input
                                type="text"
                                value={field.description}
                                onChange={(e) => updateInputField(field.id, 'description', e.target.value)}
                                placeholder={`Help text for field ${index + 2}...`}
                                className={inputStyles}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Prompt Template */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">
                  Prompt Template
                </label>
                <textarea
                  name="promptTemplate"
                  required
                  placeholder="Enter the Claude prompt template..."
                  className={`${inputStyles} min-h-32 resize-none`}
                />
                <p className="text-sm text-gray-400">
                  Use {`{fieldName}`} to reference input fields in your template
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
                  placeholder="Cost per use..."
                  className={inputStyles}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-800/50 rounded-lg p-4 text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9d042b] hover:bg-[#8a0326] disabled:bg-[#6d021f] disabled:cursor-not-allowed text-white rounded-lg py-3 px-4 font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Creating...' : 'Create Tool'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}