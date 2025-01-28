import { AIToolModal } from "../../components/AIToolModal";

interface AIToolPageProps {
  params: {
    id: string;
  };
}

export default function AIToolPage({ params }: AIToolPageProps) {
  return (
    <div className="min-h-screen">
      <AIToolModal toolId={params.id} isPageView={true} />
    </div>
  );
} 