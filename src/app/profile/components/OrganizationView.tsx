import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FolderTree, ChevronRight, Plus, ChevronDown, AlertCircle, Package, Layers, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";

interface OrganizationNode {
  id: string;
  name: string;
  type: 'organization' | 'collection' | 'module' | 'content';
  children?: OrganizationNode[];
  expanded?: boolean;
}

type AccessType = 'bundle' | 'collection' | 'content' | null;

interface OrganizationViewProps {
  onSelect: (nodeId: string) => void;
}

export function OrganizationView({ onSelect }: OrganizationViewProps) {
  const [organizationTree, setOrganizationTree] = useState<OrganizationNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AccessType>(null);
  const supabase = createClientComponentClient();

  const accessTypes = [
    { id: 'bundle', label: 'Bundle', icon: Package },
    { id: 'collection', label: 'Collection', icon: Layers },
    { id: 'content', label: 'Content', icon: FileText },
  ];

  useEffect(() => {
    async function fetchOrganizationTree() {
      try {
        console.log('Fetching organization tree...');
        const { data, error } = await supabase
          .from('access.organization_tree')
          .select('*');

        if (error) {
          console.error('Error fetching organization tree:', error);
          setError(error.message);
          return;
        }

        console.log('Raw organization data:', data);

        if (!data || data.length === 0) {
          console.log('No organization data found');
          setError('No organization structure available');
          return;
        }

        // Transform the flat data into a tree structure
        const transformedData = transformToTree(data);
        console.log('Transformed tree data:', transformedData);
        setOrganizationTree(transformedData);
      } catch (error) {
        console.error('Error in fetchOrganizationTree:', error);
        setError('Failed to load organization structure');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganizationTree();
  }, [supabase]);

  // Helper function to transform flat data into tree structure
  const transformToTree = (flatData: any[]): OrganizationNode[] => {
    const tree: OrganizationNode[] = [];
    const map = new Map();

    // First pass: create nodes and map
    flatData.forEach(item => {
      map.set(item.id, {
        id: item.id,
        name: item.name || 'Unnamed',
        type: item.type || 'content',
        children: [],
        expanded: false
      });
    });

    // Second pass: create relationships
    flatData.forEach(item => {
      const node = map.get(item.id);
      if (item.parent_id && map.has(item.parent_id)) {
        const parent = map.get(item.parent_id);
        parent.children.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  };

  const toggleNode = (nodeId: string) => {
    setOrganizationTree(prevTree => {
      const updateNode = (nodes: OrganizationNode[]): OrganizationNode[] => {
        return nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, expanded: !node.expanded };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };
      return updateNode(prevTree);
    });
  };

  const renderNode = (node: OrganizationNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const typeIcons: Record<string, string> = {
      organization: '🏢',
      collection: '📁',
      module: '📦',
      content: '📄'
    };

    return (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer",
            "hover:bg-[var(--hover-bg)] transition-colors"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            onSelect(node.id);
          }}
        >
          {hasChildren && (
            <button className="p-1 hover:bg-[var(--hover-bg)] rounded">
              {node.expanded ? (
                <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
              )}
            </button>
          )}
          <span>{typeIcons[node.type] || '📄'}</span>
          <span className="text-sm">{node.name}</span>
        </div>
        {node.expanded && node.children && (
          <div className="ml-4 border-l border-[var(--border-color)]">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-pulse text-[var(--text-secondary)]">Loading organization structure...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <AlertCircle className="w-8 h-8 text-[var(--text-secondary)]" />
        <div className="text-center text-[var(--text-secondary)]">
          <p className="font-medium mb-2">{error}</p>
          <p className="text-sm">Please make sure you have the correct database structure and permissions.</p>
        </div>
      </div>
    );
  }

  if (organizationTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <FolderTree className="w-8 h-8 text-[var(--text-secondary)]" />
        <div className="text-center text-[var(--text-secondary)]">
          <p className="font-medium mb-2">No Content Structure Available</p>
          <p className="text-sm">The organization structure appears to be empty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="space-y-6">
        {/* Access Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">What type of access do you want to grant?</h3>
          <div className="flex flex-wrap gap-3">
            {accessTypes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedType(id as AccessType)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full",
                  "border transition-all",
                  selectedType === id
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)]"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Selection Area */}
        {selectedType && (
          <div className="pt-6 border-t border-[var(--border-color)]">
            <h3 className="text-lg font-medium mb-4">
              Select {selectedType === 'bundle' ? 'a' : 'the'} {selectedType} to grant access to
            </h3>
            {/* We'll implement the specific selection UI based on the type */}
            <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--hover-bg)]">
              <p className="text-[var(--text-secondary)]">Selection UI for {selectedType} will be shown here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 