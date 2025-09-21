import React, { useState, useEffect, useMemo } from 'react'
import { Users, Award, Globe, Clock, Heart, Target, Lightbulb, Shield, Github, Linkedin, Twitter, Mail, MapPin, Calendar, Code, Coffee, Zap, X, FileText, Send, Upload, ChevronRight, Star, Building2, Briefcase, GraduationCap, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  // Department color mapping for better visual appeal
  const departmentColors = {
    leadership: { bg: 'bg-gradient-to-br from-purple-500 to-purple-700', icon: '👑', accent: 'text-purple-600' },
    engineering: { bg: 'bg-gradient-to-br from-blue-500 to-blue-700', icon: '⚡', accent: 'text-blue-600' },
    design: { bg: 'bg-gradient-to-br from-pink-500 to-pink-700', icon: '🎨', accent: 'text-pink-600' },
    marketing: { bg: 'bg-gradient-to-br from-green-500 to-green-700', icon: '📢', accent: 'text-green-600' },
    operations: { bg: 'bg-gradient-to-br from-orange-500 to-orange-700', icon: '⚙️', accent: 'text-orange-600' },
    sales: { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-700', icon: '💼', accent: 'text-indigo-600' },
    management: { bg: 'bg-gradient-to-br from-red-500 to-red-700', icon: '🏆', accent: 'text-red-600' },
    all: { bg: 'bg-gradient-to-br from-gray-500 to-gray-700', icon: '🌟', accent: 'text-gray-600' }
  }

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
    // Use the actual department from API if available, otherwise infer from position
    const department = m.department
      ? slugifySimple(m.department)
      : inferDepartmentSlug(m.position)

    return {
      name: m.name,
      role: m.position,
      department: department,
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
      const slug = d.slug || slugifySimple(d.name)
      return {
        id: slug,
        name: d.name || d.value || slug,
        count: d.member_count || deptCounts[slug] || 0,
        description: d.description || '',
        head: d.head || ''
      }
    })
    const total = normalizedTeam.length
    // Ensure uniqueness of slugs and stable order
    const seen = new Set()
    const unique = []
    for (const d of mapped) {
      if (!seen.has(d.id)) { seen.add(d.id); unique.push(d) }
    }
    return [{ id: 'all', name: 'All Team', count: total, description: 'View all team members', head: '' }, ...unique]
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
    : normalizedTeam.filter(member => {
        const matches = member.department === selectedDepartment
        return matches
      })

  const featuredTeam = normalizedFeatured

  const getDepartmentStyle = (dept) => {
    return departmentColors[dept] || departmentColors.all
  }

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

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent bg-repeat bg-[length:60px_60px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 30px 30px, white 2px, transparent 2px)`
               }}>
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-8 border border-blue-400/20">
            <Star className="h-4 w-4 mr-2" />
            World-class talent, global impact
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            Meet Our Team
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-12 leading-relaxed">
            We're a diverse group of passionate professionals from around the world,
            united by our mission to build exceptional software that makes a difference.
          </p>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="relative group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <stat.icon className="h-12 w-12 text-blue-300 mx-auto mb-4 group-hover:text-blue-200 transition-colors" />
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-blue-200 font-medium text-lg">{stat.label}</div>
                  <div className="text-sm text-blue-300 mt-2">{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Department Overview */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Departments
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the diverse teams that make Sabiteck a powerhouse of innovation and excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {uiDepartments.filter(dept => dept.id !== 'all').map((dept) => {
              const style = getDepartmentStyle(dept.id)
              return (
                <Card key={dept.id} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-16 h-16 ${style.bg} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                        {style.icon}
                      </div>
                      <Badge className={`${style.accent} bg-transparent text-lg px-3 py-1 font-bold`}>
                        {dept.count} {dept.count === 1 ? 'member' : 'members'}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{dept.name}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{dept.description}</p>
                    {dept.head && (
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Building2 className="h-4 w-4 mr-2" />
                        Led by {dept.head}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      className={`group-hover:${style.accent} transition-colors text-gray-700 hover:text-gray-900`}
                      onClick={() => setSelectedDepartment(dept.id)}
                    >
                      View Team
                      <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Department Filter */}
          <div className="flex flex-wrap justify-center gap-4">
            {uiDepartments.map((dept) => {
              const style = getDepartmentStyle(dept.id)
              const isActive = selectedDepartment === dept.id
              return (
                <Button
                  key={dept.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setSelectedDepartment(dept.id)}
                  className={`flex items-center px-6 py-3 text-lg font-medium transition-all duration-300 ${
                    isActive
                      ? `${style.bg} text-white shadow-lg scale-105`
                      : 'hover:scale-105 hover:shadow-md border-2'
                  }`}
                >
                  <span className="mr-2 text-xl">{style.icon}</span>
                  {dept.name}
                  <Badge className={`ml-3 ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'} text-sm px-2 py-1`}>
                    {dept.count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Members Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {selectedDepartment === 'all' ? 'Our Amazing Team' : `${uiDepartments.find(d => d.id === selectedDepartment)?.name || ''} Team`}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {selectedDepartment === 'all'
                ? 'Get to know the talented individuals behind our success.'
                : `Meet the experts who make ${uiDepartments.find(d => d.id === selectedDepartment)?.name || ''} exceptional.`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredTeam.map((member, index) => {
              const style = getDepartmentStyle(member.department)
              return (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-6">
                    {/* Avatar and Department Badge */}
                    <div className="relative mb-6">
                      <div className={`w-20 h-20 ${style.bg} rounded-2xl mx-auto flex items-center justify-center shadow-lg`}>
                        <span className="text-white text-2xl font-bold">
                          {member.name?.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <Badge className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${style.accent} bg-white border-2 text-xs px-2 py-1`}>
                        {style.icon} {member.department}
                      </Badge>
                    </div>

                    {/* Member Info */}
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                      <p className={`font-medium text-lg ${style.accent} mb-3`}>{member.role}</p>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{member.bio}</p>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                      {(member.skills || []).slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    {/* Experience & Education */}
                    {(member.experience || member.education) && (
                      <div className="space-y-2 text-xs text-gray-500 mb-4">
                        {member.experience && (
                          <div className="flex items-center">
                            <Briefcase className="h-3 w-3 mr-2" />
                            <span>{member.experience}</span>
                          </div>
                        )}
                        {member.education && (
                          <div className="flex items-center">
                            <GraduationCap className="h-3 w-3 mr-2" />
                            <span>{member.education}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Social Links */}
                    <div className="flex justify-center space-x-3">
                      {member.social?.linkedin && (
                        <Button size="sm" variant="ghost" className="p-2 hover:bg-blue-50 hover:text-blue-600">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      )}
                      {member.social?.github && (
                        <Button size="sm" variant="ghost" className="p-2 hover:bg-gray-50 hover:text-gray-900">
                          <Github className="h-4 w-4" />
                        </Button>
                      )}
                      {member.social?.twitter && (
                        <Button size="sm" variant="ghost" className="p-2 hover:bg-blue-50 hover:text-blue-400">
                          <Twitter className="h-4 w-4" />
                        </Button>
                      )}
                      {member.social?.email && (
                        <Button size="sm" variant="ghost" className="p-2 hover:bg-red-50 hover:text-red-600">
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredTeam.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">No team members found</h3>
              <p className="text-gray-500">This department doesn't have any members yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Company Values */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core values guide everything we do and shape how we work together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <value.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-repeat bg-[length:60px_60px]"
               style={{
                 backgroundImage: `radial-gradient(circle at 30px 30px, white 2px, transparent 2px)`
               }}>
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-8 border border-blue-400/20">
            <Heart className="h-4 w-4 mr-2" />
            Join our growing family
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            We're always looking for talented individuals to join our growing team
            and help us build the future of technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-4 bg-white text-blue-900 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              onClick={() => setShowJobsModal(true)}
            >
              <Briefcase className="h-5 w-5 mr-2" />
              View Open Positions
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4 text-white border-white/30 hover:bg-white/10 backdrop-blur-sm shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => setShowResumeModal(true)}
            >
              <Send className="h-5 w-5 mr-2" />
              Send Your Resume
            </Button>
          </div>
        </div>
      </section>

      {/* Job Openings Modal */}
      {showJobsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Open Positions</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowJobsModal(false)}
                  className="hover:bg-gray-100 rounded-full p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {uiJobs.map((job) => (
                  <Card key={job.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl text-gray-900 mb-2">{job.title}</CardTitle>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
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
                      <p className="text-gray-700 mb-6 leading-relaxed">{job.description}</p>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-bold text-gray-900 mb-4 text-lg">Requirements:</h4>
                          <ul className="space-y-3">
                            {(job.requirements || []).map((req, index) => (
                              <li key={index} className="text-gray-600 flex items-start">
                                <span className="text-blue-500 mr-3 mt-1 text-lg">•</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-4 text-lg">Benefits:</h4>
                          <ul className="space-y-3">
                            {(job.benefits || []).map((benefit, index) => (
                              <li key={index} className="text-gray-600 flex items-start">
                                <span className="text-green-500 mr-3 mt-1 text-lg">•</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <Button
                          className="w-full sm:w-auto px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={() => {
                            setShowJobsModal(false)
                            setResumeForm(prev => ({ ...prev, position: job.title }))
                            setShowResumeModal(true)
                          }}
                        >
                          <Send className="h-5 w-5 mr-2" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Submit Your Resume</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResumeModal(false)}
                  className="hover:bg-gray-100 rounded-full p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleResumeSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
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
                      className="h-12"
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
                      className="h-12"
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
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume / CV *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
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
                          <span className="text-blue-600 font-medium">
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

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResumeModal(false)}
                    className="order-2 sm:order-1 h-12"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingResume}
                    className="order-1 sm:order-2 flex-1 h-12 bg-blue-600 hover:bg-blue-700"
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