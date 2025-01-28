'use client'

import { useState } from 'react'
import { useCategories } from '@/app/ai/hooks/useCategories'
import { useTools } from '@/app/ai/hooks/useTools'
import { useSuites } from '@/app/ai/hooks/useSuites'
import { ToolContainer } from '@/app/ai/components/dashboard/layout/tool/ToolContainer'
import CategorySidebar from '@/app/ai/components/dashboard/layout/category/CategorySidebar'
import SuiteSelector from '@/app/ai/components/dashboard/layout/suite/SuiteSelector'
import { type Tool } from '@/app/ai/components/dashboard/types'
import { AIToolModal } from '@/app/ai/components/AIToolModal'

export default function UserDashboardClient({ hideCreationControls = false }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [categoryInput, setCategoryInput] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { categories, isLoadingCategories } = useCategories()
  const { suites, isLoadingSuites } = useSuites(selectedCategory)
  const { tools, isLoadingTools } = useTools(selectedCategory, selectedSuite)

  const handleToolSelect = (tool: Tool | null) => {
    setSelectedTool(tool)
    setIsModalOpen(!!tool)
  }

  console.log('Current state:', { selectedTool, isModalOpen })

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="relative w-full flex">
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(name: string) => {
            setSelectedCategory(name)
          }}
          isLoadingCategories={isLoadingCategories}
          categoryInput={categoryInput}
          setCategoryInput={setCategoryInput}
          hideCreationControls={hideCreationControls}
        />

        <div className="flex-1 flex flex-col min-h-screen relative border-l border-[var(--border-color)]">
          <SuiteSelector
            suites={suites}
            selectedSuite={selectedSuite}
            onSelectSuite={(name: string) => {
              setSelectedSuite(name)
            }}
            isLoadingSuites={isLoadingSuites}
            selectedCategory={selectedCategory!}
            hideCreationControls={hideCreationControls}
          />

          <ToolContainer
            selectedTool={selectedTool}
            setSelectedTool={handleToolSelect}
            selectedCategory={selectedCategory!}
            selectedSuite={selectedSuite!}
            tools={tools}
            isLoadingTools={isLoadingTools}
            onToolUpdate={async () => {}}
            onSubmit={async () => {}}
            error=""
            loading={false}
            success={null}
            hideCreationControls={hideCreationControls}
          />

          {isModalOpen && selectedTool && (
            <AIToolModal
              tool={selectedTool}
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false)
                setSelectedTool(null)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}