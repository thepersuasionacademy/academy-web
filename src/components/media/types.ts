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
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/67565f96988a5f28a6a0ea75.jpeg",
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
      name: "Ambient Soundscapes",
      items: [
        {
          id: "7",
          title: "Nature Sounds",
          description: "Immersive natural ambiance",
          tracks: 15,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/675660468e049a8312d8ec67.jpeg",
        },
        {
          id: "8",
          title: "Ocean Waves",
          description: "Calming sea sounds",
          tracks: 12,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/6756604653bb952daaa8b7f0.jpeg",
        },
        {
          id: "9",
          title: "Rain Sounds",
          description: "Gentle rainfall ambiance",
          tracks: 10,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/6756612c988a5f1556a0ebab.jpeg",
        },
        {
          id: "10",
          title: "Forest Walk",
          description: "Woodland atmosphere",
          tracks: 8,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/6756612c29695a68d0719fc0.jpeg",
        },
        {
          id: "11",
          title: "Night Crickets",
          description: "Evening nature sounds",
          tracks: 6,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/675661a5988a5f3970a0ebcb.jpeg",
        },
        {
          id: "12",
          title: "Mountain Air",
          description: "High altitude ambiance",
          tracks: 9,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/67565f9629695a0e75719f04.jpeg",
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
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/675660468e049a4ed9d8ec68.jpeg",
        },
        {
          id: "14",
          title: "Night Wind Down",
          description: "Evening relaxation",
          tracks: 12,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/67565f9629695ac1e7719f05.jpeg",
        },
        {
          id: "15",
          title: "Deep Sleep",
          description: "Peaceful rest sounds",
          tracks: 8,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/67565f9653bb952d26a8b78e.jpeg",
        },
        {
          id: "16",
          title: "Calm Night",
          description: "Soothing bedtime sounds",
          tracks: 15,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/6756604653bb95e47da8b7f1.jpeg",
        },
        {
          id: "17",
          title: "Sleep Stories",
          description: "Peaceful narratives",
          tracks: 6,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/67566046b779b257b388faa6.jpeg",
        },
        {
          id: "18",
          title: "Lucid Dreams",
          description: "Dream exploration",
          tracks: 9,
          image: "https://storage.googleapis.com/msgsndr/0WQ7GPZN4PMMOAZunq8O/media/6756604653bb95593aa8b7f2.jpeg",
        }
      ]
    }
  ];