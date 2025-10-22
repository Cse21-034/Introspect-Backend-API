import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Users, 
  FileText, 
  Database, 
  Bell, 
  Lock, 
  Heart,
  Code,
  Microscope,
  ChevronRight
} from "lucide-react";

interface EndpointProps {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  authRequired?: boolean;
  requestBody?: object;
  responseExample?: object;
  params?: { name: string; type: string; description: string }[];
}

function Endpoint({ method, path, description, authRequired = true, requestBody, responseExample, params }: EndpointProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const methodColors = {
    GET: "bg-blue-500",
    POST: "bg-green-500",
    PUT: "bg-yellow-500",
    DELETE: "bg-red-500",
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Badge className={`${methodColors[method]} text-white shrink-0`}>{method}</Badge>
            <code className="text-sm font-mono text-foreground break-all">{path}</code>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            data-testid={`button-toggle-${method}-${path.replace(/\//g, '-')}`}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </Button>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
        {authRequired && (
          <Badge variant="outline" className="w-fit mt-2">
            <Lock className="h-3 w-3 mr-1" />
            Authentication Required
          </Badge>
        )}
      </CardHeader>
      
      {showDetails && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          
          {params && params.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Parameters</h4>
              <div className="space-y-2">
                {params.map((param) => (
                  <div key={param.name} className="flex items-start gap-2 text-sm">
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{param.name}</code>
                    <span className="text-muted-foreground text-xs">({param.type})</span>
                    <span className="text-muted-foreground">{param.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {requestBody && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Request Body</h4>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono">
                {JSON.stringify(requestBody, null, 2)}
              </pre>
            </div>
          )}
          
          {responseExample && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Response Example</h4>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono">
                {JSON.stringify(responseExample, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function ApiDocumentation() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Microscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-title">Introspect API</h1>
              <p className="text-muted-foreground">Malaria Diagnostic Platform</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl mt-3">
            Comprehensive REST API for healthcare workers in Botswana and Sub-Saharan Africa. 
            Integrate AI-powered malaria diagnostics into your mobile applications.
          </p>
          <div className="flex gap-3 mt-4">
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              API v1.0
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Heart className="h-3 w-3" />
              Healthcare
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Code className="h-3 w-3" />
              REST
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="auth" className="w-full">
          <TabsList className="grid grid-cols-5 w-full mb-6" data-testid="tabs-endpoint-categories">
            <TabsTrigger value="auth" className="gap-2" data-testid="tab-auth">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Auth</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="gap-2" data-testid="tab-diagnostics">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Diagnostics</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-2" data-testid="tab-patients">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Patients</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2" data-testid="tab-notifications">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auth">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="pr-4">
                <h2 className="text-2xl font-bold mb-4">Authentication</h2>
                <p className="text-muted-foreground mb-6">
                  All endpoints except login and registration require JWT token authentication. 
                  Include the token in the Authorization header: <code className="bg-muted px-2 py-1 rounded text-sm">Bearer &lt;token&gt;</code>
                </p>
                
                <Endpoint
                  method="POST"
                  path="/api/auth/register"
                  description="Register a new user account (health worker, admin, or super admin)"
                  authRequired={false}
                  requestBody={{
                    email: "nurse.thato@clinic.bw",
                    password: "SecurePass123!",
                    fullName: "Thato Molosiwa",
                    role: "health_worker",
                    phoneNumber: "+26771234567",
                    facilityName: "Okavango District Clinic",
                    district: "Okavango"
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      user: {
                        id: "uuid-here",
                        email: "nurse.thato@clinic.bw",
                        fullName: "Thato Molosiwa",
                        role: "health_worker"
                      },
                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />

                <Endpoint
                  method="POST"
                  path="/api/auth/login"
                  description="Authenticate and receive JWT token"
                  authRequired={false}
                  requestBody={{
                    email: "nurse.thato@clinic.bw",
                    password: "SecurePass123!"
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      user: {
                        id: "uuid-here",
                        email: "nurse.thato@clinic.bw",
                        fullName: "Thato Molosiwa",
                        role: "health_worker",
                        facilityName: "Okavango District Clinic"
                      },
                      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />

                <Endpoint
                  method="POST"
                  path="/api/auth/forgot-password"
                  description="Request password reset token via email"
                  authRequired={false}
                  requestBody={{
                    email: "nurse.thato@clinic.bw"
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      message: "Password reset instructions sent to your email"
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />

                <Endpoint
                  method="POST"
                  path="/api/auth/reset-password"
                  description="Reset password using token from email"
                  authRequired={false}
                  requestBody={{
                    token: "reset-token-from-email",
                    newPassword: "NewSecurePass123!"
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      message: "Password successfully reset"
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="users">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="pr-4">
                <h2 className="text-2xl font-bold mb-4">User Management</h2>
                <p className="text-muted-foreground mb-6">
                  Manage user profiles, view account information, and update user details.
                </p>
                
                <Endpoint
                  method="GET"
                  path="/api/users/profile"
                  description="Get current user's profile information"
                  responseExample={{
                    success: true,
                    data: {
                      id: "uuid-here",
                      email: "nurse.thato@clinic.bw",
                      fullName: "Thato Molosiwa",
                      role: "health_worker",
                      phoneNumber: "+26771234567",
                      facilityName: "Okavango District Clinic",
                      district: "Okavango",
                      isActive: true,
                      lastLoginAt: "2026-08-07T09:15:00Z",
                      createdAt: "2026-01-15T08:00:00Z"
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />

                <Endpoint
                  method="PUT"
                  path="/api/users/profile"
                  description="Update current user's profile"
                  requestBody={{
                    fullName: "Thato M. Molosiwa",
                    phoneNumber: "+26771234567",
                    facilityName: "Okavango District Health Center"
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      id: "uuid-here",
                      email: "nurse.thato@clinic.bw",
                      fullName: "Thato M. Molosiwa",
                      phoneNumber: "+26771234567",
                      facilityName: "Okavango District Health Center"
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />

                <Endpoint
                  method="DELETE"
                  path="/api/users/account"
                  description="Delete user account (requires confirmation)"
                  responseExample={{
                    success: true,
                    data: {
                      message: "Account successfully deleted"
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="diagnostics">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="pr-4">
                <h2 className="text-2xl font-bold mb-4">Diagnostic Results</h2>
                <p className="text-muted-foreground mb-6">
                  Submit blood smear images for AI analysis, retrieve test results, and manage diagnostic records.
                </p>
                
                <Endpoint
                  method="POST"
                  path="/api/diagnostics/submit"
                  description="Submit a diagnostic test with blood smear image"
                  requestBody={{
                    patientId: "patient-uuid",
                    imageFile: "multipart/form-data",
                    symptoms: ["fever", "chills", "headache"],
                    testDate: "2026-08-07T10:00:00Z"
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      id: "diagnostic-uuid",
                      patientId: "patient-uuid",
                      imageUrl: "https://s3.amazonaws.com/introspect/diagnostics/...",
                      result: "positive",
                      parasiteCount: 1250,
                      aiConfidenceScore: 94,
                      reviewStatus: "pending",
                      testDate: "2026-08-07T10:00:00Z",
                      createdAt: "2026-08-07T10:05:00Z"
                    },
                    timestamp: "2026-08-07T10:05:00Z"
                  }}
                />

                <Endpoint
                  method="GET"
                  path="/api/diagnostics/history"
                  description="Get diagnostic test history with optional filters"
                  params={[
                    { name: "patientId", type: "string", description: "Filter by patient ID" },
                    { name: "result", type: "string", description: "Filter by result (positive/negative/inconclusive)" },
                    { name: "limit", type: "number", description: "Number of results to return (default: 20)" }
                  ]}
                  responseExample={{
                    success: true,
                    data: [
                      {
                        id: "diagnostic-uuid",
                        patient: {
                          id: "patient-uuid",
                          patientCode: "P2026-0001",
                          age: 7,
                          gender: "female"
                        },
                        result: "positive",
                        parasiteCount: 1250,
                        aiConfidenceScore: 94,
                        reviewStatus: "reviewed",
                        testDate: "2026-08-07T10:00:00Z"
                      }
                    ],
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />

                <Endpoint
                  method="GET"
                  path="/api/diagnostics/:id"
                  description="Get detailed information about a specific diagnostic test"
                  params={[
                    { name: "id", type: "string", description: "Diagnostic ID" }
                  ]}
                  responseExample={{
                    success: true,
                    data: {
                      id: "diagnostic-uuid",
                      patient: {
                        patientCode: "P2026-0001",
                        age: 7,
                        gender: "female",
                        district: "Okavango"
                      },
                      imageUrl: "https://s3.amazonaws.com/introspect/diagnostics/...",
                      result: "positive",
                      parasiteCount: 1250,
                      aiConfidenceScore: 94,
                      symptoms: ["fever", "chills", "headache"],
                      reviewStatus: "reviewed",
                      reviewNotes: "Confirmed P. falciparum infection",
                      testDate: "2026-08-07T10:00:00Z"
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />

                <Endpoint
                  method="PUT"
                  path="/api/diagnostics/:id/review"
                  description="Add review notes and verification to a diagnostic (admin/super_admin only)"
                  params={[
                    { name: "id", type: "string", description: "Diagnostic ID" }
                  ]}
                  requestBody={{
                    reviewStatus: "verified",
                    reviewNotes: "Confirmed P. falciparum infection. Treatment initiated."
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      id: "diagnostic-uuid",
                      reviewStatus: "verified",
                      reviewNotes: "Confirmed P. falciparum infection. Treatment initiated.",
                      reviewedAt: "2026-08-07T11:00:00Z"
                    },
                    timestamp: "2026-08-07T11:00:00Z"
                  }}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="patients">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="pr-4">
                <h2 className="text-2xl font-bold mb-4">Patient Records</h2>
                <p className="text-muted-foreground mb-6">
                  Create and manage anonymized patient records for diagnostic tracking.
                </p>
                
                <Endpoint
                  method="POST"
                  path="/api/patients"
                  description="Create a new patient record"
                  requestBody={{
                    patientCode: "P2026-0042",
                    age: 5,
                    gender: "male",
                    district: "Ngami",
                    facilityName: "Ngami Health Post"
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      id: "patient-uuid",
                      patientCode: "P2026-0042",
                      age: 5,
                      gender: "male",
                      district: "Ngami",
                      facilityName: "Ngami Health Post",
                      createdAt: "2026-08-07T10:30:00Z"
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />

                <Endpoint
                  method="GET"
                  path="/api/patients"
                  description="Get list of patients with optional filters"
                  params={[
                    { name: "district", type: "string", description: "Filter by district" },
                    { name: "limit", type: "number", description: "Number of results (default: 20)" }
                  ]}
                  responseExample={{
                    success: true,
                    data: [
                      {
                        id: "patient-uuid",
                        patientCode: "P2026-0042",
                        age: 5,
                        gender: "male",
                        district: "Ngami",
                        facilityName: "Ngami Health Post",
                        diagnosticCount: 2,
                        lastTestDate: "2026-08-07T10:00:00Z"
                      }
                    ],
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />

                <Endpoint
                  method="GET"
                  path="/api/patients/:id"
                  description="Get detailed patient information and test history"
                  params={[
                    { name: "id", type: "string", description: "Patient ID" }
                  ]}
                  responseExample={{
                    success: true,
                    data: {
                      id: "patient-uuid",
                      patientCode: "P2026-0042",
                      age: 5,
                      gender: "male",
                      district: "Ngami",
                      diagnostics: [
                        {
                          id: "diagnostic-uuid",
                          result: "positive",
                          testDate: "2026-08-07T10:00:00Z"
                        }
                      ]
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />

                <Endpoint
                  method="PUT"
                  path="/api/patients/:id"
                  description="Update patient information"
                  params={[
                    { name: "id", type: "string", description: "Patient ID" }
                  ]}
                  requestBody={{
                    age: 6,
                    facilityName: "Ngami District Hospital"
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      id: "patient-uuid",
                      patientCode: "P2026-0042",
                      age: 6,
                      facilityName: "Ngami District Hospital",
                      updatedAt: "2026-08-07T10:30:00Z"
                    },
                    timestamp: "2026-08-07T10:30:00Z"
                  }}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notifications">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="pr-4">
                <h2 className="text-2xl font-bold mb-4">Notifications</h2>
                <p className="text-muted-foreground mb-6">
                  Send SMS and email notifications to users and retrieve notification history.
                </p>
                
                <Endpoint
                  method="POST"
                  path="/api/notifications/send"
                  description="Send a notification (SMS or Email)"
                  requestBody={{
                    type: "sms",
                    recipient: "+26771234567",
                    message: "Malaria test result: POSITIVE. Patient P2026-0042. Please initiate treatment protocol.",
                    priority: "urgent",
                    diagnosticId: "diagnostic-uuid"
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      id: "notification-uuid",
                      type: "sms",
                      recipient: "+26771234567",
                      status: "sent",
                      sentAt: "2026-08-07T10:35:00Z"
                    },
                    timestamp: "2026-08-07T10:35:00Z"
                  }}
                />

                <Endpoint
                  method="GET"
                  path="/api/notifications/history"
                  description="Get notification history with filters"
                  params={[
                    { name: "type", type: "string", description: "Filter by type (sms/email)" },
                    { name: "status", type: "string", description: "Filter by status (sent/failed/pending)" },
                    { name: "limit", type: "number", description: "Number of results (default: 20)" }
                  ]}
                  responseExample={{
                    success: true,
                    data: [
                      {
                        id: "notification-uuid",
                        type: "sms",
                        recipient: "+26771234567",
                        message: "Malaria test result: POSITIVE...",
                        status: "sent",
                        priority: "urgent",
                        sentAt: "2026-08-07T10:35:00Z"
                      }
                    ],
                    timestamp: "2026-08-07T10:40:00Z"
                  }}
                />

                <Endpoint
                  method="PUT"
                  path="/api/notifications/:id/status"
                  description="Update notification status (for webhook callbacks)"
                  params={[
                    { name: "id", type: "string", description: "Notification ID" }
                  ]}
                  requestBody={{
                    status: "sent",
                    errorMessage: null
                  }}
                  responseExample={{
                    success: true,
                    data: {
                      id: "notification-uuid",
                      status: "sent",
                      updatedAt: "2026-08-07T10:35:00Z"
                    },
                    timestamp: "2026-08-07T10:35:00Z"
                  }}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 bg-accent/20 border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500 text-white">GET</Badge>
              <code className="text-sm font-mono">/api/health</code>
              <span className="text-sm text-muted-foreground">System health check</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500 text-white">GET</Badge>
              <code className="text-sm font-mono">/api/status</code>
              <span className="text-sm text-muted-foreground">API status and version</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
