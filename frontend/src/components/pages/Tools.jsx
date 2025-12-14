import React, { useState, useEffect } from 'react';
import { Calculator, BookOpen, TrendingUp, Wrench, ChevronRight, FileText, RefreshCw, Sparkles, Zap, Star, Link } from 'lucide-react';
import GPACalculator from '../tools/GPACalculator';
import FileConverter from '../tools/FileConverter';
import CurriculumViewer from '../tools/CurriculumViewer';
import ImportantLinks from '../tools/ImportantLinks';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Tools = () => {
    const [activeTab, setActiveTab] = useState('gpa');
    const [isLoaded, setIsLoaded] = useState(false);
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);

    // Component mapping
    const componentMap = {
        'GPACalculator': GPACalculator,
        'FileConverter': FileConverter,
        'CurriculumViewer': CurriculumViewer,
        'ImportantLinks': ImportantLinks
    };

    // Icon mapping
    const iconMap = {
        'Calculator': Calculator,
        'RefreshCw': RefreshCw,
        'BookOpen': BookOpen,
        'Wrench': Wrench,
        'FileText': FileText,
        'Star': Star,
        'Zap': Zap,
        'Sparkles': Sparkles,
        'Link': Link
    };

    useEffect(() => {
        fetchTools();
        setTimeout(() => setIsLoaded(true), 300);
    }, []);

    const fetchTools = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tools/config`);
            const data = await response.json();

            if (data.success) {
                // Filter only visible tools and map components
                let visibleTools = data.data
                    .filter(tool => tool.visible)
                    .map(tool => ({
                        ...tool,
                        id: tool.name.toLowerCase().replace(/\s+/g, '-'),
                        icon: iconMap[tool.icon] || Wrench,
                        component: componentMap[tool.component] || null
                    }));

                // Important Links is now in database, no need for auto-injection

                // Sort by display_order
                visibleTools.sort((a, b) => (a.display_order || 99) - (b.display_order || 99));

                setTools(visibleTools);

                // Set default active tab to first visible tool
                if (visibleTools.length > 0) {
                    setActiveTab(visibleTools[0].id);
                }
            } else {
                // Fallback to default tools if API fails
                setTools([
                    {
                        id: 'gpa',
                        name: 'GPA Calculator',
                        description: 'Calculate your Grade Point Average for Njala University, FBC, and Every Nation College',
                        icon: Calculator,
                        component: GPACalculator,
                        featured: true,
                        gradient: 'from-violet-500 via-purple-500 to-pink-500',
                        color: 'violet',
                        visible: true
                    },
                    {
                        id: 'file-converter',
                        name: 'File Converter',
                        description: 'Convert and resize documents and images - PDF to Word, Image OCR, File compression and more',
                        icon: RefreshCw,
                        component: FileConverter,
                        featured: true,
                        gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
                        color: 'cyan',
                        visible: true
                    },
                    {
                        id: 'curriculum',
                        name: 'Curriculum',
                        description: 'Access comprehensive curriculum materials for various academic programs',
                        icon: BookOpen,
                        component: CurriculumViewer,
                        featured: false,
                        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
                        color: 'emerald',
                        visible: true
                    },
                    {
                        id: 'important-links',
                        name: 'Important Links',
                        description: 'Access curated collection of important links and downloadable resources organized by categories',
                        icon: Link,
                        component: ImportantLinks,
                        featured: false,
                        gradient: 'from-indigo-500 via-purple-500 to-pink-500',
                        color: 'indigo',
                        visible: true
                    }
                ]);
                setActiveTab('gpa');
            }
        } catch (error) {
            console.error('Error fetching tools:', error);
            // Fallback tools
            setTools([
                {
                    id: 'gpa',
                    name: 'GPA Calculator',
                    description: 'Calculate your Grade Point Average for Njala University, FBC, and Every Nation College',
                    icon: Calculator,
                    component: GPACalculator,
                    featured: true,
                    gradient: 'from-violet-500 via-purple-500 to-pink-500',
                    color: 'violet',
                    visible: true
                },
                {
                    id: 'file-converter',
                    name: 'File Converter',
                    description: 'Convert and resize documents and images - PDF to Word, Image OCR, File compression and more',
                    icon: RefreshCw,
                    component: FileConverter,
                    featured: true,
                    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
                    color: 'cyan',
                    visible: true
                },
                {
                    id: 'curriculum',
                    name: 'Curriculum',
                    description: 'Access comprehensive curriculum materials for various academic programs',
                    icon: BookOpen,
                    component: CurriculumViewer,
                    featured: false,
                    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
                    color: 'emerald',
                    visible: true
                },
                {
                    id: 'important-links',
                    name: 'Important Links',
                    description: 'Access curated collection of important links and downloadable resources organized by categories',
                    icon: Link,
                    component: ImportantLinks,
                    featured: false,
                    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
                    color: 'indigo',
                    visible: true
                }
            ]);
            setActiveTab('gpa');
        } finally {
            setLoading(false);
        }
    };

    const featuredTool = tools.find(tool => tool.id === activeTab);

    // Stats for hero section
    const stats = [
        { label: 'Tools Available', value: `${tools.length}+` },
        { label: 'Active Users', value: '10K+' },
        { label: 'Files Processed', value: '50K+' },
        { label: 'Success Rate', value: '99%' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-24 relative overflow-hidden flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading Tools...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Enhanced Hero Section - Matching Portfolio/Team Style */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-24">
                <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-repeat bg-[length:60px_60px]"
                         style={{
                             backgroundImage: `radial-gradient(circle at 30px 30px, white 2px, transparent 2px)`
                         }}>
                    </div>
                </div>

                {/* Animated floating elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                    <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 text-white py-12 md:py-20">
                    <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600/20 backdrop-blur-sm rounded-full text-blue-200 text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-blue-400/20">
                        <Wrench className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Our Tools
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
                        Powerful Academic
                        <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                            & Career Tools
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto px-4">
                        Access premium tools designed for students and professionals. From GPA calculators to file converters, everything you need for academic and career success.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4">
                        <button
                            className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:scale-105 transition-all duration-300 group flex items-center justify-center"
                            onClick={() => tools.length > 0 && setActiveTab(tools[0].id)}
                        >
                            <Sparkles className="mr-3 h-6 w-6" />
                            Explore Tools
                            <ChevronRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg backdrop-blur-sm bg-white/5 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                            onClick={() => window.scrollTo({ top: document.querySelector('.tools-section')?.offsetTop || 0, behavior: 'smooth' })}
                        >
                            <Zap className="mr-3 h-6 w-6" />
                            View All Features
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto px-4">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-xs sm:text-sm text-blue-200 font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tools Navigation Section - Matching Portfolio/Team Style */}
            <section className="tools-section py-12 sm:py-16 md:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-black relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full bg-repeat bg-[length:40px_40px]"
                         style={{
                             backgroundImage: `radial-gradient(circle at 20px 20px, #60A5FA 1px, transparent 1px)`
                         }}>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-12 sm:mb-16">
                        <div className="inline-flex items-center px-4 py-2 bg-purple-600/20 backdrop-blur-sm rounded-full text-purple-300 text-sm font-medium mb-6 border border-purple-400/20">
                            <Wrench className="h-4 w-4 mr-2" />
                            Tool Categories
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
                            Choose Your Tool
                        </h2>
                        <p className="text-lg sm:text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                            Select from our collection of powerful tools designed to make your academic and professional life easier.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <div className="inline-flex flex-wrap gap-3 sm:gap-4 bg-white/10 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/20">
                            {tools.map(tool => {
                                const isActive = activeTab === tool.id;
                                return (
                                    <button
                                        key={tool.id}
                                        onClick={() => tool.component && setActiveTab(tool.id)}
                                        disabled={!tool.component}
                                        className={`group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap overflow-hidden ${
                                            isActive
                                                ? 'text-white shadow-xl'
                                                : tool.component
                                                    ? 'bg-white/10 text-gray-200 hover:bg-white/20'
                                                    : 'bg-white/5 text-gray-400 cursor-not-allowed'
                                        }`}
                                        style={isActive ? { background: `linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)` } : {}}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            <tool.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span>{tool.name}</span>
                                            {tool.featured && (
                                                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isActive ? 'bg-white/20 text-white' : 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black'}`}>
                                                    <Zap className="h-3 w-3" />
                                                    ELITE
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Tool Content Section */}
            <section className="relative z-10 py-16 sm:py-20 md:py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {featuredTool && featuredTool.component ? (
                        <div>
                            <div className="text-center mb-12">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-pink-900/30 p-8 rounded-full border border-blue-500/20">
                                        <featuredTool.icon className="w-16 h-16 text-blue-400" />
                                    </div>
                                </div>
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                                    {featuredTool.name}
                                </h2>
                                <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                                    {featuredTool.description}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br  rounded-3xl border border-gray-600 shadow-xl p-6 sm:p-8">
                                <featuredTool.component />
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto text-center">
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border border-gray-200 shadow-xl p-12 sm:p-16">
                                <div className="flex justify-center mb-8">
                                    <div className="bg-white p-8 rounded-full shadow-lg">
                                        <Wrench className="w-16 h-16 text-blue-600" />
                                    </div>
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                                    Tool Not Available
                                </h3>
                                <p className="text-gray-600 text-lg mb-8">
                                    This tool is currently not available. Please select another tool from the list above.
                                </p>
                                <button
                                    onClick={() => tools.length > 0 && tools[0].component && setActiveTab(tools[0].id)}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
                                >
                                    <Sparkles className="h-5 w-5" />
                                    Try Another Tool
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Tools;