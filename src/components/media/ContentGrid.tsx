import { BentoCard } from '@/components/BentoCard';
import { Category } from './types';

interface ContentGridProps {
 categories: Category[];
 onItemClick: (itemId: string) => void;
}

export const ContentGrid = ({ categories, onItemClick }: ContentGridProps) => {
    return (
      <div className="relative py-8 space-y-12">
        {categories.map((category) => (
          <div key={category.name} className="relative px-10">
            <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
            <div className="relative overflow-visible">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {category.items.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => onItemClick(item.id)}
                    style={{ width: '23%', minWidth: '400px', height: '250px', flexShrink: 0 }}
                  >
                    <BentoCard
                      title={item.title}
                      description={item.description}
                      image={item.image}
                      tracks={item.tracks}
                      href="#"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
   };