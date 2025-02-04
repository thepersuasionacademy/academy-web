'use client';

import { useState, useEffect } from 'react';
import type { AITool, AIInput, AIPrompt } from '@/lib/supabase/ai';
import GenerateSection from './GenerateSection';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CreditBalance {
  total: number;
  subscription_credits: number;
  additional_credits: number;
}

interface ToolInterfaceProps {
  tool: AITool | null;
  inputs: AIInput[];
  prompts: AIPrompt[];
  isLoading: boolean;
}

export default function ToolInterface({ tool, inputs, prompts, isLoading }: ToolInterfaceProps) {
  const [credits, setCredits] = useState<CreditBalance>({ total: 0, subscription_credits: 0, additional_credits: 0 });
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);

  const fetchCredits = async () => {
    try {
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data, error } = await supabase
          .rpc('get_total_credits', {
            user_id: session.user.id
          });
        
        if (!error && data) {
          setCredits(data);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  return (
    <GenerateSection 
      tool={tool} 
      inputs={inputs} 
      prompts={prompts} 
      isLoading={isLoading} 
      credits={credits}
      isLoadingCredits={isLoadingCredits}
      onCreditsUpdated={fetchCredits}
    />
  );
}