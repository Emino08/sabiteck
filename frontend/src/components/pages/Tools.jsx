import React, { useState } from 'react';
import { Calculator, BookOpen, TrendingUp, Wrench, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import GPACalculator from '../tools/GPACalculator';
import FileConverter from '../tools/FileConverter';

const Tools = () => {
    const [activeTab, setActiveTab] = useState('gpa');

    const tools = [
        {
            id: 'gpa',
            name: 'GPA Calculator',
            description: 'Calculate your Grade Point Average for Njala University, FBC, and Every Nation College',
            icon: Calculator,
            component: GPACalculator,
            featured: true
        },
        {
            id: 'file-converter',
            name: 'File Converter',
            description: 'Convert and resize documents and images - PDF to Word, Image OCR, File compression and more',
            icon: RefreshCw,
            component: FileConverter,
            featured: true
        },
        {
            id: 'upcoming',
            name: 'More Tools Coming Soon',
            description: 'We\'re working on additional academic tools to help you succeed',
            icon: Wrench,
            component: null,
            featured: false
        }
    ];

    const featuredTool = tools.find(tool => tool.id === activeTab);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-white bg-opacity-20 rounded-full">
                                <BookOpen className="w-12 h-12" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Digital Tools
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                            Powerful tools to help you with academic progress, document conversion, and productivity tasks
                        </p>
                    </div>
                </div>
            </section>

            {/* Tools Navigation */}
            <section className="py-8 bg-white shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTab(tool.id)}
                                disabled={!tool.component}
                                className={`
                                    flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200
                                    ${activeTab === tool.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : tool.component 
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                <tool.icon className="w-5 h-5 mr-2" />
                                {tool.name}
                                {tool.featured && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                                        New
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tool Content */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    {featuredTool && featuredTool.component ? (
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                    {featuredTool.name}
                                </h2>
                                <p className="text-gray-600 max-w-2xl mx-auto">
                                    {featuredTool.description}
                                </p>
                            </div>
                            <featuredTool.component />
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="bg-white rounded-lg shadow-sm border p-12">
                                <div className="flex justify-center mb-6">
                                    <div className="p-4 bg-gray-100 rounded-full">
                                        <Wrench className="w-12 h-12 text-gray-400" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    More Tools Coming Soon
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    We're constantly working on new academic tools to help you succeed. 
                                    Stay tuned for more features including:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                                    <div className="flex items-center">
                                        <ChevronRight className="w-4 h-4 text-blue-600 mr-2" />
                                        <span>Course Planning Tools</span>
                                    </div>
                                    <div className="flex items-center">
                                        <ChevronRight className="w-4 h-4 text-blue-600 mr-2" />
                                        <span>Study Schedule Generator</span>
                                    </div>
                                    <div className="flex items-center">
                                        <ChevronRight className="w-4 h-4 text-blue-600 mr-2" />
                                        <span>Grade Tracker</span>
                                    </div>
                                    <div className="flex items-center">
                                        <ChevronRight className="w-4 h-4 text-blue-600 mr-2" />
                                        <span>Text-to-Speech Generator</span>
                                    </div>
                                    <div className="flex items-center">
                                        <ChevronRight className="w-4 h-4 text-blue-600 mr-2" />
                                        <span>QR Code Generator</span>
                                    </div>
                                    <div className="flex items-center">
                                        <ChevronRight className="w-4 h-4 text-blue-600 mr-2" />
                                        <span>Password Generator</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Features Overview */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Why Use Our Digital Tools?
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Our comprehensive suite of tools helps students, professionals, and businesses
                            with productivity, document management, and academic tracking needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Calculator className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Academic Tools
                            </h3>
                            <p className="text-gray-600">
                                Precise GPA calculations using official grading systems from
                                Sierra Leone's leading universities and institutions.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <FileText className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Document Processing
                            </h3>
                            <p className="text-gray-600">
                                Convert PDFs to Word, extract text with OCR, resize images,
                                and compress files with professional-grade tools.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <TrendingUp className="w-8 h-8 text-purple-600" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Productivity Focus
                            </h3>
                            <p className="text-gray-600">
                                Streamline your workflow with fast, secure, and reliable tools
                                designed for students and professionals.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Tools;