export interface MediaItem {
    id: string;
    title: string;
    description: string;
    tracks: number;
    image: string;
    artist?: string;
    duration?: number;
  }
  
  export interface Category {
    name: string;
    items: MediaItem[];
  }
  
  export const categories: Category[] = [
    {
      name: "Recently Played",
      items: [
        {
          id: "1",
          title: "Focus Flow",
          description: "Deep concentration tracks",
          tracks: 12,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/67412e837776d52a568ffa61.jpeg",
        },
        {
          id: "2",
          title: "Morning Mix",
          description: "Start your day energized",
          tracks: 15,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/674f368ed31f23aa10ecb1fb.jpeg",
        },
        {
          id: "3",
          title: "Deep Work",
          description: "Enhance productivity",
          tracks: 10,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/674f37ad63f24e1efbf835b9.jpeg",
        },
        {
          id: "4",
          title: "Evening Calm",
          description: "Unwind and relax",
          tracks: 8,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/66d75e85af330e19e06cd1fd.jpeg",
        },
        {
          id: "5",
          title: "Zen Garden",
          description: "Find your inner peace",
          tracks: 14,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/66db14af84ef291ac2e8a5c1.jpeg",
        },
        {
          id: "6",
          title: "Energy Boost",
          description: "Revitalize your mind",
          tracks: 9,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/66d75e0b7347623efd4a5a49.jpeg",
        }
      ]
    },
    {
      name: "Featured Collections",
      items: [
        {
          id: "7",
          title: "Nature Sounds",
          description: "Immersive natural ambiance",
          tracks: 15,
          image: "/api/placeholder/400/250",
        },
        {
          id: "8",
          title: "Ocean Waves",
          description: "Calming sea sounds",
          tracks: 12,
          image: "/api/placeholder/400/250",
        },
        {
          id: "9",
          title: "Rain Sounds",
          description: "Gentle rainfall ambiance",
          tracks: 10,
          image: "/api/placeholder/400/250",
        },
        {
          id: "10",
          title: "Forest Walk",
          description: "Woodland atmosphere",
          tracks: 8,
          image: "/api/placeholder/400/250",
        },
        {
          id: "11",
          title: "Night Crickets",
          description: "Evening nature sounds",
          tracks: 6,
          image: "/api/placeholder/400/250",
        },
        {
          id: "12",
          title: "Mountain Air",
          description: "High altitude ambiance",
          tracks: 9,
          image: "/api/placeholder/400/250",
        }
      ]
    },
    {
      name: "Sleep & Relaxation",
      items: [
        {
          id: "13",
          title: "Dream Well",
          description: "Guide to peaceful dreams",
          tracks: 10,
          image: "/api/placeholder/400/250",
        },
        {
          id: "14",
          title: "Night Wind Down",
          description: "Evening relaxation",
          tracks: 12,
          image: "/api/placeholder/400/250",
        },
        {
          id: "15",
          title: "Deep Sleep",
          description: "Peaceful rest sounds",
          tracks: 8,
          image: "/api/placeholder/400/250",
        },
        {
          id: "16",
          title: "Calm Night",
          description: "Soothing bedtime sounds",
          tracks: 15,
          image: "/api/placeholder/400/250",
        },
        {
          id: "17",
          title: "Sleep Stories",
          description: "Peaceful narratives",
          tracks: 6,
          image: "/api/placeholder/400/250",
        },
        {
          id: "18",
          title: "Lucid Dreams",
          description: "Dream exploration",
          tracks: 9,
          image: "/api/placeholder/400/250",
        }
      ]
    }
  ];