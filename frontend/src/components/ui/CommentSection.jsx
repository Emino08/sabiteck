import React, { useState, useEffect } from 'react'
import { MessageCircle, Heart, Send, User, Reply } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Card, CardContent } from './card'
import { apiRequest } from '../../utils/api'
import { toast } from 'sonner'

const CommentSection = ({ contentId, initialCommentCount = 0, initialLikeCount = 0 }) => {
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

  const userIdentifier = localStorage.getItem('user_email') || 
                        localStorage.getItem('temp_user_id') || 
                        generateTempUserId()

  function generateTempUserId() {
    const tempId = 'temp_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('temp_user_id', tempId)
    return tempId
  }

  useEffect(() => {
    // Check if user has already liked this content
    const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]')
    const contentIdStr = String(contentId)
    setIsLiked(likedPosts.includes(contentIdStr))
  }, [contentId])

  useEffect(() => {
    // Load initial like status from server when component mounts
    const checkLikeStatus = async () => {
      try {
        const response = await apiRequest(`/api/content/${contentId}/like-status?userIdentifier=${encodeURIComponent(userIdentifier)}`, {
          method: 'GET'
        })

        // Update state based on server response
        setIsLiked(response.liked)
        setLikeCount(response.like_count)

        // Update localStorage to match server state
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
      } catch (error) {
        console.log('Could not check initial like status')
      }
    }

    if (contentId && userIdentifier) {
      checkLikeStatus()
    }
  }, [contentId, userIdentifier])

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
    // Optimistic update
    const newLikedState = !isLiked
    const newLikeCount = newLikedState ? likeCount + 1 : likeCount - 1

    setIsLiked(newLikedState)
    setLikeCount(newLikeCount)

    try {
      const response = await apiRequest(`/api/content/${contentId}/like`, {
        method: 'POST',
        body: JSON.stringify({ user_identifier: userIdentifier })
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
          className={`flex items-center space-x-2 ${isLiked ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-700'}`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
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
              <h4 className="font-medium mb-4">Leave a Comment</h4>
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
    </div>
  )
}

export default CommentSection