import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { verificationApi, VerificationResult } from '@/lib/api'
import { formatDate, copyToClipboard, generateVerificationURL } from '@/lib/utils'
import { useToast } from '@/components/ui/toaster'
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Download,
  Share2,
  QrCode,
  Camera,
  ExternalLink,
  Calendar,
  GraduationCap,
  Building2,
  FileText,
  Lock,
  Verified
} from 'lucide-react'
import QRCode from 'react-qr-code'

export default function VerifyPage() {
  const { code: urlCode } = useParams()
  const [searchParams] = useSearchParams()
  const [verificationCode, setVerificationCode] = useState(urlCode || '')
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestForm, setRequestForm] = useState({
    email: '',
    name: '',
    organization: '',
    reason: ''
  })
  const [isScanning, setIsScanning] = useState(false)
  const { toast } = useToast()

  // Query for verification
  const {
    data: verificationResult,
    isLoading,
    error,
    refetch
  } = useQuery<VerificationResult>(
    ['verify', verificationCode],
    () => verificationApi.verify(verificationCode).then(res => res.data.data),
    {
      enabled: !!verificationCode,
      retry: false
    }
  )

  // Handle URL parameters
  useEffect(() => {
    const codeParam = searchParams.get('code')
    if (codeParam && !verificationCode) {
      setVerificationCode(codeParam)
    }
  }, [searchParams, verificationCode])

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (verificationCode.trim()) {
      refetch()
    }
  }

  const handleShare = async () => {
    const url = generateVerificationURL(verificationCode)
    try {
      await copyToClipboard(url)
      toast({
        title: "Link copied",
        description: "Verification link copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      })
    }
  }

  const handleRequestDetailed = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await verificationApi.requestDetailed({
        code: verificationCode,
        ...requestForm
      })

      toast({
        title: "Request submitted",
        description: "Your verification request has been sent to the institution"
      })

      setShowRequestDialog(false)
      setRequestForm({ email: '', name: '', organization: '', reason: '' })
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.response?.data?.error?.message || "Failed to submit request",
        variant: "destructive"
      })
    }
  }

  const startQRScan = () => {
    setIsScanning(true)
    // TODO: Implement QR scanner
    // This would use html5-qrcode library
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Verify Academic Credentials
        </h1>
        <p className="text-lg text-gray-600">
          Enter a certificate code or scan a QR code to verify academic credentials
        </p>
      </div>

      {/* Verification Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Verification Search
          </CardTitle>
          <CardDescription>
            Enter the certificate code or verification slug provided with the credential
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter certificate code (e.g., NU-CS-2024-001)"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={startQRScan}>
                <QrCode className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" onClick={startQRScan}>
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <Button type="submit" className="w-full" disabled={!verificationCode.trim() || isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Credential'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {(error as any)?.response?.data?.error?.message || 'Verification failed. Please check the code and try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-green-600">Credential Verified</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`px-3 py-1 ${getTrustScoreColor(verificationResult.trust_score)}`}>
                    Trust Score: {verificationResult.trust_score}%
                  </Badge>
                  {verificationResult.institution.verified && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      <Verified className="h-3 w-3 mr-1" />
                      Verified Institution
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Student Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Student Name</Label>
                      <p className="text-lg font-medium">{verificationResult.student_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Program</Label>
                      <p>{verificationResult.program_name}</p>
                      {verificationResult.program_type && (
                        <Badge variant="outline" className="mt-1 capitalize">
                          {verificationResult.program_type}
                        </Badge>
                      )}
                    </div>
                    {verificationResult.award_grade && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Award/Grade</Label>
                        <p className="font-medium">{verificationResult.award_grade}</p>
                      </div>
                    )}
                    {verificationResult.graduation_date && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Graduation Date</Label>
                        <p className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(verificationResult.graduation_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Institution Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Institution Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      {verificationResult.institution.logo && (
                        <img
                          src={verificationResult.institution.logo}
                          alt={verificationResult.institution.name}
                          className="h-12 w-12 rounded object-contain"
                        />
                      )}
                      <div>
                        <p className="font-medium text-lg">{verificationResult.institution.name}</p>
                        {verificationResult.institution.domain && (
                          <p className="text-sm text-gray-500">{verificationResult.institution.domain}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Certificate Code</Label>
                    <p className="font-mono text-sm bg-gray-50 p-2 rounded">{verificationResult.certificate_code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Issued Date</Label>
                    <p>{formatDate(verificationResult.issued_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Record Type</Label>
                    <Badge variant="outline" className="capitalize">
                      <FileText className="h-3 w-3 mr-1" />
                      {verificationResult.record_type}
                    </Badge>
                  </div>
                </div>

                {verificationResult.public_summary && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-500">Summary</Label>
                    <p className="mt-1 text-gray-700">{verificationResult.public_summary}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Share this verification or request additional details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleShare} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Verification
                </Button>
                <Button
                  onClick={() => setShowRequestDialog(true)}
                  variant="outline"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Request Detailed View
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href={verificationResult.qr_code_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    View QR Code
                  </a>
                </Button>
              </div>

              {/* QR Code Display */}
              <div className="mt-6 p-4 bg-white border rounded-lg inline-block">
                <QRCode
                  value={verificationResult.verification_url}
                  size={150}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
                <p className="text-xs text-center mt-2 text-gray-500">
                  Scan to verify
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Request Detailed Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Detailed Verification</DialogTitle>
            <DialogDescription>
              Request access to additional credential details. The institution will review and approve your request.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestDetailed} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={requestForm.email}
                onChange={(e) => setRequestForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={requestForm.name}
                onChange={(e) => setRequestForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={requestForm.organization}
                onChange={(e) => setRequestForm(prev => ({ ...prev, organization: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason for Request *</Label>
              <Textarea
                id="reason"
                value={requestForm.reason}
                onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please explain why you need detailed verification..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRequestDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}