'use client';

import React, { useState, useEffect } from 'react';
import { ContentGrid } from '@/app/content/components/dashboard/ContentGrid';
import { SuiteView } from '@/streaming/components/dashboard/SuiteView';
import { MediaPlayer } from '@/app/content/components/dashboard/MediaPlayer';
import ScrollProgress from '@/app/content/components/ScrollProgress';
import { CategoryPills } from '@/app/content/components/CategoryPills';
import type { MediaItem } from '@/app/content/lib/types';
import { FeaturedContent } from '@/app/content/components/dashboard/FeaturedContent';
import { cn } from '@/lib/utils';
import { getCollections, getCourses, getLessons, type Collection, type Course, type Lesson } from '@/lib/supabase/learning';

// Featured content that matches the design
const featuredItem = {
  id: 'focus-flow',
  title: 'Focus Flow',
  description: 'Deep concentration tracks',
  image: '/images/focus-flow.jpg',
  tracks: 12
};

// Mock description for all media items
const MOCK_DESCRIPTION = "Experience transformative content designed to enhance your mental capabilities and unlock your full potential. This carefully crafted series combines cutting-edge techniques with proven methodologies to deliver exceptional results.";

// Convert Supabase Course to MediaItem format for ContentGrid
function convertCourseToMediaItem(course: Course): MediaItem {
  return {
    id: course.id,
    title: course.title,
    description: course.description || MOCK_DESCRIPTION,
    image: course.thumbnail || '/images/default-course.jpg',
    tracks: 1, // Each course will show as one track for now
  };
}

// Convert Collection and its Courses to Category format for ContentGrid
function convertToCategory(collection: Collection, courses: Course[]) {
  return {
    name: collection.name,
    items: courses.map(convertCourseToMediaItem),
    categoryType: 'learning' as const,
  };
}

export default function Page(): React.JSX.Element {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<'learning' | 'imprinting'>('learning');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [coursesByCollection, setCoursesByCollection] = useState<Record<string, Course[]>>({});
  const [lessonsByCourse, setLessonsByCourse] = useState<Record<string, Lesson[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('Fetching collections...');
        const collectionsData = await getCollections();
        console.log('Collections fetched:', collectionsData);
        setCollections(collectionsData);

        const coursesData: Record<string, Course[]> = {};
        const lessonsData: Record<string, Lesson[]> = {};
        
        for (const collection of collectionsData) {
          try {
            console.log(`Fetching courses for collection ${collection.id}...`);
            const collectionCourses = await getCourses(collection.id);
            console.log(`Courses fetched for collection ${collection.id}:`, collectionCourses);
            if (Array.isArray(collectionCourses)) {
              coursesData[collection.id] = collectionCourses;
              
              // Fetch lessons for each course
              for (const course of collectionCourses) {
                try {
                  console.log(`Fetching lessons for course ${course.id}...`);
                  const courseLessons = await getLessons(course.id);
                  console.log(`Lessons fetched for course ${course.id}:`, courseLessons);
                  if (Array.isArray(courseLessons)) {
                    lessonsData[course.id] = courseLessons;
                  }
                } catch (error) {
                  console.error(`Error fetching lessons for course ${course.id}:`, error);
                  lessonsData[course.id] = [];
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching courses for collection ${collection.id}:`, error);
            coursesData[collection.id] = [];
          }
        }
        
        console.log('All courses data:', coursesData);
        console.log('All lessons data:', lessonsData);
        setCoursesByCollection(coursesData);
        setLessonsByCourse(lessonsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Convert Supabase data to the format expected by ContentGrid
  const categories = collections
    .map(collection => convertToCategory(collection, coursesByCollection[collection.id] || []));

  const handleItemClick = (itemId: string) => {
    const item = categories
      .flatMap(cat => cat.items)
      .find(item => item.id === itemId);
    if (item) {
      setSelectedItem(item);
      setSelectedLesson(null);
    }
  };

  const handleLessonSelect = (lessonId: string) => {
    if (selectedItem) {
      const lessons = lessonsByCourse[selectedItem.id] || [];
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        setSelectedLesson(lesson);
      }
    }
  };

  return (
    <div className="min-h-screen text-[color:var(--foreground)]" style={{ background: 'var(--background)' }}>
      <ScrollProgress />
      
      <main className="relative">
        <div className="sticky top-0 z-10 backdrop-blur-md bg-[var(--background)]/80 border-b border-[var(--border-color)]">
          <div className="px-[10px]">
            <CategoryPills onCategoryChange={setActiveCategory} />
          </div>
        </div>

        <div className="px-[5px]">
          <FeaturedContent 
            content={featuredItem}
            onPlay={() => console.log('Play featured')}
            onLike={() => console.log('Like featured')}
            onShare={() => console.log('Share featured')}
          />
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-[var(--text-secondary)]">Loading content...</div>
            </div>
          ) : (
            <div className="mt-8">
              <ContentGrid
                categories={categories}
                onItemClick={handleItemClick}
              />
            </div>
          )}
        </div>

        {/* Overlay layer for MediaPlayer and SuiteView */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex overflow-hidden">
            {/* Main Content Area - MediaPlayer Container */}
            {selectedLesson?.lesson_type === 'video' && (
              <div className="flex-1 flex bg-[var(--card-bg)] relative">
                <div className="absolute inset-0 pr-[400px]">
                  <div className="w-full h-full">
                    <MediaPlayer
                      title={selectedLesson.title || selectedItem.title}
                      description={selectedLesson.description || selectedItem.description}
                      isOpen={true}
                      category={categories.find(cat => 
                        cat.items.some(item => item.id === selectedItem?.id)
                      )?.name}
                      courseName={selectedItem.title}
                      videoId={selectedLesson.video_id}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Suite View - Absolute positioned */}
            <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-[var(--card-bg)]">
              <SuiteView
                isOpen={true}
                onClose={() => {
                  setSelectedItem(null);
                  setSelectedLesson(null);
                }}
                title={selectedItem.title}
                description={selectedItem.description}
                lessons={lessonsByCourse[selectedItem.id] || []}
                onPlay={handleLessonSelect}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

<style jsx global>{`
  :root {
    /* Existing variables */
    --background: #ffffff !important; /* Set to desired color with higher specificity */
    --card-bg: transparent !important; /* Override card background to transparent */
    --accent: #ff0000 !important; /* Example: Set to desired accent color */
    --hover-bg: #f0f0f0 !important; /* Example: Set to desired hover background */
    --border-color: #dddddd !important; /* Example: Set to desired border color */
    /* ...other variables */
  }
`}</style>