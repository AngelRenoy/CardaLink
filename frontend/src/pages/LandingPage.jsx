import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HeroCard } from '../components/HeroCard';
import { FeatureCard } from '../components/FeatureCard';
import { 
  ArrowRight, 
  Play, 
  Sprout, 
  Droplets, 
  FlaskConical, 
  Boxes, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp,
  Cpu,
  Mail,
  Phone,
  MapPin,
  Send,
  Award,
  Globe2,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <div style={{ backgroundColor: '#FAFAF9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Hero Section */}
      <section id="home" className="hero-background-soft" style={{
        paddingTop: '4rem',
        paddingBottom: '5.5rem',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid #E2E8F0',
      }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3.5rem',
          alignItems: 'center',
        }}>
          {/* Left Hero Content */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              border: '1px solid #A7F3D0',
            }}>
              <Sprout size={16} />
              <span>Next-Gen Spices Technology</span>
            </div>

            <h1 style={{
              fontSize: '3.4rem',
              fontWeight: '800',
              color: '#073B1E',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em',
            }}>
              Smart Cardamom <br />
              <span style={{
                background: 'linear-gradient(135deg, #15803D 0%, #22C55E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Plantation
              </span> Management
            </h1>

            <p style={{
              fontSize: '1.15rem',
              color: '#475569',
              lineHeight: 1.65,
              marginBottom: '2.25rem',
              maxWidth: '560px',
            }}>
              Digitally manage your plantation, inventory, traders, exporters and AI-powered crop monitoring from one intelligent platform.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
                <span>Explore Platform</span>
                <ArrowRight size={20} />
              </Link>

              <a href="#features" className="btn btn-secondary" style={{ padding: '0.9rem 1.75rem', fontSize: '1.05rem' }}>
                <Play size={18} fill="#15803D" color="#15803D" />
                <span>Watch Demo</span>
              </a>
            </div>

            {/* Quick Highlights */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.75rem',
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <span>Farmer Direct Hub</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <span>Trader Auctions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <span>Global Exports</span>
              </div>
            </div>
          </div>

          {/* Right Side Hero Card */}
          <div>
            <HeroCard />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '6rem 0', backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 4rem' }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: '800',
              color: '#16A34A',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              display: 'block',
            }}>
              Empowering Agriculture
            </span>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: '#073B1E',
              lineHeight: 1.2,
              marginBottom: '1rem',
            }}>
              Everything You Need for <br />
              Cardamom Excellence
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#64748B' }}>
              Designed specifically for Kerala's premier cardamom estates, connecting cultivation precision with international export workflows.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2rem',
          }}>
            <FeatureCard
              icon={Sprout}
              title="Plantation Management"
              description="Monitor plot health, shade tree density, flowering cycles, and harvest yield estimations with digital spatial tracking."
              badge="Core Module"
            />
            <FeatureCard
              icon={Droplets}
              title="Irrigation Tracking"
              description="Schedule automated mist irrigation based on live Munnar micro-climate weather forecasts and soil moisture sensors."
              badge="Smart IoT"
            />
            <FeatureCard
              icon={FlaskConical}
              title="Fertilizer Records"
              description="Maintain precise organic and chemical input logs to satisfy global export pesticide residue standards."
              badge="Compliance"
            />
            <FeatureCard
              icon={Boxes}
              title="Inventory Management"
              description="Track green capsule curing, moisture grading, weight loss percentages, and warehouse stock lots seamlessly."
              badge="Real-time"
            />
          </div>
        </div>
      </section>

      {/* About & Value Proposition Section */}
      <section id="about" style={{ padding: '5.5rem 0', backgroundColor: '#F0FDF4', borderTop: '1px solid #DCFCE7' }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3.5rem',
          alignItems: 'center',
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Why CardaLink?
            </span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#073B1E', margin: '0.75rem 0 1.25rem' }}>
              Transforming the Cardamom Value Chain
            </h2>
            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              CardaLink bridges the traditional gap between smallholder cardamom planters in Idukki, regional auction traders, and global spice exporters.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ minWidth: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#073B1E' }}>Fair Price Discovery</h4>
                  <p style={{ fontSize: '0.9rem', color: '#64748B' }}>Live market auction rates from Spices Board auctions updated in real-time.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ minWidth: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#073B1E' }}>AI Powered Crop Health</h4>
                  <p style={{ fontSize: '0.9rem', color: '#64748B' }}>Early detection of thrips, capsule rot, and nutrient deficiency before yield loss.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ minWidth: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#073B1E' }}>Verified Export Quality</h4>
                  <p style={{ fontSize: '0.9rem', color: '#64748B' }}>Grade-A capsule size certification and phytosanitary traceability logs.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 12px 30px rgba(15, 90, 44, 0.08)',
            border: '1px solid #BBF7D0',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#073B1E', marginBottom: '1rem' }}>
              Ready to Digitise Your Plantation?
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#64748B', marginBottom: '2rem' }}>
              Join hundreds of progressive cardamom planters and trade houses using CardaLink today.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.9rem', fontSize: '1rem' }}>
                Create Free Account
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.9rem', fontSize: '1rem' }}>
                Already registered? Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={{ padding: '6rem 0', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
              End-to-End Solutions
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#073B1E', marginBottom: '1rem' }}>
              CardaLink Ecosystem Services
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#64748B' }}>
              Comprehensive digital services tailored for growers, auction houses, and international spice exporters.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div style={serviceCardStyle}>
              <div style={serviceIconStyle}><BarChart3 size={28} /></div>
              <h3 style={serviceTitleStyle}>Soil & Climate Analytics</h3>
              <p style={serviceTextStyle}>High-resolution moisture, pH level, and temperature analysis mapped specifically to Munnar and Bodinayakanur micro-climates.</p>
            </div>

            <div style={serviceCardStyle}>
              <div style={serviceIconStyle}><TrendingUp size={28} /></div>
              <h3 style={serviceTitleStyle}>Spices Board Auction Exchange</h3>
              <p style={serviceTextStyle}>Direct connectivity to official Spices Board auction feeds with price alert notifications and historical trend mapping.</p>
            </div>

            <div style={serviceCardStyle}>
              <div style={serviceIconStyle}><Award size={28} /></div>
              <h3 style={serviceTitleStyle}>Capsule Quality Grading</h3>
              <p style={serviceTextStyle}>Automated size (8mm+, 7.5mm), aroma retention, and color preservation scoring for premium export batch valuation.</p>
            </div>

            <div style={serviceCardStyle}>
              <div style={serviceIconStyle}><Globe2 size={28} /></div>
              <h3 style={serviceTitleStyle}>Export Logistics & Traceability</h3>
              <p style={serviceTextStyle}>Generate QR-coded digital passports for every export container to meet EU, Middle East, and US FDA compliance standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '6rem 0', backgroundColor: '#F0FDF4', borderTop: '1px solid #DCFCE7' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 4rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
              Get In Touch
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#073B1E', marginBottom: '1rem' }}>
              Contact CardaLink Support & Operations
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#64748B' }}>
              Have questions about digitizing your plantation or onboarding your trade network? Speak with our agritech experts.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'start' }}>
            {/* Contact Info */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '2.5rem', borderRadius: '24px', border: '1px solid #BBF7D0', boxShadow: '0 10px 30px rgba(15, 90, 44, 0.06)' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#073B1E', marginBottom: '1.5rem' }}>
                Headquarters & Regional Office
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px' }}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#073B1E' }}>Estate Location</h4>
                    <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5 }}>Munnar Spice Valley, Idukki District, Kerala - 685612, India</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px' }}>
                    <Phone size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#073B1E' }}>Helpline & Support</h4>
                    <p style={{ fontSize: '0.9rem', color: '#64748B' }}>+91 4865 230 400 / +91 98765 43210</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px' }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#073B1E' }}>Email Inquiries</h4>
                    <p style={{ fontSize: '0.9rem', color: '#64748B' }}>support@cardalink.com | trade@cardalink.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Inquiry Form */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '2.5rem', borderRadius: '24px', border: '1px solid #BBF7D0', boxShadow: '0 10px 30px rgba(15, 90, 44, 0.06)' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#073B1E', marginBottom: '1.25rem' }}>
                Send Us a Message
              </h3>

              {contactSubmitted ? (
                <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', padding: '1.25rem', borderRadius: '14px', textAlign: 'center', fontWeight: '600' }}>
                  <CheckCircle size={24} style={{ marginBottom: '0.5rem' }} />
                  <div>Thank you! Your message has been sent to our CardaLink operations team.</div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.4rem' }}>Your Name *</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. Anand Varma"
                      className="form-input"
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.4rem' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="anand@gmail.com"
                      className="form-input"
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.4rem' }}>Subject</label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Plantation Onboarding Inquiry"
                      className="form-input"
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.4rem' }}>Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="How can we assist your cardamom plantation or trade business?"
                      className="form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                    <Send size={18} /> Send Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const serviceCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  padding: '2rem',
  border: '1px solid #E2E8F0',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
};

const serviceIconStyle = {
  width: '54px',
  height: '54px',
  borderRadius: '16px',
  backgroundColor: '#DCFCE7',
  color: '#15803D',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1.25rem',
};

const serviceTitleStyle = {
  fontSize: '1.2rem',
  fontWeight: '700',
  color: '#073B1E',
  marginBottom: '0.65rem',
};

const serviceTextStyle = {
  fontSize: '0.925rem',
  color: '#475569',
  lineHeight: 1.6,
};
