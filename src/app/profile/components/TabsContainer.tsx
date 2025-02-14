import { Tab } from '@headlessui/react';
import type { AIItem } from './types';
import ContentTab from './ContentTab';
import AITab from './AITab';

interface TabsContainerProps {
  isAdmin: boolean;
  userId?: string;
  aiItems: AIItem[];
  contentItems: any[]; // Add contentItems prop
}

export default function TabsContainer({ isAdmin, userId, aiItems, contentItems }: TabsContainerProps) {
  // ... existing code ...

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {Object.keys(tabs).map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel>
            <ContentTab isAdmin={isAdmin} userId={userId} contentItems={contentItems} />
          </Tab.Panel>
          <Tab.Panel>
            <AITab aiItems={aiItems} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
} 