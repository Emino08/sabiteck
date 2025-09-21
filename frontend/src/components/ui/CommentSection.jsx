import React, { useState, useEffect } from 'react'
import { MessageCircle, Heart, Send, User, Reply, LogIn, AlertCircle } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Card, CardContent } from './card'
import { apiRequest } from '../../utils/api'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const CommentSection = ({ contentId, initialCommentCount = 0, initialLikeCount = 0 }) => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [comments, setComments] = useState([])
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLiked, setIsLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState({
    author_name: '',
    author_email: '',
    comment: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyForm, setReplyForm] = useState({
    author_name: '',
    author_email: '',
    comment: ''
  })
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [pendingLike, setPendingLike] = useState(() => {
    // Check if there's a pending like for this content
    const pending = localStorage.getItem(`pendingLike_${contentId}`)
    return pending === 'true'
  })

  const userIdentifier = localStorage.getItem('user_email') || 
                        localStorage.getItem('temp_user_id') || 
                        generateTempUserId()

  function generateTempUserId() {
    const tempId = 'temp_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('temp_user_id', tempId)
    return tempId
  }

  useEffect(() => {
    // Check if user has already liked this content (only for authenticated users)
    if (isAuthenticated()) {
      const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]')
      const contentIdStr = String(contentId)
      setIsLiked(likedPosts.includes(contentIdStr))
    } else {
      setIsLiked(false) // Reset like status for non-authenticated users
    }
  }, [contentId, isAuthenticated])

  useEffect(() => {
    // Load initial like status from server when component mounts (only for authenticated users)
    const checkLikeStatus = async () => {
      try {
        const identifier = isAuthenticated() ?
          user?.email || user?.username || userIdentifier :
          userIdentifier

        const response = await apiRequest(`/api/content/${contentId}/like-status?userIdentifier=${encodeURIComponent(identifier)}`, {
          method: 'GET'
        })

        // Update state based on server response
        setIsLiked(response.liked && isAuthenticated()) // Only set liked if user is authenticated
        setLikeCount(response.like_count)

        // Update localStorage to match server state (only for authenticated users)
        if (isAuthenticated()) {
          const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]')
          const contentIdStr = String(contentId)

          if (response.liked && !likedPosts.includes(contentIdStr)) {
            likedPosts.push(contentIdStr)
            localStorage.setItem('liked_posts', JSON.stringify(likedPosts))
          } else if (!response.liked && likedPosts.includes(contentIdStr)) {
            const index = likedPosts.indexOf(contentIdStr)
            likedPosts.splice(index, 1)
            localStorage.setItem('liked_posts', JSON.stringify(likedPosts))
          }
        }
      } catch (error) {
        console.log('Could not check initial like status')
      }
    }

    if (contentId) {
      checkLikeStatus()
    }
  }, [contentId, user, isAuthenticated])

  // Handle pending like after authentication
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const shouldLike = urlParams.get('autoLike')
    const targetContentId = urlParams.get('contentId')

    if (shouldLike === 'true' &&
        targetContentId === String(contentId) &&
        isAuthenticated() &&
        !isLiked) {

      // Auto-like the content after successful login/registration
      const performAutoLike = async () => {
        try {
          // Clear pending state first
          setPendingLike(false)
          localStorage.removeItem(`pendingLike_${contentId}`)

          // Perform the like action
          await handleLike()

          // Clean up URL parameters
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)

          toast.success('Welcome back! Your like has been activated.')
        } catch (error) {
          console.error('Auto-like failed:', error)
          toast.error('Failed to activate like. Please try again.')
        }
      }

      performAutoLike()
    }
  }, [isAuthenticated, contentId, isLiked])

  // Clear pending like when user authenticates (fallback)
  useEffect(() => {
    if (isAuthenticated() && pendingLike) {
      // Check if this was a pending like that should be cleared
      const hasPendingLike = localStorage.getItem(`pendingLike_${contentId}`)
      if (hasPendingLike && !window.location.search.includes('autoLike=true')) {
        // User logged in but not via our flow, clear pending state
        setPendingLike(false)
        localStorage.removeItem(`pendingLike_${contentId}`)
      }
    }
  }, [isAuthenticated, pendingLike, contentId])

  // Show reminder for pending likes
  useEffect(() => {
    if (pendingLike && !isAuthenticated()) {
      const timer = setTimeout(() => {
        toast.info('You have a pending like! Sign in to activate it.', {
          action: {
            label: 'Sign In',
            onClick: () => setShowLoginPrompt(true)
          }
        })
      }, 3000) // Show after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [pendingLike, isAuthenticated])

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showLoginPrompt && event.key === 'Escape') {
        setShowLoginPrompt(false)
        setPendingLike(false)
        localStorage.removeItem(`pendingLike_${contentId}`)
      }
    }

    if (showLoginPrompt) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the modal when it opens
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [showLoginPrompt, contentId])

  const countAllComments = (commentArray) => {
    let count = 0
    commentArray.forEach(comment => {
      count++ // Count the parent comment
      if (comment.replies && comment.replies.length > 0) {
        count += countAllComments(comment.replies) // Recursively count replies
      }
    })
    return count
  }

  const loadComments = async () => {
    if (loading) return

    setLoading(true)
    try {
      const response = await apiRequest(`/api/content/${contentId}/comments`)
      const commentsData = response.comments || []
      setComments(commentsData)
      setCommentCount(countAllComments(commentsData))
    } catch (error) {
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      setPendingLike(true)
      localStorage.setItem(`pendingLike_${contentId}`, 'true')
      setShowLoginPrompt(true)
      toast.error('Please log in to like posts')
      return
    }

    // Optimistic update
    const newLikedState = !isLiked
    const newLikeCount = newLikedState ? likeCount + 1 : likeCount - 1

    setIsLiked(newLikedState)
    setLikeCount(newLikeCount)

    try {
      const response = await apiRequest(`/api/content/${contentId}/like`, {
        method: 'POST',
        body: JSON.stringify({
          user_identifier: user?.email || user?.username || userIdentifier,
          user_id: user?.id
        })
      })

      // Update with actual server response
      setIsLiked(response.liked)
      setLikeCount(response.like_count)

      // Update local storage to match server state
      const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]')
      const contentIdStr = String(contentId)

      if (response.liked) {
        if (!likedPosts.includes(contentIdStr)) {
          likedPosts.push(contentIdStr)
        }
      } else {
        const index = likedPosts.indexOf(contentIdStr)
        if (index > -1) likedPosts.splice(index, 1)
      }
      localStorage.setItem('liked_posts', JSON.stringify(likedPosts))

      // Clear any pending like state on success
      if (pendingLike) {
        setPendingLike(false)
        localStorage.removeItem(`pendingLike_${contentId}`)
      }

      toast.success(response.liked ? 'Post liked!' : 'Like removed')
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!newLikedState)
      setLikeCount(likeCount)
      toast.error('Failed to update like')
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()

    if (!newComment.author_name || !newComment.author_email || !newComment.comment) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)

    // Optimistic update - add comment immediately
    const tempComment = {
      id: `temp-${Date.now()}`,
      parent_id: null,
      author_name: newComment.author_name,
      author_email: newComment.author_email,
      comment: newComment.comment,
      created_at: new Date().toISOString(),
      replies: []
    }

    setComments(prev => [tempComment, ...prev])
    setCommentCount(prev => prev + 1)
    setNewComment({ author_name: '', author_email: '', comment: '' })

    try {
      await apiRequest(`/api/content/${contentId}/comments`, {
        method: 'POST',
        body: JSON.stringify(newComment)
      })

      toast.success('Comment added successfully!')

      // Reload comments to get the real comment with proper ID
      await loadComments()
    } catch (error) {
      // Revert optimistic update on error
      setComments(prev => prev.filter(comment => comment.id !== tempComment.id))
      setCommentCount(prev => prev - 1)
      setNewComment({ author_name: newComment.author_name, author_email: newComment.author_email, comment: newComment.comment })
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault()

    if (!replyForm.author_name || !replyForm.author_email || !replyForm.comment) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)

    // Optimistic update for replies
    const tempReply = {
      id: `temp-reply-${Date.now()}`,
      parent_id: parentId,
      author_name: replyForm.author_name,
      author_email: replyForm.author_email,
      comment: replyForm.comment,
      created_at: new Date().toISOString(),
      replies: []
    }

    // Add reply to the appropriate parent comment
    setComments(prev => {
      return prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), tempReply]
          }
        } else if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === parentId) {
                return {
                  ...reply,
                  replies: [...(reply.replies || []), tempReply]
                }
              }
              return reply
            })
          }
        }
        return comment
      })
    })

    setCommentCount(prev => prev + 1)
    setReplyForm({ author_name: '', author_email: '', comment: '' })
    setReplyingTo(null)

    try {
      await apiRequest(`/api/content/${contentId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          ...replyForm,
          parent_id: parentId
        })
      })

      toast.success('Reply added successfully!')

      // Reload comments to get the real reply with proper ID
      await loadComments()
    } catch (error) {
      // Revert optimistic update on error
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: (comment.replies || []).filter(reply => reply.id !== tempReply.id)
            }
          } else if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.id === parentId) {
                  return {
                    ...reply,
                    replies: (reply.replies || []).filter(r => r.id !== tempReply.id)
                  }
                }
                return reply
              })
            }
          }
          return comment
        })
      })
      setCommentCount(prev => prev - 1)
      setReplyForm({ author_name: replyForm.author_name, author_email: replyForm.author_email, comment: replyForm.comment })
      toast.error('Failed to add reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleShowComments = () => {
    setShowComments(!showComments)
    if (!showComments && comments.length === 0) {
      loadComments()
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderComment = (comment, level = 0) => {
    const isMaxLevel = level >= 2 // Limit nesting to 2 levels for readability

    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-gray-200 rounded-full p-2">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{comment.author_name}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  {!isMaxLevel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </div>
                <p className="text-gray-700 leading-relaxed mb-2">{comment.comment}</p>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <Card className="mt-4 bg-gray-50">
                    <CardContent className="p-4">
                      <h5 className="font-medium mb-3">Reply to {comment.author_name}</h5>
                      <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Your name"
                            value={replyForm.author_name}
                            onChange={(e) => setReplyForm({...replyForm, author_name: e.target.value})}
                            required
                            size="sm"
                          />
                          <Input
                            type="email"
                            placeholder="Your email"
                            value={replyForm.author_email}
                            onChange={(e) => setReplyForm({...replyForm, author_email: e.target.value})}
                            required
                            size="sm"
                          />
                        </div>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          rows={3}
                          placeholder="Write your reply..."
                          value={replyForm.comment}
                          onChange={(e) => setReplyForm({...replyForm, comment: e.target.value})}
                          required
                        />
                        <div className="flex items-center space-x-2">
                          <Button type="submit" disabled={submitting} size="sm">
                            <Send className="h-3 w-3 mr-1" />
                            {submitting ? 'Submitting...' : 'Post Reply'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyForm({ author_name: '', author_email: '', comment: '' })
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map(reply => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Like and Comment Actions */}
      <div className="flex items-center space-x-6 py-4 border-t border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-all duration-300 ${
            isLiked ? 'text-red-600 hover:text-red-700' :
            pendingLike ? 'text-blue-600 hover:text-blue-700 animate-pulse' :
            isAuthenticated() ? 'text-gray-600 hover:text-gray-700' :
            'text-gray-400 hover:text-gray-600'
          }`}
          title={
            pendingLike ? 'Login to activate your like' :
            !isAuthenticated() ? 'Login required to like posts' :
            isLiked ? 'Unlike this post' : 'Like this post'
          }
        >
          <Heart className={`h-5 w-5 transition-all duration-300 ${
            isLiked ? 'fill-current' :
            pendingLike ? 'fill-current text-blue-600 animate-pulse' : ''
          }`} />
          <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          {pendingLike && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent ml-1" />}
          {!isAuthenticated() && !pendingLike && <LogIn className="h-4 w-4 ml-1 opacity-60" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShowComments}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-700"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-6">
          {/* Add Comment Form */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Leave a Comment</h4>
                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span>No login required</span>
                </div>
              </div>
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Your name"
                    value={newComment.author_name}
                    onChange={(e) => setNewComment({...newComment, author_name: e.target.value})}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={newComment.author_email}
                    onChange={(e) => setNewComment({...newComment, author_email: e.target.value})}
                    required
                  />
                </div>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={4}
                  placeholder="Write your comment..."
                  value={newComment.comment}
                  onChange={(e) => setNewComment({...newComment, comment: e.target.value})}
                  required
                />
                <Button type="submit" disabled={submitting} className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Submitting...' : 'Post Comment'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => renderComment(comment))
            )}
          </div>
        </div>
      )}

      {/* Enhanced Login Prompt Modal */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLoginPrompt(false)
              setPendingLike(false)
              localStorage.removeItem(`pendingLike_${contentId}`)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-white/20 rounded-full p-3">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 id="login-modal-title" className="text-xl font-bold text-center mb-2">Join the Conversation!</h3>
              <p className="text-blue-100 text-center text-sm">
                Sign in to show your appreciation and track your favorite content
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Why sign in?</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <Heart className="h-3 w-3 text-red-500 mr-2 flex-shrink-0" />
                        Like and save your favorite posts
                      </li>
                      <li className="flex items-center">
                        <MessageCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        Get notified of replies to your comments
                      </li>
                      <li className="flex items-center">
                        <User className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                        Build your profile and reputation
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    setShowLoginPrompt(false)
                    const currentUrl = window.location.pathname + window.location.search
                    const returnUrl = `${currentUrl}${currentUrl.includes('?') ? '&' : '?'}autoLike=true&contentId=${contentId}`

                    // Track analytics for like-motivated login
                    if (typeof gtag !== 'undefined') {
                      gtag('event', 'login_prompt_click', {
                        'event_category': 'engagement',
                        'event_label': 'like_action',
                        'content_id': contentId
                      })
                    }

                    navigate('/login', {
                      state: {
                        returnTo: returnUrl,
                        message: 'Sign in to like this post'
                      }
                    })
                  }}
                  className="flex items-center justify-center flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLoginPrompt(false)
                    setPendingLike(false)
                    localStorage.removeItem(`pendingLike_${contentId}`)
                  }}
                  className="flex-1 border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </Button>
              </div>

              {/* Alternative option */}
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">Don't have an account? </span>
                <Button
                  variant="link"
                  onClick={() => {
                    setShowLoginPrompt(false)
                    const currentUrl = window.location.pathname + window.location.search
                    const returnUrl = `${currentUrl}${currentUrl.includes('?') ? '&' : '?'}autoLike=true&contentId=${contentId}`

                    // Track analytics for like-motivated registration
                    if (typeof gtag !== 'undefined') {
                      gtag('event', 'register_prompt_click', {
                        'event_category': 'engagement',
                        'event_label': 'like_action',
                        'content_id': contentId
                      })
                    }

                    navigate('/register', {
                      state: {
                        returnTo: returnUrl,
                        message: 'Create an account to like this post'
                      }
                    })
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 p-0 h-auto font-semibold"
                >
                  Create Account
                </Button>
              </div>

              {/* Footer message */}
              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 text-center font-medium flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                  Good news! You can still comment and participate without signing in
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentSection