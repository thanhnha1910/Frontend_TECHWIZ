import React, { useState, useRef } from 'react';
import './BulkUpload.css';
import apiService from '../../services/apiService';

const BulkUpload = ({ onUploadComplete, selectedJobId }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadResults, setUploadResults] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        const validFiles = selectedFiles.filter(file => {
            const isValidType = file.type === 'application/pdf' ||
                               file.name.toLowerCase().endsWith('.pdf');
            const isValidSize = file.size <= 10 * 1024 * 1024;
            return isValidType && isValidSize;
        });

        if (validFiles.length !== selectedFiles.length) {
            alert('Một số file không hợp lệ đã bị loại bỏ. Chỉ chấp nhận file PDF dưới 10MB.');
        }

        setFiles(validFiles);
        setUploadResults([]);
        setUploadProgress({});
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const droppedFiles = Array.from(event.dataTransfer.files);
        const validFiles = droppedFiles.filter(file => {
            const isValidType = file.type === 'application/pdf' ||
                               file.name.toLowerCase().endsWith('.pdf');
            const isValidSize = file.size <= 10 * 1024 * 1024;
            return isValidType && isValidSize;
        });

        if (validFiles.length !== droppedFiles.length) {
            alert('Một số file không hợp lệ đã bị loại bỏ. Chỉ chấp nhận file PDF dưới 10MB.');
        }

        setFiles(validFiles);
        setUploadResults([]);
        setUploadProgress({});
    };

    const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
    };

    const uploadFiles = async () => {
        if (files.length === 0) {
            alert('Vui lòng chọn ít nhất một file để upload.');
            return;
        }

        if (!selectedJobId) {
            alert('Vui lòng chọn một job trước khi upload CV.');
            return;
        }

        setUploading(true);
        setUploadResults([]);
        const results = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileId = `file_${i}`;

            try {

                setUploadProgress(prev => ({
                    ...prev,
                    [fileId]: { status: 'uploading', progress: 0 }
                }));

                const formData = new FormData();
                formData.append('resume', file);

                await apiService.applyForJob(selectedJobId, formData);

                setUploadProgress(prev => ({
                    ...prev,
                    [fileId]: { status: 'completed', progress: 100 }
                }));

                results.push({
                    filename: file.name,
                    status: 'success',
                    message: 'Upload thành công'
                });

            } catch (error) {
                console.error(`Upload failed for ${file.name}:`, error);

                setUploadProgress(prev => ({
                    ...prev,
                    [fileId]: { status: 'error', progress: 0 }
                }));

                results.push({
                    filename: file.name,
                    status: 'error',
                    message: error.message || 'Upload thất bại'
                });
            }
        }

        setUploadResults(results);
        setUploading(false);

        if (onUploadComplete) {
            onUploadComplete(results);
        }
    };

    const clearAll = () => {
        setFiles([]);
        setUploadResults([]);
        setUploadProgress({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="bulk-upload">
            <div className="upload-header">
                <h3>📁 Upload Nhiều CV Cùng Lúc</h3>
                <p>Kéo thả hoặc chọn nhiều file PDF để upload đồng thời</p>
            </div>

            {}
            <div
                className={`drop-zone ${files.length > 0 ? 'has-files' : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="drop-zone-content">
                    <div className="drop-icon">📄</div>
                    <p className="drop-text">
                        {files.length === 0
                            ? 'Kéo thả file PDF vào đây hoặc click để chọn'
                            : `${files.length} file đã được chọn`
                        }
                    </p>
                    <p className="drop-hint">Chỉ chấp nhận file PDF, tối đa 10MB mỗi file</p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>

            {}
            {files.length > 0 && (
                <div className="file-list">
                    <div className="file-list-header">
                        <h4>Danh sách file ({files.length})</h4>
                        <button
                            className="clear-btn"
                            onClick={clearAll}
                            disabled={uploading}
                        >
                            🗑️ Xóa tất cả
                        </button>
                    </div>

                    <div className="file-items">
                        {files.map((file, index) => {
                            const fileId = `file_${index}`;
                            const progress = uploadProgress[fileId];

                            return (
                                <div key={index} className="file-item">
                                    <div className="file-info">
                                        <div className="file-name">{file.name}</div>
                                        <div className="file-size">{formatFileSize(file.size)}</div>
                                    </div>

                                    {progress && (
                                        <div className="file-progress">
                                            <div className={`progress-bar ${progress.status}`}>
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${progress.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="progress-text">
                                                {progress.status === 'uploading' && '⏳ Đang upload...'}
                                                {progress.status === 'completed' && '✅ Hoàn thành'}
                                                {progress.status === 'error' && '❌ Lỗi'}
                                            </span>
                                        </div>
                                    )}

                                    {!uploading && (
                                        <button
                                            className="remove-file-btn"
                                            onClick={() => removeFile(index)}
                                        >
                                            ❌
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {}
            {files.length > 0 && (
                <div className="upload-controls">
                    <button
                        className="upload-btn"
                        onClick={uploadFiles}
                        disabled={uploading || !selectedJobId}
                    >
                        {uploading ? '⏳ Đang upload...' : `🚀 Upload ${files.length} file`}
                    </button>

                    {!selectedJobId && (
                        <p className="warning">⚠️ Vui lòng chọn một job trước khi upload</p>
                    )}
                </div>
            )}

            {}
            {uploadResults.length > 0 && (
                <div className="upload-results">
                    <h4>Kết quả upload</h4>
                    <div className="results-list">
                        {uploadResults.map((result, index) => (
                            <div key={index} className={`result-item ${result.status}`}>
                                <span className="result-icon">
                                    {result.status === 'success' ? '✅' : '❌'}
                                </span>
                                <span className="result-filename">{result.filename}</span>
                                <span className="result-message">{result.message}</span>
                            </div>
                        ))}
                    </div>

                    <div className="results-summary">
                        <span className="success-count">
                            ✅ Thành công: {uploadResults.filter(r => r.status === 'success').length}
                        </span>
                        <span className="error-count">
                            ❌ Thất bại: {uploadResults.filter(r => r.status === 'error').length}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkUpload;