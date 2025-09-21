import React, { useState, useEffect } from 'react';
import { Calculator, BookOpen, TrendingUp, Wrench, ChevronRight, FileText, RefreshCw, Sparkles, Zap, Star } from 'lucide-react';
import GPACalculator from '../tools/GPACalculator';
import FileConverter from '../tools/FileConverter';

const Tools = () => {
    const [activeTab, setActiveTab] = useState('gpa');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const tools = [
        {
            id: 'gpa',
            name: 'GPA Calculator',
            description: 'Calculate your Grade Point Average for Njala University, FBC, and Every Nation College',
            icon: Calculator,
            component: GPACalculator,
            featured: true,
            gradient: 'from-violet-500 via-purple-500 to-pink-500',
            color: 'violet'
        },
        {
            id: 'file-converter',
            name: 'File Converter',
            description: 'Convert and resize documents and images - PDF to Word, Image OCR, File compression and more',
            icon: RefreshCw,
            component: FileConverter,
            featured: true,
            gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
            color: 'cyan'
        },
        {
            id: 'upcoming',
            name: 'More Tools Coming Soon',
            description: 'We\'re working on additional academic tools to help you succeed',
            icon: Wrench,
            component: null,
            featured: false,
            gradient: 'from-gray-500 via-gray-400 to-gray-300',
            color: 'gray'
        }
    ];

    const featuredTool = tools.find(tool => tool.id === activeTab);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
            </div>

            {/* Hero Section */}
            <section className="relative z-10">
                <div className="container mx-auto px-4 py-20">
                    <div className={`text-center transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <div className="flex justify-center mb-8">
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                                <div className="relative p-6 bg-black bg-opacity-50 backdrop-blur-lg rounded-full border border-white/20 shadow-2xl">
                                    <Sparkles className="w-16 h-16 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400" fill="url(#sparkleGradient)" />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-cyan-200 tracking-tight">
                            Elite Digital Tools
                        </h1>
                        <div className="flex justify-center items-center gap-2 mb-8">
                            <Star className="w-6 h-6 text-yellow-400 fill-current" />
                            <span className="text-yellow-400 font-semibold">Premium Experience</span>
                            <Star className="w-6 h-6 text-yellow-400 fill-current" />
                        </div>
                        <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-4xl mx-auto leading-relaxed">
                            Experience next-generation tools designed for excellence. Academic precision meets professional-grade performance.
                        </p>
                    </div>
                </div>
            </section>

            {/* SVG Gradients */}
            <svg className="absolute inset-0" style={{ width: 0, height: 0 }}>
                <defs>
                    <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Tools Navigation */}
            <section className="relative z-10 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap gap-6 justify-center">
                        {tools.map((tool, index) => (
                            <div
                                key={tool.id}
                                className={`transition-all duration-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                                style={{ transitionDelay: `${index * 200}ms` }}
                            >
                                <button
                                    onClick={() => setActiveTab(tool.id)}
                                    disabled={!tool.component}
                                    className={`
                                        group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105
                                        ${activeTab === tool.id
                                            ? `bg-gradient-to-r ${tool.gradient} text-white shadow-2xl shadow-${tool.color}-500/25`
                                            : tool.component
                                                ? 'bg-black/30 backdrop-blur-lg text-white border border-white/20 hover:bg-black/40 hover:border-white/30'
                                                : 'bg-gray-800/30 backdrop-blur-lg text-gray-400 border border-gray-600/20 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    <div className="flex items-center relative z-10">
                                        <div className={`p-2 rounded-lg mr-3 ${activeTab === tool.id ? 'bg-white/20' : 'bg-white/10'}`}>
                                            <tool.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-bold tracking-wide">{tool.name}</span>
                                        {tool.featured && (
                                            <div className="ml-3 flex items-center">
                                                <Zap className="w-4 h-4 text-yellow-400 mr-1" />
                                                <span className="px-2 py-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-black rounded-full font-black">
                                                    ELITE
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Hover Effect */}
                                    <div className={`absolute inset-0 bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>

                                    {/* Active Glow */}
                                    {activeTab === tool.id && (
                                        <div className={`absolute -inset-1 bg-gradient-to-r ${tool.gradient} rounded-2xl blur opacity-50 animate-pulse`}></div>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tool Content */}
            <section className="relative z-10 py-16">
                <div className="container mx-auto px-4">
                    {featuredTool && featuredTool.component ? (
                        <div className="max-w-6xl mx-auto">
                            <div className={`text-center mb-12 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        <div className={`absolute -inset-2 bg-gradient-to-r ${featuredTool.gradient} rounded-full blur opacity-60 animate-pulse`}></div>
                                        <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                            <featuredTool.icon className="w-12 h-12 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                                    {featuredTool.name}
                                </h2>
                                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                    {featuredTool.description}
                                </p>
                            </div>
                            <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
                                <featuredTool.component />
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto text-center">
                            <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-16 relative overflow-hidden">
                                {/* Background Decoration */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-full blur-xl"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-center mb-8">
                                        <div className="relative group">
                                            <div className="absolute -inset-4 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
                                            <div className="relative p-6 bg-black/50 backdrop-blur-lg rounded-full border border-white/20">
                                                <Wrench className="w-16 h-16 text-gray-300" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-black text-white mb-6">
                                        Elite Tools in Development
                                    </h3>
                                    <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                                        Revolutionary academic tools engineered for peak performance.
                                        The future of productivity is coming soon.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                        {[
                                            { icon: BookOpen, name: 'AI Course Planner', desc: 'Intelligent scheduling' },
                                            { icon: TrendingUp, name: 'Performance Analytics', desc: 'Advanced insights' },
                                            { icon: Calculator, name: 'Grade Predictor', desc: 'Future forecasting' },
                                            { icon: Zap, name: 'Quick Notes AI', desc: 'Smart documentation' },
                                            { icon: Star, name: 'Achievement Tracker', desc: 'Goal management' },
                                            { icon: FileText, name: 'Smart Templates', desc: 'Professional formats' }
                                        ].map((item, index) => (
                                            <div
                                                key={index}
                                                className="group bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105"
                                            >
                                                <div className="flex items-center mb-3">
                                                    <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg mr-3">
                                                        <item.icon className="w-5 h-5 text-purple-300" />
                                                    </div>
                                                    <span className="font-bold text-white text-sm">{item.name}</span>
                                                </div>
                                                <p className="text-gray-400 text-sm">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Features Overview */}
            <section className="relative py-20 bg-gradient-to-b from-slate-900 to-black overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className={`text-center mb-16 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-cyan-200">
                            Elite Performance Standards
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            Engineered for excellence. Our premium tools deliver professional-grade performance
                            for the most demanding academic and professional workflows.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Calculator,
                                title: 'Precision Engineering',
                                description: 'Military-grade accuracy in GPA calculations using verified grading systems from Sierra Leone\'s premier educational institutions.',
                                gradient: 'from-violet-500 to-purple-500',
                                delay: '0ms'
                            },
                            {
                                icon: FileText,
                                title: 'Enterprise Processing',
                                description: 'Professional-grade document conversion, OCR extraction, and compression powered by cutting-edge algorithms.',
                                gradient: 'from-cyan-500 to-blue-500',
                                delay: '200ms'
                            },
                            {
                                icon: TrendingUp,
                                title: 'Performance Optimization',
                                description: 'Lightning-fast execution with enterprise security protocols designed for mission-critical academic workflows.',
                                gradient: 'from-pink-500 to-rose-500',
                                delay: '400ms'
                            }
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className={`group transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
                                style={{ transitionDelay: feature.delay }}
                            >
                                <div className="relative bg-black/30 backdrop-blur-xl rounded-3xl border border-white/10 p-8 h-full hover:border-white/20 transition-all duration-500 group-hover:transform group-hover:scale-105">
                                    {/* Card Glow Effect */}
                                    <div className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>

                                    <div className="relative z-10">
                                        <div className="flex justify-center mb-6">
                                            <div className="relative">
                                                <div className={`absolute -inset-3 bg-gradient-to-r ${feature.gradient} rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-500`}></div>
                                                <div className="relative p-4 bg-black/50 backdrop-blur-lg rounded-2xl border border-white/20">
                                                    <feature.icon className="w-10 h-10 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-4 text-center">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-300 leading-relaxed text-center">
                                            {feature.description}
                                        </p>

                                        {/* Elite Badge */}
                                        <div className="flex justify-center mt-6">
                                            <div className={`px-4 py-2 bg-gradient-to-r ${feature.gradient} rounded-full`}>
                                                <div className="flex items-center">
                                                    <Sparkles className="w-4 h-4 text-white mr-2" />
                                                    <span className="text-white font-bold text-sm">ELITE GRADE</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Tools;