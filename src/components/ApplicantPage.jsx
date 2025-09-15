import React, { useState, useEffect } from "react";
import { getJobs, applyForJob, logout } from "../services/apiService";
import "./ApplicantPage.css";

const ApplicantPage = ({ user, onLogout }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetJobId, setTargetJobId] = useState(null);
  const [applying, setApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getJobs();
      if (response.success) {
        setJobs(response.jobs || []);
      } else {
        setError(response.error || "Failed to load jobs");
      }
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Load jobs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (jobId) => {
    setTargetJobId(jobId);
    setShowApplicationForm(true);
    setSelectedFile(null);
    setError("");
    setSuccessMessage("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {

      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Please select a PDF or DOCX file");
        return;
      }

      if (file.size > 16 * 1024 * 1024) {
        setError("File size must be less than 16MB");
        return;
      }

      setSelectedFile(file);
      setError("");
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedFile || !targetJobId) {
      setError("Please select a file first");
      return;
    }

    try {
      setApplying(true);
      setError("");

      const response = await applyForJob(targetJobId, selectedFile);

      if (response.success) {
        setSuccessMessage("Application submitted successfully!");
        setShowApplicationForm(false);
        setSelectedFile(null);
        setTargetJobId(null);

        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setError(response.error || "Failed to submit application");
      }
    } catch (err) {
      setError("Failed to submit application. Please try again.");
      console.error("Apply error:", err);
    } finally {
      setApplying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
    } catch (err) {
      console.error("Logout error:", err);

      onLogout();
    }
  };

  const closeApplicationForm = () => {
    setShowApplicationForm(false);
    setSelectedFile(null);
    setTargetJobId(null);
    setError("");
  };

  return (
    <div className="applicant-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Welcome, {user?.username || "Applicant"}!</h1>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="jobs-section">
          <h2>Available Jobs</h2>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {loading ? (
            <div className="loading">Loading jobs...</div>
          ) : error && !showApplicationForm ? (
            <div className="error-message">
              {error}
              <button onClick={loadJobs} className="retry-btn">
                Retry
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="no-jobs">No jobs available at the moment.</div>
          ) : (
            <div className="jobs-list">
              {jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <h3>{job.title}</h3>
                    <span className="job-status">{job.status || 'Active'}</span>
                  </div>
                  <div className="job-content">
                    {job.company && (
                      <div className="job-company">
                        <strong>Company:</strong> {job.company}
                      </div>
                    )}
                    {job.location && (
                      <div className="job-location">
                        <strong>Location:</strong> {job.location}
                      </div>
                    )}
                    {job.salary && (
                      <div className="job-salary">
                        <strong>Salary:</strong> {job.salary}
                      </div>
                    )}
                    <div className="job-description">
                      <strong>Description:</strong>
                      <p>
                        {job.full_text && job.full_text.length > 300
                          ? `${job.full_text.substring(0, 300)}...`
                          : job.full_text || job.description || 'No description available'}
                      </p>
                    </div>
                    {job.requirements && (
                      <div className="job-requirements">
                        <strong>Requirements:</strong>
                        <p>{job.requirements}</p>
                      </div>
                    )}
                    <div className="job-meta">
                      <span>
                        <strong>Posted:</strong> {new Date(job.created_at).toLocaleDateString()}
                      </span>
                      {job.deadline && (
                        <span className="job-deadline">
                          <strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="job-actions">
                    <button
                      onClick={() => handleApplyClick(job.id)}
                      className="apply-btn"
                      disabled={applying}
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {}
      {showApplicationForm && (
        <div className="modal-overlay">
          <div className="application-modal">
            <div className="modal-header">
              <h3>Submit Application</h3>
              <button onClick={closeApplicationForm} className="close-btn">
                ×
              </button>
            </div>

            <div className="modal-content">
              <p>Upload your resume for this position:</p>

              <div className="file-upload">
                <input
                  type="file"
                  id="resume-file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="resume-file" className="file-label">
                  {selectedFile
                    ? selectedFile.name
                    : "Choose Resume File (PDF or DOCX)"}
                </label>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button
                  onClick={closeApplicationForm}
                  className="cancel-btn"
                  disabled={applying}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApplication}
                  className="submit-btn"
                  disabled={!selectedFile || applying}
                >
                  {applying ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantPage;
