import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, BookOpen, Award, TrendingUp, Info } from 'lucide-react';

// Grading systems configuration
const GRADING_SYSTEMS = {
    njala: {
        name: 'Njala University',
        type: '5-point',
        grades: {
            'A': { points: 5.0, range: '75-100' },
            'B': { points: 4.0, range: '64-74' },
            'C': { points: 3.0, range: '50-63' },
            'D': { points: 2.0, range: '40-49' },
            'E': { points: 1.0, range: '30-39' },
            'F': { points: 0.0, range: '0-29' },
            'I': { points: 0.0, range: 'Incomplete' }
        },
        promotionRules: {
            'Dean\'s List': { min: 4.30, max: 5.00 },
            'Promoted': { min: 3.00, max: 4.29 },
            'Repeat': { min: 2.80, max: 2.99 },
            'Dropped': { min: 0.00, max: 2.79 }
        },
        classification: {
            'First Class': { min: 4.30, max: 5.00 },
            'Second Class Upper': { min: 3.80, max: 4.29 },
            'Second Class Lower': { min: 3.60, max: 3.79 },
            'Third Class': { min: 3.00, max: 3.59 },
            'Fail': { min: 0.00, max: 2.99 }
        }
    },
    fbc: {
        name: 'FBC',
        type: '4-point',
        grades: {
            'A': { points: 4.0, range: '80-100' },
            'B+': { points: 3.6, range: '70-79' },
            'B': { points: 3.3, range: '65-69' },
            'B-': { points: 3.0, range: '60-64' },
            'C+': { points: 2.6, range: '55-59' },
            'C': { points: 2.3, range: '50-54' },
            'C-': { points: 2.0, range: '45-49' },
            'D': { points: 1.5, range: '40-44' },
            'F': { points: 0.0, range: 'Below 40' },
            'I': { points: 0.0, range: 'Incomplete' }
        },
        classification: {
            'First Class': { min: 3.60, max: 4.00 },
            'Second Class Upper': { min: 3.25, max: 3.59 },
            'Second Class Lower': { min: 2.60, max: 3.24 },
            'Third Class': { min: 2.00, max: 2.59 },
            'Pass': { min: 1.50, max: 1.99 },
            'Fail': { min: 0.00, max: 1.49 }
        }
    },
    everynation: {
        name: 'Every Nation College',
        type: '5-point',
        grades: {
            'A': { points: 5.0, range: '75-100' },
            'B': { points: 4.0, range: '64-74' },
            'C': { points: 3.0, range: '50-63' },
            'D': { points: 2.0, range: '40-49' },
            'E': { points: 1.0, range: '30-39' },
            'F': { points: 0.0, range: '0-29' },
            'I': { points: 0.0, range: 'Incomplete' }
        },
        classification: {
            'First Class': { min: 4.20, max: 5.00 },
            'Second Class Upper': { min: 3.80, max: 4.19 },
            'Second Class Lower': { min: 3.60, max: 3.79 },
            'Third Class': { min: 3.00, max: 3.59 },
            'Fail': { min: 0.00, max: 2.99 }
        }
    }
};

const GPACalculator = () => {
    // State management
    const [selectedSystem, setSelectedSystem] = useState('njala');
    const [courses, setCourses] = useState([{ credits: 3, grade: '', courseName: '' }]);
    const [uniformCredits, setUniformCredits] = useState(true);
    const [uniformCreditValue, setUniformCreditValue] = useState(3);
    const [results, setResults] = useState(null);
    const [inputMethod, setInputMethod] = useState('manual'); // 'manual', 'shorthand', or 'guided'
    const [shorthandInput, setShorthandInput] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [numberOfGrades, setNumberOfGrades] = useState(5);
    const [guidedSetupComplete, setGuidedSetupComplete] = useState(false);

    // Parse shorthand input (e.g., "3A, 4B, 2C" or "34C, 3A" for grouped modules)
    const parseShorthandInput = (input) => {
        if (!input.trim()) return [];

        const entries = input.split(',').map(entry => entry.trim().toUpperCase());
        const parsedCourses = [];

        entries.forEach(entry => {
            // Match patterns like "34C" (3 credits × 4 modules with grade C) or "3A" (3 modules with grade A)
            const groupedMatch = entry.match(/^(\d+)(\d+)([A-F]|[A-F][+-]?|I)$/);
            const simpleMatch = entry.match(/^(\d+)([A-F]|[A-F][+-]?|I)$/);

            if (groupedMatch) {
                // Format: 34C means 3 credit hours for 4 modules with grade C
                const [, creditHours, moduleCount, grade] = groupedMatch;
                const credits = parseInt(creditHours);
                const modules = parseInt(moduleCount);

                // Add multiple courses with the same credit hours and grade
                for (let i = 0; i < modules; i++) {
                    parsedCourses.push({
                        credits: credits,
                        grade: grade,
                        courseName: `Module ${parsedCourses.length + 1} (${credits}cr ${grade})`
                    });
                }
            } else if (simpleMatch) {
                const [, number, grade] = simpleMatch;
                const num = parseInt(number);

                if (uniformCredits) {
                    // When uniform credits is enabled, number always represents module count
                    for (let i = 0; i < num; i++) {
                        parsedCourses.push({
                            credits: uniformCreditValue,
                            grade: grade,
                            courseName: `Module ${parsedCourses.length + 1} (${uniformCreditValue}cr ${grade})`
                        });
                    }
                } else {
                    // When uniform credits is disabled, interpret based on number size
                    if (num <= 6) {
                        // Likely credit hours (1-6 range)
                        parsedCourses.push({
                            credits: num,
                            grade: grade,
                            courseName: `Course ${parsedCourses.length + 1} (${num}cr ${grade})`
                        });
                    } else {
                        // Likely module count, use default 3 credits
                        for (let i = 0; i < num; i++) {
                            parsedCourses.push({
                                credits: 3,
                                grade: grade,
                                courseName: `Module ${parsedCourses.length + 1} (3cr ${grade})`
                            });
                        }
                    }
                }
            }
        });

        return parsedCourses;
    };

    // Handle shorthand input change
    const handleShorthandChange = (input) => {
        setShorthandInput(input);
        const parsedCourses = parseShorthandInput(input);
        if (parsedCourses.length > 0) {
            setCourses(parsedCourses);
        }
    };

    // Generate guided courses based on number of grades
    const generateGuidedCourses = () => {
        const newCourses = [];
        for (let i = 0; i < numberOfGrades; i++) {
            newCourses.push({
                credits: uniformCredits ? uniformCreditValue : 3,
                grade: '',
                courseName: `Course ${i + 1}`
            });
        }
        setCourses(newCourses);
        setGuidedSetupComplete(true);
    };

    // Reset guided setup
    const resetGuidedSetup = () => {
        setGuidedSetupComplete(false);
        setNumberOfGrades(5);
    };

    // Handle input method change
    const handleInputMethodChange = (method) => {
        setInputMethod(method);
        // Reset states when switching methods
        if (method === 'guided') {
            setGuidedSetupComplete(false);
        } else if (method === 'manual') {
            setCourses([{ credits: 3, grade: '', courseName: '' }]);
        } else if (method === 'shorthand') {
            setShorthandInput('');
        }
    };

    // Add new course
    const addCourse = () => {
        setCourses([...courses, { 
            credits: uniformCredits ? uniformCreditValue : 3, 
            grade: '', 
            courseName: `Course ${courses.length + 1}` 
        }]);
    };

    // Remove course
    const removeCourse = (index) => {
        if (courses.length > 1) {
            setCourses(courses.filter((_, i) => i !== index));
        }
    };

    // Update course data
    const updateCourse = (index, field, value) => {
        const updated = [...courses];
        updated[index][field] = value;
        setCourses(updated);
    };

    // Calculate GPA
    const calculateGPA = () => {
        const system = GRADING_SYSTEMS[selectedSystem];
        let totalCredits = 0;
        let totalQualityPoints = 0;

        courses.forEach(course => {
            const credits = uniformCredits ? uniformCreditValue : course.credits;
            const grade = course.grade.toUpperCase();
            
            if (grade && system.grades[grade]) {
                totalCredits += credits;
                totalQualityPoints += credits * system.grades[grade].points;
            }
        });

        const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

        // Get classification
        let classification = 'Not Classified';
        let promotionStatus = null;

        for (const [key, range] of Object.entries(system.classification)) {
            if (gpa >= range.min && gpa <= range.max) {
                classification = key;
                break;
            }
        }

        // Get promotion status for Njala
        if (selectedSystem === 'njala' && system.promotionRules) {
            for (const [key, range] of Object.entries(system.promotionRules)) {
                if (gpa >= range.min && gpa <= range.max) {
                    promotionStatus = key;
                    break;
                }
            }
        }

        setResults({
            totalCredits,
            totalQualityPoints,
            gpa: parseFloat(gpa.toFixed(2)),
            classification,
            promotionStatus
        });
    };

    // Auto-calculate when courses or settings change
    useEffect(() => {
        calculateGPA();
    }, [courses, selectedSystem, uniformCredits, uniformCreditValue]);

    const currentSystem = GRADING_SYSTEMS[selectedSystem];

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <Calculator className="w-8 h-8 text-blue-600" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">GPA Calculator</h2>
                        <p className="text-gray-600">Calculate your Grade Point Average for multiple institutions</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Institution Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Institution
                    </label>
                    <select
                        value={selectedSystem}
                        onChange={(e) => setSelectedSystem(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {Object.entries(GRADING_SYSTEMS).map(([key, system]) => (
                            <option key={key} value={key}>
                                {system.name} ({system.type} system)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Grading Scale Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        {currentSystem.name} Grading Scale
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                        {Object.entries(currentSystem.grades).map(([grade, info]) => (
                            <div key={grade} className="flex justify-between">
                                <span className="font-medium">{grade}:</span>
                                <span>{info.points} pts</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Input Method Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Input Method
                    </label>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="guided"
                                checked={inputMethod === 'guided'}
                                onChange={(e) => handleInputMethodChange(e.target.value)}
                                className="mr-2"
                            />
                            Guided Setup
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="manual"
                                checked={inputMethod === 'manual'}
                                onChange={(e) => handleInputMethodChange(e.target.value)}
                                className="mr-2"
                            />
                            Manual Entry
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="shorthand"
                                checked={inputMethod === 'shorthand'}
                                onChange={(e) => handleInputMethodChange(e.target.value)}
                                className="mr-2"
                            />
                            Shorthand Entry
                        </label>
                    </div>
                </div>

                {/* Guided Setup */}
                {inputMethod === 'guided' && (
                    <div className="space-y-4">
                        {!guidedSetupComplete ? (
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                                    Guided GPA Setup
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Tell us how many grades you want to calculate, and we'll create the perfect input form for you.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            How many grades do you want to check?
                                        </label>
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="number"
                                                min="1"
                                                max="50"
                                                value={numberOfGrades}
                                                onChange={(e) => setNumberOfGrades(parseInt(e.target.value) || 1)}
                                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                                            />
                                            <span className="text-gray-600">courses/modules</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Enter a number between 1 and 50
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Credit Hours Configuration
                                        </label>
                                        <div className="space-y-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={uniformCredits}
                                                    onChange={() => setUniformCredits(true)}
                                                    className="mr-2"
                                                />
                                                All courses have the same credit hours
                                            </label>
                                            {uniformCredits && (
                                                <div className="ml-6">
                                                    <select
                                                        value={uniformCreditValue}
                                                        onChange={(e) => setUniformCreditValue(parseInt(e.target.value))}
                                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {[1, 2, 3, 4, 5, 6].map(num => (
                                                            <option key={num} value={num}>{num} credit hours each</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={!uniformCredits}
                                                    onChange={() => setUniformCredits(false)}
                                                    className="mr-2"
                                                />
                                                Different credit hours per course
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        onClick={generateGuidedCourses}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium"
                                    >
                                        Generate {numberOfGrades} Course Input{numberOfGrades > 1 ? 's' : ''}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                                <div>
                                    <h4 className="font-medium text-gray-900">Setup Complete!</h4>
                                    <p className="text-sm text-gray-600">
                                        {numberOfGrades} courses generated with {uniformCredits ? `${uniformCreditValue} credit hours each` : 'individual credit hours'}
                                    </p>
                                </div>
                                <button
                                    onClick={resetGuidedSetup}
                                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Change Setup
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Shorthand Input */}
                {inputMethod === 'shorthand' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter Grades in Shorthand Format
                        </label>
                        <input
                            type="text"
                            value={shorthandInput}
                            onChange={(e) => handleShorthandChange(e.target.value)}
                            placeholder={uniformCredits
                                ? `Example: 3A, 5B, 2C (Using ${uniformCreditValue} credit hours each)`
                                : "Example: 34C, 3A, 25B (Grouped or individual format)"
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => setShowInstructions(!showInstructions)}
                                className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none"
                            >
                                {showInstructions ? 'Hide' : 'Show'} Detailed Instructions
                            </button>

                            {showInstructions && (
                                <div className="mt-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                    <h4 className="font-semibold text-blue-900 mb-3">Grouped Credit Hours & Grade Entry Instructions</h4>

                                    <div className="text-sm text-blue-800 space-y-3">
                                        {uniformCredits ? (
                                            <div>
                                                <h5 className="font-medium">🎯 Uniform Credit Hours Mode (Currently: {uniformCreditValue} credits each)</h5>
                                                <ul className="list-disc list-inside ml-2 space-y-1">
                                                    <li><code>3A</code> = 3 modules with grade A (each worth {uniformCreditValue} credit hours)</li>
                                                    <li><code>5B</code> = 5 modules with grade B (each worth {uniformCreditValue} credit hours)</li>
                                                    <li><code>2C</code> = 2 modules with grade C (each worth {uniformCreditValue} credit hours)</li>
                                                </ul>
                                                <p className="text-xs text-blue-600 mt-2">
                                                    ✨ Since all courses use {uniformCreditValue} credit hours, just enter [ModuleCount][Grade]
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <h5 className="font-medium">📚 Grouped Format: [CreditHours][ModuleCount][Grade]</h5>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><code>34C</code> = 3 credit hours × 4 modules with grade C each</li>
                                                        <li><code>25A</code> = 2 credit hours × 5 modules with grade A each</li>
                                                        <li><code>46B</code> = 4 credit hours × 6 modules with grade B each</li>
                                                    </ul>
                                                </div>

                                                <div>
                                                    <h5 className="font-medium">🎯 Individual Format: [Number][Grade]</h5>
                                                    <ul className="list-disc list-inside ml-2 space-y-1">
                                                        <li><code>3A</code> = 3 credit hours with grade A (if number ≤ 6)</li>
                                                        <li><code>12B</code> = 12 modules with grade B using 3 credit hours each (if number &gt; 6)</li>
                                                        <li><code>4C</code> = 4 credit hours with grade C</li>
                                                    </ul>
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <h5 className="font-medium">✨ Benefits for Accurate Calculation:</h5>
                                            <ul className="list-disc list-inside ml-2 space-y-1">
                                                <li><strong>Correct Cumulative Credit Hours:</strong> Automatically calculates total credits across all modules</li>
                                                <li><strong>Accurate Quality Points:</strong> Properly weighs each grade by its credit hours</li>
                                                <li><strong>Mixed Entry Support:</strong> Combine different formats in one calculation</li>
                                                <li><strong>Time Saving:</strong> Enter multiple modules with same grade quickly</li>
                                            </ul>
                                        </div>

                                        <div className="bg-white p-3 rounded border">
                                            <h5 className="font-medium text-green-700">💡 Example Calculation:</h5>
                                            <p className="text-sm mt-1">
                                                {uniformCredits ? (
                                                    <>
                                                        Input: <code>3A, 5B, 2C</code> (with {uniformCreditValue} credit hours each)<br/>
                                                        Means: (3 modules×{uniformCreditValue}cr×A) + (5 modules×{uniformCreditValue}cr×B) + (2 modules×{uniformCreditValue}cr×C)<br/>
                                                        Total: {3 * uniformCreditValue}cr + {5 * uniformCreditValue}cr + {2 * uniformCreditValue}cr = {(3 + 5 + 2) * uniformCreditValue} credit hours<br/>
                                                        Simple and accurate since credit hours are already set!
                                                    </>
                                                ) : (
                                                    <>
                                                        Input: <code>34C, 3A, 25B</code><br/>
                                                        Means: (3cr×4modules=C) + (3cr×1module=A) + (2cr×5modules=B)<br/>
                                                        Total: 12cr + 3cr + 10cr = 25 credit hours<br/>
                                                        This ensures precise GPA calculation with correct weighting.
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Credit Hours Setting */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Credit Hours Configuration
                    </label>
                    <div className="space-y-3">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                checked={uniformCredits}
                                onChange={() => setUniformCredits(true)}
                                className="mr-2"
                            />
                            All courses have the same credit hours
                        </label>
                        {uniformCredits && (
                            <div className="ml-6">
                                <select
                                    value={uniformCreditValue}
                                    onChange={(e) => setUniformCreditValue(parseInt(e.target.value))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(num => (
                                        <option key={num} value={num}>{num} credit hours</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <label className="flex items-center">
                            <input
                                type="radio"
                                checked={!uniformCredits}
                                onChange={() => setUniformCredits(false)}
                                className="mr-2"
                            />
                            Different credit hours per course
                        </label>
                    </div>
                </div>

                {/* Course Entry (Manual & Guided) */}
                {(inputMethod === 'manual' || (inputMethod === 'guided' && guidedSetupComplete)) && (
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {inputMethod === 'guided' ? `Enter Grades for ${numberOfGrades} Courses` : 'Courses'}
                            </h3>
                            {inputMethod === 'manual' && (
                                <button
                                    onClick={addCourse}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Course
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {courses.map((course, index) => (
                                <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={course.courseName}
                                            onChange={(e) => updateCourse(index, 'courseName', e.target.value)}
                                            placeholder={`Course ${index + 1}`}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    {!uniformCredits && (
                                        <div>
                                            <select
                                                value={course.credits}
                                                onChange={(e) => updateCourse(index, 'credits', parseInt(e.target.value))}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {[1, 2, 3, 4, 5, 6].map(num => (
                                                    <option key={num} value={num}>{num}cr</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <select
                                            value={course.grade}
                                            onChange={(e) => updateCourse(index, 'grade', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Grade</option>
                                            {Object.keys(currentSystem.grades).map(grade => (
                                                <option key={grade} value={grade}>
                                                    {grade} ({currentSystem.grades[grade].points})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {(inputMethod === 'manual' && courses.length > 1) && (
                                        <button
                                            onClick={() => removeCourse(index)}
                                            className="p-2 text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results */}
                {results && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2" />
                            Results
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{results.totalCredits}</div>
                                <div className="text-sm text-gray-600">Total Credit Hours</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{results.totalQualityPoints.toFixed(1)}</div>
                                <div className="text-sm text-gray-600">Quality Points</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">{results.gpa}</div>
                                <div className="text-sm text-gray-600">GPA</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-orange-600">{results.classification}</div>
                                <div className="text-sm text-gray-600">Classification</div>
                            </div>
                        </div>

                        {results.promotionStatus && (
                            <div className="text-center p-4 bg-white rounded-lg">
                                <div className="flex items-center justify-center">
                                    <Award className="w-5 h-5 mr-2 text-yellow-600" />
                                    <span className="text-lg font-semibold text-gray-900">
                                        Promotion Status: <span className="text-yellow-600">{results.promotionStatus}</span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Help Text */}
                <div className="text-sm text-gray-500">
                    <p>
                        <strong>Note:</strong> This calculator provides estimated results based on the grading systems. 
                        For official transcripts and degree classification, please consult your institution's registrar.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GPACalculator;