'use client'

import { Loader2 } from 'lucide-react'
import { BundleAccessSelector } from '../bundle-selector'
import { TemplateMixedAccessView } from '@/app/admin/offers/components/TemplateMixedAccessView'
import { TemplateContentProps } from './types'

export function TemplateContent({
  template,
  bundleId,
  editingTemplateId,
  handleAITemplateUpdate,
  setEditingTemplateId,
  setExpandedTemplateId
}: TemplateContentProps) {
  if (template.isLoadingTemplateData) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading template structure...</span>
        </div>
      </div>
    );
  }

  // For AI templates, always show the BundleAccessSelector
  if (template.type === 'ai') {
    return (
      <BundleAccessSelector
        bundleId={bundleId}
        onSave={handleAITemplateUpdate}
        onCancel={() => {
          setEditingTemplateId(null);
          setExpandedTemplateId(null);
        }}
        initialData={{
          type: 'ai',
          categoryId: template.categoryId,
          categoryName: template.categoryName,
          suiteId: template.suiteId,
          suiteName: template.suiteName,
          toolIds: template.toolIds,
          collectionDripSettings: template.collectionDripSettings,
          suiteDripSettings: template.suiteDripSettings,
          toolDripSettings: template.dripSettings
        }}
      />
    );
  }

  if (template.type === 'content') {
    return (
      <TemplateMixedAccessView
        templateId={template.id}
        contentId={template.contentId || ''}
        templateData={template.templateData}
      />
    );
  }

  return (
    <div className="text-center text-[var(--text-secondary)]">
      No preview available for this template type.
    </div>
  );
} 