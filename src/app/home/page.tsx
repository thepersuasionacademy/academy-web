'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './styles.css'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function HomePage() {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  
  // Check authentication but don't redirect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // We still check auth, but we don't redirect if not authenticated
        await supabase.auth.getSession()
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [supabase])
  
  // If still loading, show a simple loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }
  
  const paths = [
    {
      id: 'personal-mastery',
      title: 'Personal Mastery',
      description: 'Develop the mindset and skills to achieve your highest potential',
      href: '#personal-mastery',
    },
    {
      id: 'strategic-persuasion',
      title: 'Strategic Persuasion',
      description: 'Master the art of influence and persuasion in any context',
      href: '#strategic-persuasion',
    },
    {
      id: 'high-ticket-sales',
      title: 'High Ticket Sales',
      description: 'Learn proven techniques to close high-value deals with confidence',
      href: '#high-ticket-sales',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://thepersuasionacademycdn.b-cdn.net/Images/luxury-background.jpg"
          alt="Luxury Background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 hero-gradient"></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-24 pb-16 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <Image
            src="https://thepersuasionacademycdn.b-cdn.net/Images/TPA%20The%20Power%20Ark%20Logo%20New.png"
            alt="The Power Ark Logo"
            width={160}
            height={160}
            className="drop-shadow-2xl filter brightness-0 invert"
          />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-light tracking-wide text-white drop-shadow-lg mb-6 luxury-text-shadow hero-title"
        >
          The Persuasion Academy
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-white/80 max-w-3xl mb-12 luxury-text-shadow hero-subtitle"
        >
          Unlock the secrets of influence and transform your ability to persuade with purpose
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link href="/auth/login" className="px-8 py-4 text-xl font-medium bg-white/10 text-white rounded-lg 
            border border-white/20 hover:bg-white/20 
            focus:outline-none focus:ring-2 focus:ring-white/20
            transition-all duration-300 backdrop-blur-sm">
            Begin Your Journey
          </Link>
        </motion.div>
      </div>

      {/* Path to Mastery Section */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-16 bg-black/30 backdrop-blur-sm">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-light text-white mb-16 tracking-wide luxury-text-shadow"
        >
          Your Path to Mastery
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
          {paths.map((path, index) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
              className="flex flex-col"
            >
              <a 
                href={path.href}
                className={`
                  path-card
                  relative overflow-hidden rounded-2xl p-8 h-full
                  flex flex-col items-center text-center
                  border border-white/20 backdrop-blur-sm
                  transition-all duration-300
                  ${hoveredPath === path.id ? 'bg-white/15' : 'bg-white/5'}
                `}
                onMouseEnter={() => setHoveredPath(path.id)}
                onMouseLeave={() => setHoveredPath(null)}
              >
                <h3 className="text-2xl font-medium text-white mb-4 luxury-text-shadow">{path.title}</h3>
                <p className="text-white/70 mb-6">{path.description}</p>
                <div className={`
                  pill-button
                  mt-auto px-6 py-2 rounded-full text-sm font-medium
                  border border-white/30
                  transition-all duration-300
                  ${hoveredPath === path.id ? 'bg-white/20 text-white' : 'bg-transparent text-white/70'}
                `}>
                  Explore Path
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-4 text-center text-white/50 text-sm">
          © {new Date().getFullYear()} The Persuasion Academy. All rights reserved.
        </div>
      </footer>
    </div>
  )
} 