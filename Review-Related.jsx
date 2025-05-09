import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/NotificationService';

function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  
  // Fetch initial reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/products/${productId}/reviews`);
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    }
    
    fetchReviews();
  }, [productId]);
  
  // Set up WebSocket listeners for reviews
  useEffect(() => {
    // Handle new review added
    const handleNewReview = (data) => {
      if (data.review.productId === productId) {
        setReviews(prev => [data.review, ...prev]);
      }
    };
    
    // Handle review updated
    const handleReviewUpdated = (data) => {
      setReviews(prev => prev.map(review => 
        review._id === data.reviewId 
          ? { ...review, content: data.content } 
          : review
      ));
    };
    
    // Handle review deleted
    const handleReviewDeleted = (data) => {
      setReviews(prev => prev.filter(review => review._id !== data.reviewId));
    };
    
    // Subscribe to WebSocket events
    const unsubscribeNewReview = notificationService.subscribeToNewReview(handleNewReview);
    const unsubscribeReviewUpdated = notificationService.subscribeToReviewUpdated(handleReviewUpdated);
    const unsubscribeReviewDeleted = notificationService.subscribeToReviewDeleted(handleReviewDeleted);
    
    // Clean up subscriptions
    return () => {
      unsubscribeNewReview();
      unsubscribeReviewUpdated();
      unsubscribeReviewDeleted();
    };
  }, [productId]);
  
  return (
    <div className="reviews-section">
      <h3>Customer Reviews</h3>
      {reviews.length === 0 ? (
        <p>No reviews yet. Be the first to review this product!</p>
      ) : (
        <ul className="review-list">
          {reviews.map(review => (
            <li key={review._id} className="review-item">
              <div className="review-header">
                <span className="review-author">{review.userName}</span>
                <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="review-content">{review.content}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
