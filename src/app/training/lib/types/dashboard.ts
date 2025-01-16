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
      name: "Recently Accessed",
      items: [
        {
          id: "1",
          title: "Cold Calling Mastery",
          description: "Essential techniques for successful cold calls",
          tracks: 12,
          image: "/api/placeholder/400/300",
        },
        {
          id: "2",
          title: "Objection Handling",
          description: "Turn objections into opportunities",
          tracks: 15,
          image: "/api/placeholder/400/300",
        },
        {
          id: "3",
          title: "Sales Psychology",
          description: "Understanding buyer psychology",
          tracks: 10,
          image: "/api/placeholder/400/300",
        },
        {
          id: "4",
          title: "Closing Techniques",
          description: "Master the art of closing deals",
          tracks: 8,
          image: "/api/placeholder/400/300",
        },
        {
          id: "5",
          title: "Building Rapport",
          description: "Create lasting customer relationships",
          tracks: 14,
          image: "/api/placeholder/400/300",
        },
        {
          id: "6",
          title: "Sales Leadership",
          description: "Lead and motivate sales teams",
          tracks: 9,
          image: "/api/placeholder/400/300",
        }
      ]
    },
    {
      name: "Fundamental Skills",
      items: [
        {
          id: "7",
          title: "Prospecting Skills",
          description: "Find and qualify potential customers",
          tracks: 15,
          image: "/api/placeholder/400/300",
        },
        {
          id: "8",
          title: "Active Listening",
          description: "Enhance your listening abilities",
          tracks: 12,
          image: "/api/placeholder/400/300",
        },
        {
          id: "9",
          title: "Sales Storytelling",
          description: "Craft compelling sales narratives",
          tracks: 10,
          image: "/api/placeholder/400/300",
        },
        {
          id: "10",
          title: "Discovery Questions",
          description: "Master needs analysis",
          tracks: 8,
          image: "/api/placeholder/400/300",
        },
        {
          id: "11",
          title: "Value Proposition",
          description: "Communicate your unique value",
          tracks: 6,
          image: "/api/placeholder/400/300",
        },
        {
          id: "12",
          title: "Pipeline Management",
          description: "Optimize your sales pipeline",
          tracks: 9,
          image: "/api/placeholder/400/300",
        }
      ]
    },
    {
      name: "Advanced Techniques",
      items: [
        {
          id: "13",
          title: "Enterprise Sales",
          description: "Navigate complex B2B sales",
          tracks: 10,
          image: "/api/placeholder/400/300",
        },
        {
          id: "14",
          title: "Social Selling",
          description: "Leverage social media for sales",
          tracks: 12,
          image: "/api/placeholder/400/300",
        },
        {
          id: "15",
          title: "Sales Automation",
          description: "Scale your sales process",
          tracks: 8,
          image: "/api/placeholder/400/300",
        },
        {
          id: "16",
          title: "Negotiation Skills",
          description: "Win-win deal strategies",
          tracks: 15,
          image: "/api/placeholder/400/300",
        },
        {
          id: "17",
          title: "Account Planning",
          description: "Strategic account management",
          tracks: 6,
          image: "/api/placeholder/400/300",
        },
        {
          id: "18",
          title: "Sales Analytics",
          description: "Data-driven sales decisions",
          tracks: 9,
          image: "/api/placeholder/400/300",
        }
      ]
    }
  ];