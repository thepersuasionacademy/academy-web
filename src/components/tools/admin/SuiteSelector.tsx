'use client'

import { Plus } from 'lucide-react'

type Suite = {
  id: string
  name: string
}

interface SuiteSelectorProps {
  suites: Suite[]
  selectedSuite: string | null
  onSelectSuite: (suite: string) => void
  onCreateNew: () => void
  isLoadingSuites: boolean
}

export default function SuiteSelector({
  suites,
  selectedSuite,
  onSelectSuite,
  onCreateNew,
  isLoadingSuites
}: SuiteSelectorProps) {
  if (isLoadingSuites) {
    return (
      <div className="p-4 border-b border-gray-700">
        <div className="text-gray-400">Loading suites...</div>
      </div>
    )
  }

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex gap-2 flex-wrap">
        {suites.map((suite) => (
          <button
            key={suite.id}
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              selectedSuite === suite.name
                ? 'bg-[#9d042b] text-white'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
            onClick={() => onSelectSuite(suite.name)}
          >
            {suite.name}
          </button>
        ))}
        <button
          onClick={onCreateNew}
          className="flex items-center px-4 py-2 bg-[#9d042b] hover:bg-[#8a0326] rounded-full text-white transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Tool
        </button>
      </div>
    </div>
  )
}