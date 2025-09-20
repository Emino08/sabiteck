import React, { useState, useEffect, useMemo } from 'react'
import { Users, Award, Globe, Clock, Heart, Target, Lightbulb, Shield, Github, Linkedin, Twitter, Mail, MapPin, Calendar, Code, Coffee, Zap, X, FileText, Send, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import ApiService from '../../services/api'

const Team = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [showJobsModal, setShowJobsModal] = useState(false)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [resumeForm, setResumeForm] = useState({
    name: '',
    email: '',
    position: '',
    experience: '',
    message: '',
    resume: null
  })
  const [submittingResume, setSubmittingResume] = useState(false)

  // New state for API-driven data
  const [teamMembers, setTeamMembers] = useState([])
  const [featuredMembers, setFeaturedMembers] = useState([])
  const [rawDepartments, setRawDepartments] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helpers
  const slugifySimple = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '').trim()

  const inferDepartmentSlug = (position = '') => {
    const p = (position || '').toLowerCase()
    if (/design|ux|ui/.test(p)) return 'design'
    if (/devops|cloud|infra/.test(p)) return 'engineering'
    if (/engineer|developer|cto|software|backend|frontend|full/.test(p)) return 'engineering'
    if (/sales|marketing|growth/.test(p)) return 'sales'
    if (/ceo|coo|cfo|vp|head|manager|lead|director|product|management/.test(p)) return 'management'
    return 'engineering' // default bucket
  }

  const mapMember = (m) => {
    const social = {
      linkedin: m.linkedin_url || undefined,
      twitter: m.twitter_url || undefined,
      email: m.email || undefined,
      github: undefined
    }
    return {
      name: m.name,
      role: m.position,
      department: inferDepartmentSlug(m.position),
      bio: m.bio || '',
      experience: m.experience || '',
      education: m.education || '',
      skills: Array.isArray(m.skills) ? m.skills : [],
      social
    }
  }

  const splitToList = (text = '') => {
    if (!text) return []
    return (text || '')
      .split(/\r?\n|•/)
      .map(s => s.replace(/^[-•\s]+/, '').trim())
      .filter(Boolean)
  }

  const mapJob = (j) => ({
    id: j.id || j.slug || Math.random().toString(36).slice(2),
    title: j.title,
    department: j.category || j.department || 'General',
    location: j.location || 'Remote',
    type: j.job_type || j.type || 'full-time',
    experience: j.experience || '',
    description: j.description || '',
    requirements: Array.isArray(j.requirements) ? j.requirements : splitToList(j.requirements),
    benefits: Array.isArray(j.benefits) ? j.benefits : splitToList(j.benefits)
  })

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    const load = async () => {
      try {
        const [teamResp, featuredResp, deptResp, jobsResp] = await Promise.all([
          ApiService.getTeamMembers().catch(() => []),
          ApiService.getFeaturedTeamMembers().catch(() => []),
          ApiService.getTeamDepartments().catch(() => []),
          ApiService.getJobs().catch(() => [])
        ])
        if (!mounted) return
        setTeamMembers(Array.isArray(teamResp) ? teamResp : (teamResp?.team || []))
        setFeaturedMembers(Array.isArray(featuredResp) ? featuredResp : (featuredResp?.team || []))
        setRawDepartments(Array.isArray(deptResp) ? deptResp : (deptResp?.departments || []))
        setJobs(Array.isArray(jobsResp) ? jobsResp : (jobsResp?.jobs || []))
      } catch (e) {
        if (!mounted) return
        setError('Failed to load team data')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const normalizedTeam = useMemo(() => (teamMembers || []).map(mapMember), [teamMembers])
  const normalizedFeatured = useMemo(() => (featuredMembers || []).map(mapMember), [featuredMembers])
  const uiJobs = useMemo(() => (jobs || []).map(mapJob), [jobs])

  const deptCounts = useMemo(() => {
    const counts = {}
    for (const m of normalizedTeam) {
      const d = m.department || 'engineering'
      counts[d] = (counts[d] || 0) + 1
    }
    return counts
  }, [normalizedTeam])

  const uiDepartments = useMemo(() => {
    const mapped = (rawDepartments || []).map(d => {
      const slug = d.slug || d.id || slugifySimple(d.name)
      return {
        id: slug,
        name: d.name || d.value || slug,
        count: deptCounts[slug] || 0
      }
    })
    const total = normalizedTeam.length
    // Ensure uniqueness of slugs and stable order
    const seen = new Set()
    const unique = []
    for (const d of mapped) {
      if (!seen.has(d.id)) { seen.add(d.id); unique.push(d) }
    }
    return [{ id: 'all', name: 'All Team', count: total }, ...unique]
  }, [rawDepartments, deptCounts, normalizedTeam.length])

  // Dynamic stats: make team count real; keep others as-is for now
  const stats = useMemo(() => ([
    { icon: Users, label: 'Team Members', value: `${normalizedTeam.length}+`, description: 'Talented professionals worldwide' },
    { icon: Award, label: 'Projects Completed', value: '200+', description: 'Successful deliveries since 2016' },
    { icon: Globe, label: 'Countries Served', value: '25+', description: 'Global client base' },
    { icon: Clock, label: 'Years Experience', value: '8+', description: 'Industry expertise' }
  ]), [normalizedTeam.length])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOC, or DOCX file')
        return
      }
      
      setResumeForm(prev => ({ ...prev, resume: file }))
    }
  }

  const handleResumeSubmit = async (e) => {
    e.preventDefault()
    setSubmittingResume(true)
    
    try {
      const formData = new FormData()
      formData.append('name', resumeForm.name)
      formData.append('email', resumeForm.email)
      formData.append('position', resumeForm.position)
      formData.append('experience', resumeForm.experience)
      formData.append('message', resumeForm.message)
      formData.append('resume', resumeForm.resume)
      
      // Since we don't have a specific API endpoint, we'll simulate success
      // In a real application, you would send this to your backend
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      toast.success('Resume submitted successfully! We\'ll be in touch soon.')
      setShowResumeModal(false)
      setResumeForm({
        name: '',
        email: '',
        position: '',
        experience: '',
        message: '',
        resume: null
      })
    } catch (error) {
      toast.error('Failed to submit resume. Please try again.')
    } finally {
      setSubmittingResume(false)
    }
  }

  const filteredTeam = selectedDepartment === 'all'
    ? normalizedTeam
    : normalizedTeam.filter(member => member.department === selectedDepartment)

  const featuredTeam = normalizedFeatured

  const timeline = [
    {
      year: '2016',
      title: 'Company Founded',
      description: 'Sarah Johnson founded Sabiteck with a small team of 5 developers in San Francisco.'
    },
    {
      year: '2017',
      title: 'First Major Client',
      description: 'Secured partnership with Fortune 500 company, expanding team to 15 members.'
    },
    {
      year: '2018',
      title: 'International Expansion',
      description: 'Opened London office and established partnerships in Europe and Asia.'
    },
    {
      year: '2019',
      title: 'Cloud Expertise',
      description: 'Became AWS Advanced Partner and expanded cloud services offerings.'
    },
    {
      year: '2020',
      title: 'Remote-First',
      description: 'Successfully transitioned to remote-first model, growing team globally.'
    },
    {
      year: '2021',
      title: '100+ Projects',
      description: 'Reached milestone of 100+ successful project deliveries.'
    },
    {
      year: '2022',
      title: 'New York Office',
      description: 'Opened East Coast headquarters to serve enterprise clients better.'
    },
    {
      year: '2023',
      title: 'AI Integration',
      description: 'Launched AI-powered development tools and machine learning services.'
    },
    {
      year: '2024',
      title: 'Series A Funding',
      description: 'Raised $10M Series A to accelerate growth and expand service offerings.'
    }
  ]

  const values = [
    {
      icon: Heart,
      title: 'Client-Centric',
      description: 'We put our clients first, always. Your success is our success, and we go above and beyond to ensure your project exceeds expectations.'
    },
    {
      icon: Target,
      title: 'Results-Driven',
      description: 'We focus on delivering measurable outcomes. Every line of code we write serves a purpose and contributes to your business goals.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'We stay ahead of the curve with cutting-edge technologies and creative solutions to complex problems.'
    },
    {
      icon: Shield,
      title: 'Reliability',
      description: 'Count on us for consistent, high-quality delivery. We meet deadlines and maintain the highest standards of professionalism.'
    }
  ]

  const benefits = [
    { icon: Coffee, title: 'Flexible Work', description: 'Remote-first with flexible hours' },
    { icon: Heart, title: 'Health & Wellness', description: 'Comprehensive health coverage' },
    { icon: Lightbulb, title: 'Learning Budget', description: '$2,000 annual learning allowance' },
    { icon: Globe, title: 'Work Anywhere', description: 'Work from anywhere in the world' },
    { icon: Zap, title: 'Latest Tech', description: 'Top-tier equipment and tools' },
    { icon: Users, title: 'Team Events', description: 'Annual retreats and team building' }
  ]

  return (
    <div className="min-h-screen pt-32">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Meet Our Team
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            We're a diverse group of passionate professionals from around the world, 
            united by our mission to build exceptional software that makes a difference.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Leadership Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Meet the visionaries and leaders who guide Sabiteck's mission and drive our success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredTeam.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {member.name?.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <p className="text-primary font-medium">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    {member.experience && (<div><strong>Experience:</strong> {member.experience}</div>)}
                    {member.education && (<div><strong>Education:</strong> {member.education}</div>)}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(member.skills || []).slice(0, 3).map((skill) => (
                      <span key={skill} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-3">
                    {member.social?.linkedin && (
                      <Button size="sm" variant="ghost" className="p-2">
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    )}
                    {member.social?.github && (
                      <Button size="sm" variant="ghost" className="p-2">
                        <Github className="h-4 w-4" />
                      </Button>
                    )}
                    {member.social?.twitter && (
                      <Button size="sm" variant="ghost" className="p-2">
                        <Twitter className="h-4 w-4" />
                      </Button>
                    )}
                    {member.social?.email && (
                      <Button size="sm" variant="ghost" className="p-2">
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* All Team Members */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Amazing Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Explore our team by department and get to know the talented individuals behind our success.
            </p>

            {/* Department Filter */}
            <div className="flex flex-wrap justify-center gap-4">
              {uiDepartments.map((dept) => (
                <Button
                  key={dept.id}
                  variant={selectedDepartment === dept.id ? "default" : "outline"}
                  onClick={() => setSelectedDepartment(dept.id)}
                  className="flex items-center"
                >
                  {dept.name}
                  <span className="ml-2 bg-white/20 text-xs px-2 py-1 rounded-full">
                    {dept.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTeam.map((member, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/80 to-blue-600/80 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {member.name?.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-center">{member.name}</CardTitle>
                  <p className="text-primary font-medium text-center text-sm">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{member.bio}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(member.skills || []).slice(0, 4).map((skill) => (
                      <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-center space-x-2">
                    {member.social?.linkedin && (
                      <Button size="sm" variant="ghost" className="p-1">
                        <Linkedin className="h-3 w-3" />
                      </Button>
                    )}
                    {member.social?.github && (
                      <Button size="sm" variant="ghost" className="p-1">
                        <Github className="h-3 w-3" />
                      </Button>
                    )}
                    {member.social?.twitter && (
                      <Button size="sm" variant="ghost" className="p-1">
                        <Twitter className="h-3 w-3" />
                      </Button>
                    )}
                    {member.social?.email && (
                      <Button size="sm" variant="ghost" className="p-1">
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do and shape how we work together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <value.icon className="h-16 w-16 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From a small startup to a global software development company - here's our story.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-primary/20"></div>
            <div className="space-y-8">
              {timeline.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-2xl font-bold text-primary mb-2">{milestone.year}</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                        <p className="text-gray-600">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative flex items-center justify-center w-12 h-12 bg-primary rounded-full border-4 border-white shadow-lg z-10">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Work With Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Work With Us?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We offer more than just a job - we provide a platform for growth and innovation.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <benefit.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our Team
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Ready to make an impact? We're always looking for talented individuals 
            to join our growing team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-3"
              onClick={() => setShowJobsModal(true)}
            >
              View Open Positions
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-3 text-blue-900 border-white hover:bg-blue-100 hover:text-primary"
              onClick={() => setShowResumeModal(true)}
            >
              Send Your Resume
            </Button>
          </div>
        </div>
      </section>

      {/* Job Openings Modal */}
      {showJobsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Open Positions</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowJobsModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {uiJobs.map((job) => (
                  <Card key={job.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{job.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {job.department}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {job.type}
                            </span>
                            {job.experience && (
                              <span className="flex items-center">
                                <Award className="h-4 w-4 mr-1" />
                                {job.experience}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{job.description}</p>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Requirements:</h4>
                          <ul className="space-y-2">
                            {(job.requirements || []).map((req, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="text-primary mr-2 mt-1">•</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Benefits:</h4>
                          <ul className="space-y-2">
                            {(job.benefits || []).map((benefit, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="text-primary mr-2 mt-1">•</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <Button 
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setShowJobsModal(false)
                            setResumeForm(prev => ({ ...prev, position: job.title }))
                            setShowResumeModal(true)
                          }}
                        >
                          Apply for This Position
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Submission Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Submit Your Resume</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResumeModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleResumeSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      type="text"
                      value={resumeForm.name}
                      onChange={(e) => setResumeForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={resumeForm.email}
                      onChange={(e) => setResumeForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position of Interest *
                  </label>
                  <select
                    value={resumeForm.position}
                    onChange={(e) => setResumeForm(prev => ({ ...prev, position: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select a position</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.title}>{job.title}</option>
                    ))}
                    <option value="Other">Other / General Application</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <select
                    value={resumeForm.experience}
                    onChange={(e) => setResumeForm(prev => ({ ...prev, experience: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select experience level</option>
                    <option value="0-1">0-1 years</option>
                    <option value="2-3">2-3 years</option>
                    <option value="4-5">4-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter / Message
                  </label>
                  <textarea
                    value={resumeForm.message}
                    onChange={(e) => setResumeForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    placeholder="Tell us why you're interested in working with us..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume / CV *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {resumeForm.resume ? (
                          <span className="text-primary font-medium">
                            {resumeForm.resume.name}
                          </span>
                        ) : (
                          <>
                            Click to upload your resume or drag and drop
                            <br />
                            <span className="text-sm text-gray-500">PDF, DOC, or DOCX (max 5MB)</span>
                          </>
                        )}
                      </p>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResumeModal(false)}
                    className="order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingResume}
                    className="order-1 sm:order-2 flex-1"
                  >
                    {submittingResume ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Team

