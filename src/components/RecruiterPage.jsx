import React, { useState, useEffect } from 'react';
import './RecruiterPage.css';
import apiService from '../services/apiService';

const RecruiterPage = ({ user, onLogout }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', requirements: '' });
    const [successMessage, setSuccessMessage] = useState('');

    const [selectedJobId, setSelectedJobId] = useState(null);
    const [rankings, setRankings] = useState([]);
    const [loadingRankings, setLoadingRankings] = useState(false);
    const [rankingsError, setRankingsError] = useState('');

    useEffect(() => {
        loadJobs();
    }, []);

    useEffect(() => {
        if (selectedJobId) {
            loadRankings(selectedJobId);
        }
    }, [selectedJobId]);

    const loadJobs = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await apiService.getJobs();
            if (response.success) {
                setJobs(response.jobs || []);
            } else {
                setError(response.message || 'Failed to load jobs');
            }
        } catch (err) {
            setError('Network error occurred');
            console.error('Error loading jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRankings = async (jobId) => {
        try {
            setLoadingRankings(true);
            setRankingsError('');
            const response = await apiService.getRankingsForJob(jobId);
            if (response.success) {
                setRankings(response.rankings || []);
            } else {
                setRankingsError(response.message || 'Failed to load rankings');
            }
        } catch (err) {
            setRankingsError('Network error occurred');
            console.error('Error loading rankings:', err);
        } finally {
            setLoadingRankings(false);
        }
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.description.trim()) {
            setError('Title and description are required');
            return;
        }

        try {
            setError('');

            const newJob = {
                title: formData.title.trim(),
                fullText: `${formData.description}\n\nRequirements:\n${formData.requirements}`
            };

            const response = await apiService.createJobDescription(newJob.title, newJob.fullText);

            if (response.success) {
                setJobs(prevJobs => [...prevJobs, response.job]);
                setShowForm(false);
                setFormData({ title: '', description: '', requirements: '' });
                setSuccessMessage('Job created successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(response.message || 'Failed to create job');
            }
        } catch (err) {
            setError('Network error occurred');
            console.error('Error creating job:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleJobSelect = (job) => {
        setSelectedJobId(job.id);
        setRankings([]);
        setRankingsError('');
    };

    const handleLogout = async () => {
        try {
            await apiService.logout();
            onLogout();
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const handleDownloadResume = async (resumeId, filename) => {
        try {

            const result = await apiService.downloadResume(resumeId);

            const url = window.URL.createObjectURL(result.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.filename || filename || 'resume.pdf';
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            alert('Resume downloaded successfully!');
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download resume: ' + err.message);
        }
    };

    const handleExportRankings = async (format) => {
        try {
            if (!selectedJobId) {
                alert('Please select a job first');
                return;
            }

            const result = await apiService.exportJobRankings(selectedJobId, format);

            const url = window.URL.createObjectURL(result.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            alert(`${format.toUpperCase()} file downloaded successfully!`);
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export rankings: ' + err.message);
        }
    };

    const getSortedRankings = () => {
        return [...rankings].sort((a, b) => b.overall_score - a.overall_score);
    };

    return (
        <div className="recruiter-page">
            <header className="page-header">
                <div className="header-content">
                    <h1>Recruiter Dashboard - {user?.username || 'Recruiter'}</h1>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </header>

            <main className="main-content">
                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <section className="jobs-section">
                    <div className="section-header">
                        <h2>Job Management</h2>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="create-job-btn"
                        >
                            {showForm ? 'Cancel' : 'Create New Job'}
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleCreateJob} className="job-form">
                            <div className="form-group">
                                <label htmlFor="title">Job Title:</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter job title"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Job Description:</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows="6"
                                    placeholder="Enter detailed job description"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="requirements">Requirements:</label>
                                <textarea
                                    id="requirements"
                                    name="requirements"
                                    value={formData.requirements}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Enter job requirements"
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => setShowForm(false)} className="cancel-btn">
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Create Job
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="jobs-list">
                        {loading ? (
                            <div className="loading">Loading jobs...</div>
                        ) : jobs.length === 0 ? (
                            <div className="no-jobs">No jobs available. Create your first job!</div>
                        ) : (
                            <div className="jobs-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Job Title</th>
                                            <th>Status</th>
                                            <th>Created Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((job) => (
                                            <tr key={job.id} className={selectedJobId === job.id ? 'selected' : ''}>
                                                <td className="recruiter-job-title">{job.title}</td>
                                                <td>
                                                    <span className={`recruiter-status-badge ${job.status || 'active'}`}>
                                                        {job.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="recruiter-created-date">{new Date(job.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleJobSelect(job)}
                                                        className="select-job-btn"
                                                    >
                                                        {selectedJobId === job.id ? 'Selected' : 'Select'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>

                {selectedJobId && (
                    <section className="rankings-section">
                        <div className="section-header">
                            <h2>Resume Rankings</h2>
                            {rankings.length > 0 && (
                                <div className="export-controls">
                                    <button
                                        className="export-btn excel"
                                        onClick={() => handleExportRankings('excel')}
                                        disabled={!selectedJobId || rankings.length === 0}
                                    >
                                        📊 Export Excel
                                    </button>
                                    <button
                                        className="export-btn pdf"
                                        onClick={() => handleExportRankings('pdf')}
                                        disabled={!selectedJobId || rankings.length === 0}
                                    >
                                        📄 Export PDF
                                    </button>

                                </div>
                            )}
                        </div>

                        {loadingRankings ? (
                            <div className="loading">Loading rankings...</div>
                        ) : rankingsError ? (
                            <div className="error-message">{rankingsError}</div>
                        ) : rankings.length === 0 ? (
                            <div className="no-rankings">No resumes ranked for this job yet.</div>
                        ) : (
                            <div className="rankings-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Filename</th>
                                            <th>Overall Score</th>
                                            <th style={{display: 'none'}}>Skills Score</th>
                                            <th style={{display: 'none'}}>Experience Score</th>
                                            <th className="education-score-column" style={{display: 'none'}}>Education Score</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getSortedRankings().map((ranking, index) => (
                                            <tr key={ranking.ranking_id || ranking.resume_id}>
                                                <td className="rank-cell"><span className="recruiter-rank-number">{index + 1}</span></td>
                                                <td className="filename-cell">
                                                    <span className="recruiter-filename">{ranking.resume_filename || 'N/A'}</span>
                                                </td>
                                                <td className="score-cell">
                                                    <div className="score-display">
                                                        <span className="recruiter-score-value recruiter-overall-score">
                                                            {(ranking.overall_score * 100)?.toFixed(1) || '0.0'}%
                                                        </span>
                                                        <div className="score-bar">
                                                            <div
                                                                className="score-fill"
                                                                style={{ width: `${(ranking.overall_score || 0) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="score-breakdown" style={{display: 'none'}}>
                                                    <span className="recruiter-score-value">{(ranking.score_breakdown?.skill_match * 100)?.toFixed(1) || '0.0'}%</span>
                                                </td>
                                                <td className="score-breakdown" style={{display: 'none'}}>
                                                    <span className="recruiter-score-value">{(ranking.score_breakdown?.experience_match * 100)?.toFixed(1) || '0.0'}%</span>
                                                </td>
                                                <td className="score-breakdown education-score-column" style={{display: 'none'}}>
                                                    <span className="recruiter-score-value">{ranking.score_breakdown?.education_score ? (ranking.score_breakdown.education_score * 100).toFixed(1) + '%' : 'N/A'}</span>
                                                </td>
                                                <td>
                                                    <span className={`recruiter-shortlist-badge ${ranking.is_shortlisted ? 'yes' : 'no'}`}>
                                                        {ranking.is_shortlisted ? 'Shortlisted' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="download-btn"
                                                        onClick={() => handleDownloadResume(ranking.resume_id, ranking.resume_filename)}
                                                        title="Download Resume"
                                                    >
                                                        📥
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

export default RecruiterPage;