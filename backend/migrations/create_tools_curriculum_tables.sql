-- Create Tools Configuration Table
CREATE TABLE IF NOT EXISTS tools_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Wrench',
    component VARCHAR(255),
    visible BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    gradient VARCHAR(255) DEFAULT 'from-gray-500 via-gray-400 to-gray-300',
    color VARCHAR(50) DEFAULT 'gray',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Curriculum Categories Table
CREATE TABLE IF NOT EXISTS curriculum_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'BookOpen',
    color VARCHAR(50) DEFAULT 'blue',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Curriculum Subjects Table
CREATE TABLE IF NOT EXISTS curriculum_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    credit_hours INT,
    prerequisites TEXT,
    learning_outcomes TEXT,
    assessment_methods TEXT,
    file_path VARCHAR(500),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES curriculum_categories(id) ON DELETE CASCADE
);

-- Insert Default Tools Configuration
INSERT INTO tools_config (name, description, icon, component, visible, display_order, gradient, color, featured) VALUES
('GPA Calculator', 'Calculate your Grade Point Average for Njala University, FBC, and Every Nation College', 'Calculator', 'GPACalculator', TRUE, 1, 'from-violet-500 via-purple-500 to-pink-500', 'violet', TRUE),
('File Converter', 'Convert and resize documents and images - PDF to Word, Image OCR, File compression and more', 'RefreshCw', 'FileConverter', TRUE, 2, 'from-cyan-500 via-blue-500 to-indigo-500', 'cyan', TRUE),
('Curriculum', 'Download academic curriculum for various modules and subjects', 'BookOpen', 'CurriculumViewer', TRUE, 3, 'from-emerald-500 via-green-500 to-teal-500', 'emerald', TRUE);

-- Insert Default Curriculum Categories
INSERT INTO curriculum_categories (name, description, icon, color, display_order) VALUES
('Computer Science', 'Software engineering, programming, and computer systems courses', 'Monitor', 'blue', 1),
('Business Administration', 'Management, accounting, marketing, and business strategy courses', 'Briefcase', 'green', 2),
('Engineering', 'Civil, electrical, mechanical, and other engineering disciplines', 'Cog', 'orange', 3),
('Health Sciences', 'Medicine, nursing, pharmacy, and health-related programs', 'Heart', 'red', 4),
('Education', 'Teaching methodologies, educational psychology, and pedagogy', 'GraduationCap', 'purple', 5),
('Arts & Humanities', 'Literature, history, philosophy, and cultural studies', 'Palette', 'pink', 6);

-- Insert Sample Curriculum Subjects
INSERT INTO curriculum_subjects (category_id, name, code, description, credit_hours, prerequisites, learning_outcomes, assessment_methods, display_order) VALUES
-- Computer Science Subjects
(1, 'Introduction to Programming', 'CS101', 'Fundamentals of programming using Python and algorithmic thinking', 3, 'None', 'Understand basic programming concepts, write simple programs, debug code', 'Assignments (40%), Midterm (25%), Final Project (35%)', 1),
(1, 'Data Structures and Algorithms', 'CS201', 'Study of fundamental data structures and algorithm design techniques', 4, 'CS101', 'Implement various data structures, analyze algorithm complexity, solve computational problems', 'Coding Assignments (50%), Midterm (20%), Final Exam (30%)', 2),
(1, 'Database Systems', 'CS301', 'Design and implementation of database management systems', 3, 'CS201', 'Design relational databases, write SQL queries, understand database normalization', 'Database Project (45%), Quizzes (25%), Final Exam (30%)', 3),
(1, 'Software Engineering', 'CS401', 'Software development lifecycle, project management, and team collaboration', 4, 'CS301', 'Apply software engineering principles, work in teams, manage software projects', 'Group Project (60%), Individual Assignments (25%), Presentation (15%)', 4),

-- Business Administration Subjects
(2, 'Principles of Management', 'BA101', 'Introduction to management theories and organizational behavior', 3, 'None', 'Understand management principles, analyze organizational structures, develop leadership skills', 'Case Studies (40%), Midterm (30%), Final Exam (30%)', 1),
(2, 'Financial Accounting', 'BA201', 'Fundamentals of financial accounting and reporting', 3, 'BA101', 'Prepare financial statements, understand accounting principles, analyze financial data', 'Homework (30%), Midterm (30%), Final Exam (40%)', 2),
(2, 'Marketing Management', 'BA301', 'Consumer behavior, market research, and marketing strategy development', 3, 'BA201', 'Develop marketing strategies, analyze consumer behavior, create marketing campaigns', 'Marketing Plan (50%), Midterm (25%), Final Exam (25%)', 3),
(2, 'Strategic Management', 'BA401', 'Corporate strategy, competitive analysis, and strategic planning', 4, 'BA301', 'Formulate business strategies, conduct competitive analysis, make strategic decisions', 'Strategic Analysis (45%), Group Project (35%), Final Exam (20%)', 4),

-- Engineering Subjects
(3, 'Engineering Mathematics', 'ENG101', 'Advanced calculus, differential equations, and linear algebra for engineers', 4, 'Pre-calculus', 'Master mathematical concepts for engineering, solve complex equations, apply mathematical models', 'Homework (20%), Midterm (35%), Final Exam (45%)', 1),
(3, 'Engineering Physics', 'ENG201', 'Physics principles applied to engineering problems', 4, 'ENG101', 'Apply physics laws to engineering, understand mechanics and thermodynamics, solve practical problems', 'Lab Reports (30%), Midterm (30%), Final Exam (40%)', 2),
(3, 'Materials Science', 'ENG301', 'Properties and applications of engineering materials', 3, 'ENG201', 'Understand material properties, select appropriate materials, design with materials constraints', 'Lab Work (35%), Project (40%), Final Exam (25%)', 3),
(3, 'Design Engineering', 'ENG401', 'Engineering design process, CAD, and project management', 4, 'ENG301', 'Apply design methodologies, use CAD software, manage engineering projects', 'Design Project (60%), CAD Assignments (25%), Presentation (15%)', 4);