import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiRequest } from '../../utils/api'
import { toast } from 'sonner'

const NewsletterForm = ({ subscriptionType = 'newsletter', allowCategorySelection = true }) => {
  const [email, setEmail] = useState('')
  const [selectedCategories, setSelectedCategories] = useState(['newsletter'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const availableCategories = [
    { value: 'newsletter', label: 'General Newsletter', description: 'Technology insights and company updates' },
    { value: 'blog', label: 'Blog Updates', description: 'New blog posts and articles' },
    { value: 'news', label: 'News & Announcements', description: 'Latest news and product announcements' },
    { value: 'tech', label: 'Tech Updates', description: 'Technical articles and tutorials' },
    { value: 'business', label: 'Business Updates', description: 'Industry trends and business insights' }
  ]

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category.')
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Subscribe to newsletter with single API call
      const response = await apiRequest('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          email,
          categories: selectedCategories,
          subscription_type: selectedCategories[0] // Use first category as primary
        })
      })

      if (response.success) {
        toast.success(response.message || `Successfully subscribed to ${selectedCategories.length} category${selectedCategories.length !== 1 ? 'ies' : 'y'}!`)
        setEmail('')
        setSelectedCategories(['newsletter'])
        setSubmitStatus('success')
      } else {
        toast.error(response.message || 'Error subscribing. Please try again.')
        setSubmitStatus('error')
      }
    } catch (error) {
      toast.error('Error subscribing. Please try again.')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
      <p className="text-gray-600 mb-4">
        Choose the types of updates you'd like to receive from us.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selection */}
        {allowCategorySelection && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select your interests:
            </label>
            <div className="space-y-2">
              {availableCategories.map((category) => (
                <label
                  key={category.value}
                  className="flex items-start space-x-3 p-3 rounded-md border border-gray-200 hover:bg-white transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.value)}
                    onChange={() => handleCategoryChange(category.value)}
                    className="mt-1 rounded"
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {category.label}
                    </div>
                    <div className="text-xs text-gray-600">
                      {category.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Email Input */}
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={isSubmitting || selectedCategories.length === 0}>
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </div>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">
              Successfully subscribed to {selectedCategories.length} category{selectedCategories.length !== 1 ? 'ies' : 'y'}!
            </p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              {selectedCategories.length === 0
                ? 'Please select at least one category.'
                : 'Error subscribing. Please try again.'
              }
            </p>
          </div>
        )}
      </form>
    </div>
  )
}

export default NewsletterForm
