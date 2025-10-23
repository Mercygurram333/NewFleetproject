import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Truck, Shield, Clock, Users, Star, MapPin, Phone, Mail, 
  CheckCircle, Package, Navigation, ArrowRight, Menu, X, Zap
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { clearAllAuthData, debugAuthState } from '../utils/authReset'
import './HomePage.css'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { logout, isAuthenticated, user } = useAuthStore()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [navigationError, setNavigationError] = useState<string | null>(null)

  // Clear authentication state when HomePage loads to ensure clean start
  useEffect(() => {
    // Debug current auth state
    debugAuthState()
    
    if (isAuthenticated) {
      console.log('🔄 Clearing existing authentication state for clean homepage experience')
      clearAllAuthData()
      logout()
    }
  }, [])

  // Enhanced navigation handler with authentication state clearing
  const handleNavigation = (path: string, buttonName: string) => {
    try {
      console.log(`🔄 Navigation triggered: ${buttonName} -> ${path}`)
      setNavigationError(null)
      
      // Validate path
      if (!path || typeof path !== 'string') {
        throw new Error('Invalid navigation path')
      }
      
      // Ensure user is logged out before navigating to auth forms
      if ((path === '/login' || path === '/register') && isAuthenticated) {
        console.log('🚪 Logging out user before showing auth forms')
        logout()
      }
      
      // Perform navigation
      navigate(path)
      console.log(`✅ Navigation successful: ${path}`)
      
    } catch (error) {
      console.error(`❌ Navigation failed for ${buttonName}:`, error)
      setNavigationError(`Navigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Real-Time Tracking',
      description: 'Track your deliveries in real-time with GPS-enabled monitoring and live updates.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure & Reliable',
      description: 'Your packages are safe with our verified drivers and comprehensive insurance coverage.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Fast Delivery',
      description: 'Lightning-fast delivery with optimized routes and dedicated fleet management.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: '24/7 Support',
      description: 'Round-the-clock customer support to assist you with any queries or concerns.',
      color: 'from-green-500 to-teal-500'
    }
  ]

  const vehicles = [
    {
      name: 'Small Van',
      capacity: 'Up to 500 kg',
      dimensions: '2m × 1.5m × 1.5m',
      price: '₹500/delivery',
      image: '🚐',
      features: ['City Deliveries', 'Small Packages', 'Quick Transit']
    },
    {
      name: 'Medium Truck',
      capacity: 'Up to 2 tons',
      dimensions: '4m × 2m × 2m',
      price: '₹1,200/delivery',
      image: '🚚',
      features: ['Inter-city', 'Bulk Items', 'Furniture']
    },
    {
      name: 'Large Truck',
      capacity: 'Up to 5 tons',
      dimensions: '6m × 2.5m × 2.5m',
      price: '₹2,500/delivery',
      image: '🚛',
      features: ['Long Distance', 'Heavy Cargo', 'Industrial']
    }
  ]

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Business Owner',
      image: '👨‍💼',
      rating: 5,
      text: 'Excellent service! The real-time tracking feature helped me monitor my shipments efficiently. Highly recommended for businesses.'
    },
    {
      name: 'Priya Sharma',
      role: 'E-commerce Manager',
      image: '👩‍💼',
      rating: 5,
      text: 'Fast and reliable delivery service. The drivers are professional and the customer support is outstanding. Will definitely use again!'
    },
    {
      name: 'Amit Patel',
      role: 'Logistics Coordinator',
      image: '👨‍💻',
      rating: 5,
      text: 'Best fleet management system I\'ve used. The interface is intuitive and the delivery times are consistently impressive.'
    }
  ]

  const stats = [
    { value: '10,000+', label: 'Deliveries', icon: <Package className="w-6 h-6" /> },
    { value: '500+', label: 'Customers', icon: <Users className="w-6 h-6" /> },
    { value: '50+', label: 'Drivers', icon: <Truck className="w-6 h-6" /> },
    { value: '99.8%', label: 'On-Time', icon: <CheckCircle className="w-6 h-6" /> }
  ]

  return (
    <div className="homepage">
      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="nav-content">
            <div className="logo-section">
              <div className="logo-icon">
                <Truck className="w-6 h-6" />
              </div>
              <span className="logo-text">FleetFlow</span>
            </div>

            <div className="nav-links desktop-only">
              <a href="#features">Features</a>
              <a href="#vehicles">Vehicles</a>
              <a href="#testimonials">Testimonials</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="nav-buttons desktop-only">
              <button 
                onClick={() => handleNavigation('/login', 'Nav Login Button')} 
                className="btn-secondary"
                type="button"
              >
                Login
              </button>
              <button 
                onClick={() => handleNavigation('/register', 'Nav Get Started Button')} 
                className="btn-primary"
                type="button"
              >
                Get Started
              </button>
            </div>

            <button className="mobile-menu-btn mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#vehicles" onClick={() => setMobileMenuOpen(false)}>Vehicles</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <button 
              onClick={() => handleNavigation('/login', 'Mobile Login Button')} 
              className="btn-secondary"
              type="button"
            >
              Login
            </button>
            <button 
              onClick={() => handleNavigation('/register', 'Mobile Get Started Button')} 
              className="btn-primary"
              type="button"
            >
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>

        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <span className="badge">🚀 #1 Fleet Management Solution</span>
              <h1 className="hero-title">
                <span className="gradient-text">Deliver Faster,</span>
                <br />Track Smarter
              </h1>
              <p className="hero-description">
                Experience seamless delivery management with real-time tracking, verified drivers, and 24/7 support.
              </p>
              <div className="hero-buttons">
                <button 
                  onClick={() => handleNavigation('/register', 'Hero Get Started Button')} 
                  className="btn-primary btn-large"
                  type="button"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleNavigation('/login', 'Hero Login Button')} 
                  className="btn-secondary btn-large"
                  type="button"
                >
                  Login Now
                </button>
              </div>
              
              {/* Navigation Error Display */}
              {navigationError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                  <strong>Navigation Error:</strong> {navigationError}
                </div>
              )}
              
              {/* Debug Panel for Development */}
              {import.meta.env.DEV && (
                <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg text-sm">
                  <div className="font-semibold mb-2">🛠️ Debug Panel</div>
                  <div className="space-y-2">
                    <div>Auth Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</div>
                    <div>User: {user ? `${user.name} (${user.role})` : 'None'}</div>
                    <div className="space-x-2">
                      <button 
                        onClick={() => {
                          clearAllAuthData()
                          logout()
                          window.location.reload()
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded text-xs"
                      >
                        Clear Auth & Reload
                      </button>
                      <button 
                        onClick={debugAuthState}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
                      >
                        Debug State
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="stats-grid">
                {stats.map((stat, i) => (
                  <div key={i} className="stat-item">
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-visual">
              <div className="floating-card card-1">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <div className="card-label">Delivery Status</div>
                  <div className="card-value">Completed ✓</div>
                </div>
              </div>
              <div className="floating-card card-2">
                <Navigation className="w-6 h-6" />
                <div>
                  <div className="card-label">Live Tracking</div>
                  <div className="card-value">En Route</div>
                </div>
              </div>
              <div className="main-visual">
                <div className="truck-icon">🚚</div>
                <div className="visual-title">Real-Time Tracking</div>
                <div className="pulse-dots">
                  <div className="pulse-dot"></div>
                  <div className="pulse-dot"></div>
                  <div className="pulse-dot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose <span className="gradient-text">FleetFlow</span></h2>
            <p>Experience the future of delivery management with cutting-edge features</p>
          </div>
          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={i} className="feature-card">
                <div className={`feature-icon bg-gradient-${i + 1}`}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-link">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicles Section */}
      <section id="vehicles" className="vehicles-section">
        <div className="container">
          <div className="section-header">
            <h2>Our <span className="gradient-text">Fleet</span></h2>
            <p>Choose from our diverse range of vehicles to match your delivery needs</p>
          </div>
          <div className="vehicles-grid">
            {vehicles.map((vehicle, i) => (
              <div key={i} className="vehicle-card">
                <div className="vehicle-header">
                  <div className="vehicle-icon">{vehicle.image}</div>
                  <div className="vehicle-price">{vehicle.price}</div>
                </div>
                <div className="vehicle-body">
                  <h3>{vehicle.name}</h3>
                  <div className="vehicle-specs">
                    <div className="spec"><Package className="w-4 h-4" /> {vehicle.capacity}</div>
                    <div className="spec">{vehicle.dimensions}</div>
                  </div>
                  <div className="vehicle-features">
                    {vehicle.features.map((f, idx) => (
                      <div key={idx} className="feature-item">
                        <CheckCircle className="w-4 h-4" /> {f}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => handleNavigation('/register', 'Vehicle Book Now Button')} 
                    className="btn-primary btn-full"
                    type="button"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>Happy <span className="gradient-text">Customers</span></h2>
            <p>Don't just take our word for it - hear what our customers have to say</p>
          </div>
          <div className="testimonial-container">
            <div className="testimonial-card">
              <div className="testimonial-image">{testimonials[activeTestimonial].image}</div>
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="star-icon" />
                ))}
              </div>
              <p className="testimonial-text">"{testimonials[activeTestimonial].text}"</p>
              <div className="testimonial-author">
                <div className="author-name">{testimonials[activeTestimonial].name}</div>
                <div className="author-role">{testimonials[activeTestimonial].role}</div>
              </div>
            </div>
            <div className="testimonial-dots">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`dot ${i === activeTestimonial ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <div className="section-header">
            <h2>Get In <span className="gradient-text">Touch</span></h2>
            <p>Have questions? We're here to help you 24/7</p>
          </div>
          <div className="contact-grid">
            {[
              { icon: <Phone className="w-8 h-8" />, title: 'Phone', value: '+91 98765 43210' },
              { icon: <Mail className="w-8 h-8" />, title: 'Email', value: 'support@fleetflow.com' },
              { icon: <MapPin className="w-8 h-8" />, title: 'Location', value: 'Hyderabad, India' }
            ].map((contact, i) => (
              <div key={i} className="contact-card">
                <div className={`contact-icon bg-gradient-${i + 1}`}>{contact.icon}</div>
                <h3>{contact.title}</h3>
                <p>{contact.value}</p>
              </div>
            ))}
          </div>
          <div className="cta-section">
            <h3>Ready to Get Started?</h3>
            <p>Join thousands of satisfied customers and experience seamless delivery management</p>
            <div className="cta-buttons">
              <button 
                onClick={() => handleNavigation('/register', 'CTA Get Started Button')} 
                className="btn-primary btn-large"
                type="button"
              >
                Get Started Free
              </button>
              <button 
                onClick={() => handleNavigation('/login', 'CTA Login Button')} 
                className="btn-secondary btn-large"
                type="button"
              >
                Login Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo-section">
                <div className="logo-icon"><Truck className="w-6 h-6" /></div>
                <span className="logo-text">FleetFlow</span>
              </div>
              <p>Your trusted partner for all delivery and logistics needs.</p>
            </div>
            <div className="footer-links">
              <h4>Quick Links</h4>
              <a href="#features">Features</a>
              <a href="#vehicles">Vehicles</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div className="footer-links">
              <h4>Contact</h4>
              <p>+91 98765 43210</p>
              <p>support@fleetflow.com</p>
              <p>Hyderabad, India</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 FleetFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
