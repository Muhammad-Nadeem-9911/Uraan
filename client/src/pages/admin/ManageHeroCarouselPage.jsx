import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ManageHeroCarouselPage.css'; // We'll create this CSS file next

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ManageHeroCarouselPage = () => {
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state for adding/editing a slide
  const [isEditing, setIsEditing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(null); // For storing slide being edited
  const [slideData, setSlideData] = useState({

    linkUrl: '',
    order: 0,
    isActive: true,
  });
  const [slideImageFile, setSlideImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchSlides = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all slides (active and inactive) for admin management
      const response = await axios.get(`${API_BASE_URL}/hero-slides?activeOnly=false`);
      setSlides(response.data.data || []);
    } catch (err) {
      console.error("Error fetching hero slides:", err);
      setError(err.response?.data?.message || 'Failed to fetch hero slides.');
      toast.error(err.response?.data?.message || 'Failed to fetch hero slides.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSlideData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlideImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentSlide(null);
    setSlideData({ linkUrl: '', order: 0, isActive: true });
    setSlideImageFile(null);
    setImagePreview('');
    if(document.getElementById('heroSlideImageFile')) {
      document.getElementById('heroSlideImageFile').value = null;
    }
  };

  const handleEdit = (slide) => {
    setIsEditing(true);
    setCurrentSlide(slide);
    setSlideData({
      linkUrl: slide.linkUrl || '',
      order: slide.order || 0,
      isActive: slide.isActive !== undefined ? slide.isActive : true,
    });
    setImagePreview(slide.imageUrl || ''); // Show current image
    setSlideImageFile(null); // Clear any previously selected new file
    window.scrollTo(0, 0); // Scroll to top to see the form
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('linkUrl', slideData.linkUrl);
    formData.append('order', slideData.order);
    formData.append('isActive', slideData.isActive);

    if (slideImageFile) {
      formData.append('heroSlideImage', slideImageFile);
    }

    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (isEditing && currentSlide) {
        await axios.put(`${API_BASE_URL}/hero-slides/${currentSlide._id}`, formData, config);
        toast.success('Hero slide updated successfully!');
      } else {
        if (!slideImageFile) {
          toast.error('An image is required for a new slide.');
          setIsLoading(false);
          return;
        }
        await axios.post(`${API_BASE_URL}/hero-slides`, formData, config);
        toast.success('Hero slide created successfully!');
      }
      resetForm();
      fetchSlides();
    } catch (err) {
      console.error("Error saving hero slide:", err);
      const errMsg = err.response?.data?.message || 'Failed to save hero slide.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (slideId, slideTitle) => {
    if (window.confirm(`Are you sure you want to delete the slide "${slideTitle || 'this slide'}"?`)) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`${API_BASE_URL}/hero-slides/${slideId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Hero slide deleted successfully!');
        fetchSlides();
        if (currentSlide && currentSlide._id === slideId) { // If deleting the slide being edited
          resetForm();
        }
      } catch (err) {
        console.error("Error deleting hero slide:", err);
        toast.error(err.response?.data?.message || 'Failed to delete hero slide.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="manage-hero-carousel-page">
      <h2>Manage Hero Carousel Slides</h2>

      <form onSubmit={handleSubmit} className="slide-form">
        <h3>{isEditing ? 'Edit Slide' : 'Add New Slide'}</h3>
        {error && <p className="form-error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="linkUrl">Link URL (Optional, e.g., /competition/some-id):</label>
          <input type="url" id="linkUrl" name="linkUrl" value={slideData.linkUrl} onChange={handleInputChange} placeholder="https://example.com or /internal-path" />
        </div>
        <div className="form-group">
          <label htmlFor="heroSlideImageFile">Slide Image {isEditing ? '(Leave blank to keep current)' : '(Required)'}:</label>
          <input type="file" id="heroSlideImageFile" name="heroSlideImageFile" onChange={handleFileChange} accept="image/*" />
          {imagePreview && (
            <div className="image-preview-container">
              <p>{isEditing && !slideImageFile ? 'Current Image:' : 'New Image Preview:'}</p>
              <img src={imagePreview} alt="Slide preview" className="image-preview" />
            </div>
          )}
        </div>
        <div className="form-row">
            <div className="form-group">
            <label htmlFor="order">Order (e.g., 0, 1, 2...):</label>
            <input type="number" id="order" name="order" value={slideData.order} onChange={handleInputChange} min="0" />
            </div>
            <div className="form-group checkbox-group">
            <label htmlFor="isActive">
                <input type="checkbox" id="isActive" name="isActive" checked={slideData.isActive} onChange={handleInputChange} />
                Active (Show on homepage)
            </label>
            </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Slide' : 'Add Slide')}
          </button>
          {isEditing && (
            <button type="button" className="cancel-button" onClick={resetForm} disabled={isLoading}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <hr className="section-divider" />

      <div className="slides-list-section">
        <h3>Existing Slides</h3>
        {isLoading && slides.length === 0 && <p>Loading slides...</p>}
        {!isLoading && slides.length === 0 && <p>No slides found. Add one using the form above.</p>}
        <div className="slides-grid">
          {slides.map(slide => (
            <div key={slide._id} className={`slide-item ${!slide.isActive ? 'slide-item-inactive' : ''}`}>
              <img src={slide.imageUrl} alt={slide.title || 'Hero Slide'} className="slide-item-image" />
              <div className="slide-item-info">
                <h4>Slide Image</h4> {/* Or some other identifier if title is gone */}
                <p>Link: {slide.linkUrl || 'N/A'}</p>
                <p>Order: {slide.order}</p>
                <p>Status: {slide.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="slide-item-actions">
                <button onClick={() => handleEdit(slide)} className="edit-button">Edit</button>
                <button onClick={() => handleDelete(slide._id, slide.title)} className="delete-button">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageHeroCarouselPage;