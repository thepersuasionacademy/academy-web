'use client'

import { useState } from 'react'
import { useCategories } from '@/app/ai/hooks/useCategories'
import { useTools } from '@/app/ai/hooks/useTools'
import { useSuites } from '@/app/ai/hooks/useSuites'
import { ToolContainer } from '@/app/ai/components/dashboard/layout/tool/ToolContainer'
import CategorySidebar from '@/app/ai/components/dashboard/layout/category/CategorySidebar'
import SuiteSelector from '@/app/ai/components/dashboard/layout/suite/SuiteSelector'
import { type Tool } from '@/app/ai/components/dashboard/types'

type PageParams = {
  id: string;
}

interface UserDashboardClientProps {
  params: PageParams;
  searchParams: { [key: string]: string | string[] | undefined };
  hideCreationControls?: boolean;
}

export default function UserDashboardClient({ 
  params, 
  searchParams,
  hideCreationControls = false 
}: UserDashboardClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [categoryInput, setCategoryInput] = useState('')

  const { categories, isLoadingCategories } = useCategories()
  const { suites, isLoadingSuites } = useSuites(selectedCategory)
  const { tools, isLoadingTools } = useTools(selectedCategory, selectedSuite)

  return (
    <div className="flex min-h-screen">
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

        <div className="flex-1 flex flex-col min-h-screen relative">
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
            setSelectedTool={setSelectedTool}
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
        </div>
      </div>
    </div>
  )
}