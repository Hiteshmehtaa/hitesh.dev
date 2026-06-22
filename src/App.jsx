import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const projectsData = {
  hiresia: {
    title: 'Hiresia',
    tag: 'FULL STACK ATS',
    image: '/hiresia_dashboard.png',
    bullets: [
      'Built a MERN-based Applicant Tracking System (ATS) with job postings, candidate tracking, interview scheduling, and analytics features.',
      'Designed an analytics dashboard surfacing real-time hiring metrics and funnel insights.',
      'Automated email coordination via an interview scheduling module.',
      'Implemented secure role-based authentication (RBAC) for recruiters, candidates, and admins.',
      'Deployed the platform to production on Vercel ensuring high availability.'
    ],
    link: 'https://hiresiaweb.vercel.app'
  },
  rapidrescue: {
    title: 'RapidRescueQ',
    tag: 'COORDINATION PLATFORM',
    image: '/rapid_rescue_ui.png',
    bullets: [
      'Independently designed and built a MERN-stack platform connecting public reporters, NGOs, volunteers, and adopters.',
      'Implemented live camera-based emergency reporting with photo evidence and location capture.',
      'Created a separate NGO authentication portal for partner organizations to manage rescue cases.',
      'Deployed the platform to production on Render, demonstrating end-to-end full-stack ownership from design to deployment.'
    ],
    link: '#'
  }
};

function App() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const canvasContainerRef = useRef(null);
  
  // Platform Features State
  const [theme, setTheme] = useState('light');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Three.js Background - Logical Scroll Journey
  useEffect(() => {
    if (prefersReducedMotion || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const scene = new THREE.Scene();
    const fogColor = theme === 'dark' ? 0x0B0C10 : 0xF5F3EF;
    scene.fog = new THREE.Fog(fogColor, 10, 80);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const colorLight = new THREE.PointLight(theme === 'dark' ? 0x66FCF1 : 0x8FAF8C, 100, 100);
    scene.add(colorLight);

    // --- Station 0: Hero Core (z = 0) ---
    const coreGeo = new THREE.OctahedronGeometry(2, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({ color: theme === 'dark' ? 0x1F2833 : 0xE0DDD6, wireframe: true, transparent: true, opacity: 0.3 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 0, 0);
    scene.add(coreMesh);

    // --- Station 1: About Sphere (z = -50) ---
    const sphereGeo = new THREE.IcosahedronGeometry(3, 1);
    const sphereMat = new THREE.MeshPhysicalMaterial({ color: 0x8FAF8C, wireframe: true, transparent: true, opacity: 0.4 });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.position.set(5, -2, -50);
    scene.add(sphereMesh);

    // --- Station 2: Experience Pillars (z = -100) ---
    const pillarsGroup = new THREE.Group();
    const pillarGeo = new THREE.BoxGeometry(1, 10, 1);
    const pillarMat = new THREE.MeshPhysicalMaterial({ color: theme === 'dark' ? 0x1A1A1A : 0xDDDDDD, metalness: 0.5, roughness: 0.2, clearcoat: 1 });
    for (let i = 0; i < 5; i++) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(-6 + i * 3, -5 + i * 1.5, -100 - i * 5);
      pillarsGroup.add(pillar);
    }
    scene.add(pillarsGroup);

    // --- Station 3: Project Gallery Screens (z = -150) ---
    const textureLoader = new THREE.TextureLoader();
    const screensGroup = new THREE.Group();
    const screenGeo = new THREE.PlaneGeometry(8, 4.5);
    
    const matHiresia = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    textureLoader.load(projectsData.hiresia.image, (tex) => { matHiresia.map = tex; matHiresia.needsUpdate = true; });
    const screen1 = new THREE.Mesh(screenGeo, matHiresia);
    screen1.position.set(-5, 0, -150);
    screen1.rotation.y = Math.PI / 6;
    screensGroup.add(screen1);

    const matRapid = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    textureLoader.load(projectsData.rapidrescue.image, (tex) => { matRapid.map = tex; matRapid.needsUpdate = true; });
    const screen2 = new THREE.Mesh(screenGeo, matRapid);
    screen2.position.set(5, -3, -160);
    screen2.rotation.y = -Math.PI / 6;
    screensGroup.add(screen2);
    scene.add(screensGroup);

    // --- Station 4: Contact Portal (z = -200) ---
    const portalGeo = new THREE.TorusGeometry(4, 0.2, 16, 100);
    const portalMat = new THREE.MeshBasicMaterial({ color: theme === 'dark' ? 0x66FCF1 : 0x8FAF8C });
    const portalMesh = new THREE.Mesh(portalGeo, portalMat);
    portalMesh.position.set(0, 0, -200);
    scene.add(portalMesh);

    let mouseX = 0; let mouseY = 0;
    const onMouseMove = (event) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.002;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.002;
    };
    window.addEventListener('mousemove', onMouseMove);

    let scrollY = window.scrollY;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll);

    let reqId;
    let time = 0;
    function animate() {
      reqId = requestAnimationFrame(animate);
      time += 0.01;

      // Animations
      coreMesh.rotation.y = time * 0.2;
      coreMesh.rotation.x = time * 0.1;

      sphereMesh.rotation.y = time * -0.1;
      
      screen1.position.y = Math.sin(time) * 0.5;
      screen2.position.y = -3 + Math.sin(time + Math.PI) * 0.5;

      portalMesh.rotation.z = time * 0.5;

      // Move camera based on scroll
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = documentHeight > 0 ? scrollY / documentHeight : 0;
      
      // We have 5 stations spanning z=0 to z=-200. Max target = -200.
      const targetZ = 5 - (scrollPercent * 205); 
      
      camera.position.z += (targetZ - camera.position.z) * 0.1;
      
      // Parallax mouse effect
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 5 - camera.position.y) * 0.05;
      
      // Subtle tilt
      camera.rotation.z = mouseX * 0.1 + Math.sin(time * 0.5) * 0.02;

      colorLight.position.z = camera.position.z - 5;
      colorLight.position.x = Math.sin(time) * 10;
      colorLight.position.y = Math.cos(time) * 10;

      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    setTimeout(() => {
      if (container) {
        container.style.opacity = '1';
      }
    }, 100);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(reqId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      
      // Cleanup
      coreGeo.dispose(); coreMat.dispose();
      sphereGeo.dispose(); sphereMat.dispose();
      pillarGeo.dispose(); pillarMat.dispose();
      screenGeo.dispose(); matHiresia.dispose(); matRapid.dispose();
      portalGeo.dispose(); portalMat.dispose();
    };
  }, [prefersReducedMotion, theme]);

  // Custom Cursor
  useEffect(() => {
    if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

    const cursorDot = cursorDotRef.current;
    const cursorRing = cursorRingRef.current;
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let requestRef;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorDot) {
        cursorDot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
      }
    };

    const renderCursor = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      if (cursorRing) {
        cursorRing.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
      }
      requestRef = requestAnimationFrame(renderCursor);
    };

    window.addEventListener('mousemove', onMouseMove);
    requestRef = requestAnimationFrame(renderCursor);

    const onMouseDown = () => document.body.classList.add('cursor-click');
    const onMouseUp = () => document.body.classList.remove('cursor-click');
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(requestRef);
    };
  }, [prefersReducedMotion]);

  // Scroll Progress & Navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 80);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollY / docHeight) * 100;
      setScrollProgress(progress);

      const sections = document.querySelectorAll('section');
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 150) {
          current = section.getAttribute('id');
        }
      });
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for Reveal
  useEffect(() => {
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.stagger || 0;
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: "0px"
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [prefersReducedMotion, theme]);

  const handleInteractiveEnter = () => document.body.classList.add('cursor-hover');
  const handleInteractiveLeave = () => document.body.classList.remove('cursor-hover');

  const InteractiveEl = ({ as: Component = 'div', className, onMouseEnter, onMouseLeave, children, ...props }) => (
    <Component
      className={`cursor-interactive ${className || ''}`}
      onMouseEnter={(e) => { handleInteractiveEnter(); if (onMouseEnter) onMouseEnter(e); }}
      onMouseLeave={(e) => { handleInteractiveLeave(); if (onMouseLeave) onMouseLeave(e); }}
      {...props}
    >
      {children}
    </Component>
  );

  return (
    <>
      <div id="cursor-dot" ref={cursorDotRef}></div>
      <div id="cursor-ring" ref={cursorRingRef}></div>

      <div id="progress-bar" style={{ width: `${scrollProgress}%` }}></div>

      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
        {theme === 'light' ? (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        )}
      </button>

      {/* Project Modal Overlay */}
      <div className={`modal-overlay ${selectedProject ? 'active' : ''}`} onClick={() => setSelectedProject(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setSelectedProject(null)}>&times;</button>
          {selectedProject && (
            <>
              <img src={projectsData[selectedProject].image} alt={projectsData[selectedProject].title} className="modal-img" />
              <div className="work-tag">{projectsData[selectedProject].tag}</div>
              <h3 className="work-title" style={{marginBottom: '16px'}}>{projectsData[selectedProject].title}</h3>
              <ul className="project-bullets">
                {projectsData[selectedProject].bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
              <InteractiveEl as="a" href={projectsData[selectedProject].link} target="_blank" rel="noreferrer" className="btn-primary" style={{display: 'inline-block', marginTop: '16px'}}>Visit Live Platform</InteractiveEl>
            </>
          )}
        </div>
      </div>

      <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
        <div className="container nav-inner">
          <InteractiveEl as="a" href="#" className="logo">HITESH.DEV</InteractiveEl>
          <div className="nav-links">
            <InteractiveEl as="a" href="#work" className={`nav-item ${activeSection === 'work' ? 'active' : ''}`}>Work</InteractiveEl>
            <InteractiveEl as="a" href="#about" className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}>About</InteractiveEl>
            <InteractiveEl as="a" href="#stack" className={`nav-item ${activeSection === 'stack' ? 'active' : ''}`}>Stack</InteractiveEl>
            <InteractiveEl as="a" href="#contact" className={`nav-item ${activeSection === 'contact' ? 'active' : ''}`}>Contact</InteractiveEl>
          </div>
        </div>
      </nav>

      <main>
        <div id="canvas-container" ref={canvasContainerRef}></div>
        <section id="hero" className="hero-modern">
          <div className="container hero-content reveal">
            <div className="hero-badge">Available for opportunities</div>
            <h1 className="hero-title">
              Hi, I'm Hitesh.<br />
              I build <span className="highlight">scalable systems</span><br/>
              and craft <span className="highlight">seamless experiences.</span>
            </h1>
            <p className="hero-subtitle">Software Development Intern & Full-Stack Enthusiast</p>
            <div className="hero-cta">
              <InteractiveEl as="a" href="#work" className="btn-primary">View Projects</InteractiveEl>
              <InteractiveEl as="a" href="#contact" className="btn-secondary">Contact Me</InteractiveEl>
            </div>
          </div>
        </section>

        <section id="about" className="container reveal">
          <div className="about-grid">
            <div className="about-quote"></div>
            <div>
              <p className="about-text">
                I am a passionate software developer specializing in building production-ready mobile applications and investor-facing web platforms. My approach merges technical rigor with a relentless focus on creating seamless cross-platform experiences using React Native and the MERN stack.
              </p>
              <div className="skills-grid">
                <div className="skill-col">
                  <label>LANGUAGES & FRAMEWORKS</label>
                  <p>JavaScript, React Native, React.js, Node.js, Express.js</p>
                </div>
                <div className="skill-col">
                  <label>DATABASES & TOOLS</label>
                  <p>MongoDB, MySQL, Git, Expo, Vercel, Postman, n8n</p>
                </div>
                <div className="skill-col">
                  <label>CORE COMPETENCIES</label>
                  <p>REST APIs, JWT Auth, Cross-Platform Dev, UI/UX</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="experience">
          <div className="container">
            <h2 className="section-title reveal">Experience</h2>
            <div className="timeline">
              
              <div className="timeline-item reveal" data-stagger="0">
                <InteractiveEl className="timeline-card">
                  <div className="card-year">Apr 2024–Present</div>
                  <div className="card-role">Software Development Intern at Grade Capital</div>
                  <div className="card-desc">Contributed to production-ready mobile apps and investor-facing web platforms using React Native and React.js. Managed end-to-end App Store deployments and integrated RESTful APIs for real-time data flow.</div>
                </InteractiveEl>
              </div>

              <div className="timeline-item reveal" data-stagger="150">
                <InteractiveEl className="timeline-card">
                  <div className="card-year">Dec 2023–Apr 2024</div>
                  <div className="card-role">Application Development Intern at Yzxx</div>
                  <div className="card-desc">Designed and developed a cross-platform mobile application using React Native and Expo. Supported end-to-end App Store deployment and debugged critical production issues.</div>
                </InteractiveEl>
              </div>

            </div>
          </div>
        </section>

        {/* NEW SECTIONS: Case Studies and Testimonials */}
        <section id="work">
          <div className="container">
            <h2 className="section-title reveal" style={{ textAlign: 'left', marginBottom: '48px' }}>Featured Case Studies</h2>
            
            <div className="projects-grid">
              <div className="project-card reveal" data-stagger="0" onClick={() => setSelectedProject('hiresia')}>
                <div className="project-info">
                  <div className="work-tag">FULL STACK ATS</div>
                  <h3 className="work-title">Hiresia</h3>
                  <p className="about-text" style={{marginBottom: '24px'}}>A complete MERN-based Applicant Tracking System featuring analytics and role-based access.</p>
                  <InteractiveEl as="button" className="work-cta" style={{background: 'none', border: 'none', borderBottom: '1px solid currentColor', cursor: 'pointer', fontFamily: 'inherit'}}>READ CASE STUDY &rarr;</InteractiveEl>
                </div>
              </div>

              <div className="project-card reveal" data-stagger="150" onClick={() => setSelectedProject('rapidrescue')}>
                <div className="project-info">
                  <div className="work-tag">COORDINATION PLATFORM</div>
                  <h3 className="work-title">RapidRescueQ</h3>
                  <p className="about-text" style={{marginBottom: '24px'}}>A live camera-based emergency reporting and coordination platform for public reporters and NGOs.</p>
                  <InteractiveEl as="button" className="work-cta" style={{background: 'none', border: 'none', borderBottom: '1px solid currentColor', cursor: 'pointer', fontFamily: 'inherit'}}>READ CASE STUDY &rarr;</InteractiveEl>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="reveal">
          <div className="container">
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '48px' }}>Recommendations</h2>
            <div className="testimonial-grid">
              <div className="testimonial-card">
                <p className="testimonial-text">"Hitesh consistently demonstrated exceptional technical rigor and a keen eye for UI/UX during his time with us. He successfully led the deployment of multiple critical features to production."</p>
                <div className="testimonial-author">Engineering Lead @ Grade Capital</div>
              </div>
              <div className="testimonial-card">
                <p className="testimonial-text">"A dedicated and highly capable full-stack developer. Hitesh took complete ownership of our React Native app and streamlined the entire App Store release process independently."</p>
                <div className="testimonial-author">Product Manager @ Yzxx</div>
              </div>
            </div>
          </div>
        </section>

        <section id="stack">
          <div className="marquee-wrapper">
            <InteractiveEl className="marquee">
              <div className="marquee-content">
                <div className="stack-item"><svg viewBox="0 0 24 24"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6" /></svg> TypeScript</div>
                <div className="stack-item"><svg viewBox="0 0 24 24"><path d="M17.5 19A4.5 4.5 0 0 0 18 10c-.5-4-4-6-8-5-3.5 1-5 4.5-5 8.5a4 4 0 0 0 4.5 7.5" /></svg> AWS</div>
                <div className="stack-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2" /><circle cx="4" cy="12" r="2" /><circle cx="20" cy="12" r="2" /><circle cx="12" cy="20" r="2" /><path d="M10.6 5.4l-5.2 5.2M13.4 5.4l5.2 5.2M5.4 13.4l5.2 5.2M18.6 13.4l-5.2 5.2" /></svg> GraphQL</div>
                <div className="stack-item"><svg viewBox="0 0 24 24"><rect x="10" y="3" width="4" height="4" /><rect x="4" y="17" width="4" height="4" /><rect x="16" y="17" width="4" height="4" /><path d="M12 7v5M12 12H6v5M12 12h6v5" /></svg> Node.js</div>
                <div className="stack-item"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><path d="M8 10l2 2-2 2M13 14h3" /></svg> React</div>
                <div className="stack-item"><svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" /></svg> PostgreSQL</div>
              </div>
              <div className="marquee-content" aria-hidden="true">
                <div className="stack-item"><svg viewBox="0 0 24 24"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6" /></svg> TypeScript</div>
                <div className="stack-item"><svg viewBox="0 0 24 24"><path d="M17.5 19A4.5 4.5 0 0 0 18 10c-.5-4-4-6-8-5-3.5 1-5 4.5-5 8.5a4 4 0 0 0 4.5 7.5" /></svg> AWS</div>
                <div className="stack-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2" /><circle cx="4" cy="12" r="2" /><circle cx="20" cy="12" r="2" /><circle cx="12" cy="20" r="2" /><path d="M10.6 5.4l-5.2 5.2M13.4 5.4l5.2 5.2M5.4 13.4l5.2 5.2M18.6 13.4l-5.2 5.2" /></svg> GraphQL</div>
                <div className="stack-item"><svg viewBox="0 0 24 24"><rect x="10" y="3" width="4" height="4" /><rect x="4" y="17" width="4" height="4" /><rect x="16" y="17" width="4" height="4" /><path d="M12 7v5M12 12H6v5M12 12h6v5" /></svg> Node.js</div>
                <div className="stack-item"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><path d="M8 10l2 2-2 2M13 14h3" /></svg> React</div>
                <div className="stack-item"><svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" /></svg> PostgreSQL</div>
              </div>
            </InteractiveEl>
          </div>
        </section>

        <section id="contact" className="reveal">
          <div className="container">
            <h2 className="contact-title">Let's Build Something</h2>
            <InteractiveEl as="a" href="mailto:mhitesh059@gmail.com" className="contact-email">mhitesh059@gmail.com</InteractiveEl>
            
            <div className="socials">
              <InteractiveEl as="a" href="https://github.com/Hiteshmehtaa" target="_blank" rel="noreferrer" className="social-link" aria-label="GitHub">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </InteractiveEl>
              <InteractiveEl as="a" href="https://linkedin.com/in/hiteshmehta21" target="_blank" rel="noreferrer" className="social-link" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </InteractiveEl>
            </div>
          </div>
        </section>

      </main>

      <footer>
        <div className="container footer-inner">
          <div className="footer-text">© 2024 HITESH MEHTA. DESIGNED & BUILT BY ME.</div>
          <div className="footer-links">
            <InteractiveEl as="a" href="https://github.com/Hiteshmehtaa" target="_blank" rel="noreferrer">GITHUB</InteractiveEl>
            <InteractiveEl as="a" href="https://linkedin.com/in/hiteshmehta21" target="_blank" rel="noreferrer">LINKEDIN</InteractiveEl>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
