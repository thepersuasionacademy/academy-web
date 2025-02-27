import { Clock, ChevronRight, Copy, CheckCircle, FolderTree, Plus, X } from 'lucide-react';
import type { AIItem } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { markdownComponents } from '@/app/ai/components/embed/output/MarkdownStyles';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AddAccessModal } from '../content/AddAccessModal';
import { AccessStructureEditor } from './access-structure/AccessStructureEditor';

interface ContentDetailProps {
  item: AIItem;
  formatTimestamp: (timestamp: string) => { date: string; time: string };
  onCopy: (response: string) => void;
  showCopied: boolean;
  isAdmin?: boolean;
  showAccessModal: boolean;
  setShowAccessModal: (show: boolean) => void;
  selectedAccessType: 'bundle' | 'collection' | 'content' | null;
  setSelectedAccessType: (type: 'bundle' | 'collection' | 'content' | null) => void;
  selectedAccessId: string | null;
  setSelectedAccessId: (id: string | null) => void;
}

interface ContentNode {
  content_id: string;
  title: string;
  content_type: string;
  parent_id: string | null;
  has_access?: boolean;
  children?: ContentNode[];
}

export function ContentDetail({ 
  item, 
  formatTimestamp, 
  onCopy, 
  showCopied, 
  isAdmin = false,
  showAccessModal,
  setShowAccessModal,
  selectedAccessType,
  setSelectedAccessType,
  selectedAccessId,
  setSelectedAccessId
}: ContentDetailProps) {
  const [contentHierarchy, setContentHierarchy] = useState<ContentNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Debug log for isAdmin
  useEffect(() => {
    console.log('ContentDetail isAdmin value:', isAdmin);
  }, [isAdmin]);

  // Debug log for component mount
  useEffect(() => {
    console.log('ContentDetail mounted with props:', {
      isAdmin,
      itemId: item.id,
      contentHierarchy: contentHierarchy
    });
  }, [isAdmin, item.id, contentHierarchy]);

  useEffect(() => {
    async function fetchContentHierarchy() {
      try {
        console.log('Fetching content hierarchy for item:', item.id);
        
        // Get the content tree from the view
        const { data: treeData, error } = await supabase
          .from('access.user_content_tree')
          .select('*')
          .eq('content_id', item.id)
          .single();

        if (error) {
          console.error('Error fetching content hierarchy:', error);
          return;
        }

        console.log('Content hierarchy data:', treeData);
        setContentHierarchy(treeData);
      } catch (error) {
        console.error('Error in fetchContentHierarchy:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContentHierarchy();
  }, [item.id, supabase]);

  const handleRevokeAccess = async () => {
    try {
      console.log('Attempting to revoke access');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.error('No user session found');
        return;
      }

      const { error } = await supabase
        .rpc('access.revoke_access', {
          p_user_id: session.user.id,
          p_content_id: item.id,
          p_revoked_by: session.user.id,
          p_reason: 'Admin revocation'
        });

      if (error) {
        console.error('Error revoking access:', error);
        return;
      }

      console.log('Access successfully revoked');
      // Refresh the content hierarchy
      window.location.reload();
    } catch (error) {
      console.error('Error in handleRevokeAccess:', error);
    }
  };

  // Debug log for admin state
  useEffect(() => {
    console.log('ContentDetail admin state:', { isAdmin });
  }, [isAdmin]);

  const renderHierarchyNode = (node: ContentNode) => {
    const contentTypeIcons: Record<string, string> = {
      collection: '📁',
      content: '📄',
      module: '📦',
      media: '🎬',
      video: '🎥',
      ai_content: '🤖',
      text_content: '📝',
      pdf_content: '📑'
    };

    return (
      <div className="pl-4 border-l border-[var(--border-color)]">
        <div className="flex items-center gap-2 py-1">
          <span>{contentTypeIcons[node.content_type] || '📄'}</span>
          <span className={cn(
            "text-sm",
            node.has_access ? "text-green-500" : "text-[var(--text-secondary)]"
          )}>
            {node.title}
          </span>
        </div>
        {node.children?.map((child) => (
          <div key={child.content_id} className="ml-4">
            {renderHierarchyNode(child)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Debug info - now visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          Debug info: isAdmin={String(isAdmin)}, isLoading={String(isLoading)}
        </div>
      )}
      
      {/* Title and Description */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>{item.collectionName}</span>
          <ChevronRight className="w-3 h-3" />
          <span>{item.suiteName}</span>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium text-[var(--foreground)]">
            {item.toolName}
          </h3>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  console.log('Add Access button clicked');
                  setShowAccessModal(true);
                }}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Access</span>
              </button>
              <button
                onClick={handleRevokeAccess}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Revoke Access</span>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(item.timestamp).date}</span>
          <span>•</span>
          <span>{formatTimestamp(item.timestamp).time}</span>
        </div>
      </div>

      {/* Content Details */}
      <div className="mb-8 p-6 rounded-lg bg-[var(--hover-bg)]">
        <div className="max-w-[600px] mx-auto">
          <div className="space-y-4">
            {/* Content Type */}
            <div className="flex justify-between items-center">
              <span className="text-lg text-[var(--text-secondary)]">Content Type</span>
              <span className="text-lg font-medium text-[var(--foreground)]">
                {item.collectionName}
              </span>
            </div>

            {/* Content Category */}
            <div className="flex justify-between items-center">
              <span className="text-lg text-[var(--text-secondary)]">Category</span>
              <span className="text-lg font-medium text-[var(--foreground)]">
                {item.suiteName}
              </span>
            </div>

            {/* Content Status */}
            <div className="flex justify-between items-center">
              <span className="text-lg text-[var(--text-secondary)]">Status</span>
              <span className="text-lg font-medium text-green-500">
                Active
              </span>
            </div>

            {/* Content Hierarchy */}
            {!isLoading && contentHierarchy && (
              <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-2 mb-4">
                  <FolderTree className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="text-lg text-[var(--text-secondary)]">Content Structure</span>
                </div>
                {renderHierarchyNode(contentHierarchy)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Access Management Modal */}
      {isAdmin && showAccessModal && (
        <AddAccessModal
          onSubmit={(type, id) => {
            console.log('Selected:', { type, id });
            if (type === 'bundle' || type === 'collection' || type === 'content') {
              setSelectedAccessType(type);
              setSelectedAccessId(id);
            }
          }}
          onCancel={() => {
            setShowAccessModal(false);
            setSelectedAccessType(null);
            setSelectedAccessId(null);
          }}
        />
      )}

      {/* Access Structure View */}
      {showAccessModal && selectedAccessType && selectedAccessId && (
        <AccessStructureEditor
          selectedType={selectedAccessType}
          selectedId={selectedAccessId}
          isAdmin={isAdmin}
          isNewAccess={true}
        />
      )}
    </>
  );
} 