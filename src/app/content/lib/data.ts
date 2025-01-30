import type { Category } from './types';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

export const categories: Category[] = [
  {
    name: 'Encoded Audio',
    categoryType: 'imprinting',
    items: [
      {
        id: 'encoded-focus',
        title: 'Focus Enhancement',
        description: 'Neural encoding for deep focus and concentration',
        image: '/images/focus-flow.jpg',
        tracks: 3
      },
      {
        id: 'encoded-creativity',
        title: 'Creative Flow',
        description: 'Unlock your creative potential with encoded frequencies',
        image: '/images/creativity.jpg',
        tracks: 4
      },
      {
        id: 'encoded-memory',
        title: 'Memory Boost',
        description: 'Enhance memory retention and recall',
        image: '/images/memory.jpg',
        tracks: 3
      },
      {
        id: 'encoded-learning',
        title: 'Accelerated Learning',
        description: 'Speed up learning with neural enhancement',
        image: '/images/learning.jpg',
        tracks: 5
      },
      {
        id: 'encoded-intuition',
        title: 'Intuition Amplifier',
        description: 'Strengthen your intuitive abilities',
        image: '/images/intuition.jpg',
        tracks: 4
      },
      {
        id: 'encoded-flow',
        title: 'Flow State',
        description: 'Enter peak performance states on demand',
        image: '/images/flow.jpg',
        tracks: 6
      }
    ]
  },
  {
    name: 'Guided Meditation',
    categoryType: 'imprinting',
    items: [
      {
        id: 'guided-confidence',
        title: 'Confidence Builder',
        description: 'Build unshakeable confidence through guided meditation',
        image: '/images/confidence.jpg',
        tracks: 5
      },
      {
        id: 'guided-wealth',
        title: 'Wealth Mindset',
        description: 'Program your mind for abundance and success',
        image: '/images/wealth.jpg',
        tracks: 4
      },
      {
        id: 'guided-sleep',
        title: 'Deep Sleep',
        description: 'Fall into restorative sleep with guided relaxation',
        image: '/images/sleep.jpg',
        tracks: 3
      },
      {
        id: 'guided-leadership',
        title: 'Leadership Mastery',
        description: 'Develop powerful leadership presence',
        image: '/images/leadership.jpg',
        tracks: 5
      },
      {
        id: 'guided-charisma',
        title: 'Charisma Boost',
        description: 'Enhance your natural charisma and presence',
        image: '/images/charisma.jpg',
        tracks: 4
      },
      {
        id: 'guided-vision',
        title: 'Vision Quest',
        description: 'Clarify your life vision and purpose',
        image: '/images/vision.jpg',
        tracks: 6
      }
    ]
  },
  {
    name: 'Ambient Soundscapes',
    categoryType: 'imprinting',
    items: [
      {
        id: 'ambient-focus',
        title: 'Deep Work Zone',
        description: 'Ambient sounds for maximum productivity',
        image: '/images/deep-work.jpg',
        tracks: 4
      },
      {
        id: 'ambient-relax',
        title: 'Stress Relief',
        description: 'Calming soundscapes for relaxation',
        image: '/images/relax.jpg',
        tracks: 5
      },
      {
        id: 'ambient-create',
        title: 'Creative Space',
        description: 'Ambient audio for creative sessions',
        image: '/images/create.jpg',
        tracks: 3
      },
      {
        id: 'ambient-energy',
        title: 'Energy Flow',
        description: 'Energizing ambient soundscapes',
        image: '/images/energy.jpg',
        tracks: 4
      },
      {
        id: 'ambient-nature',
        title: 'Nature Immersion',
        description: 'Deep nature soundscapes for restoration',
        image: '/images/nature.jpg',
        tracks: 5
      },
      {
        id: 'ambient-zen',
        title: 'Zen Garden',
        description: 'Peaceful ambient sounds for meditation',
        image: '/images/zen.jpg',
        tracks: 4
      }
    ]
  },
  {
    name: 'DreamState Selling',
    categoryType: 'learning',
    items: [
      {
        id: 'dream-basics',
        title: 'Foundations',
        description: 'Master the basics of DreamState Selling',
        image: '/images/dream-basics.jpg',
        tracks: 5
      },
      {
        id: 'dream-advanced',
        title: 'Advanced Techniques',
        description: 'Advanced DreamState selling strategies',
        image: '/images/dream-advanced.jpg',
        tracks: 4
      },
      {
        id: 'dream-mastery',
        title: 'Elite Performance',
        description: 'Become an elite DreamState seller',
        image: '/images/dream-mastery.jpg',
        tracks: 6
      },
      {
        id: 'dream-psychology',
        title: 'Buyer Psychology',
        description: 'Understanding the psychology of buyers',
        image: '/images/buyer-psych.jpg',
        tracks: 5
      },
      {
        id: 'dream-objections',
        title: 'Objection Mastery',
        description: 'Advanced objection handling techniques',
        image: '/images/objections.jpg',
        tracks: 4
      },
      {
        id: 'dream-closing',
        title: 'Closing Mastery',
        description: 'Master the art of closing sales',
        image: '/images/closing.jpg',
        tracks: 5
      }
    ]
  },
  {
    name: 'Framing',
    categoryType: 'learning',
    items: [
      {
        id: 'framing-101',
        title: 'Framing Fundamentals',
        description: 'Learn the art of psychological framing',
        image: '/images/framing-101.jpg',
        tracks: 4
      },
      {
        id: 'framing-language',
        title: 'Language Patterns',
        description: 'Master persuasive language patterns',
        image: '/images/language.jpg',
        tracks: 5
      },
      {
        id: 'framing-mastery',
        title: 'Frame Control',
        description: 'Advanced frame control techniques',
        image: '/images/frame-control.jpg',
        tracks: 4
      },
      {
        id: 'framing-power',
        title: 'Power Dynamics',
        description: 'Master social power dynamics',
        image: '/images/power.jpg',
        tracks: 6
      },
      {
        id: 'framing-influence',
        title: 'Social Influence',
        description: 'Advanced social influence techniques',
        image: '/images/social.jpg',
        tracks: 5
      },
      {
        id: 'framing-negotiation',
        title: 'Negotiation Frames',
        description: 'Master negotiation framing',
        image: '/images/negotiation.jpg',
        tracks: 4
      }
    ]
  },
  {
    name: 'MaxPersuasion',
    categoryType: 'learning',
    items: [
      {
        id: 'max-influence',
        title: 'Core Influence',
        description: 'Core principles of maximum influence',
        image: '/images/influence.jpg',
        tracks: 5
      },
      {
        id: 'max-psychology',
        title: 'Persuasion Psychology',
        description: 'Understanding the psychology of persuasion',
        image: '/images/psychology.jpg',
        tracks: 6
      },
      {
        id: 'max-mastery',
        title: 'Elite Persuader',
        description: 'Become an elite level persuader',
        image: '/images/persuader.jpg',
        tracks: 4
      },
      {
        id: 'max-rapport',
        title: 'Instant Rapport',
        description: 'Build instant connections with anyone',
        image: '/images/rapport.jpg',
        tracks: 5
      },
      {
        id: 'max-authority',
        title: 'Authority Building',
        description: 'Establish unshakeable authority',
        image: '/images/authority.jpg',
        tracks: 4
      },
      {
        id: 'max-conversion',
        title: 'Conversion Mastery',
        description: 'Master high-ticket conversions',
        image: '/images/conversion.jpg',
        tracks: 6
      }
    ]
  }
]; 