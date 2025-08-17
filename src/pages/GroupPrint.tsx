import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Upload, 
  Copy, 
  Share, 
  UserPlus,
  FileText,
  DollarSign,
  Clock,
  Send
} from "lucide-react";

interface GroupMember {
  id: string;
  name: string;
  email: string;
  copies: number;
  status: 'pending' | 'joined' | 'confirmed';
}

export default function GroupPrint() {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("create");
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [memberCopies, setMemberCopies] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Mock group members data
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    {
      id: "1",
      name: user?.firstName + " " + user?.lastName || "You",
      email: user?.primaryEmailAddress?.emailAddress || "you@example.com",
      copies: 2,
      status: 'confirmed'
    },
    {
      id: "2", 
      name: "Sarah Johnson",
      email: "sarah.j@university.edu",
      copies: 1,
      status: 'joined'
    },
    {
      id: "3",
      name: "Mike Chen", 
      email: "mike.chen@university.edu",
      copies: 3,
      status: 'pending'
    }
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  const handleCreateGroup = () => {
    if (!groupName || !uploadedFile) {
      toast({
        title: "Missing information",
        description: "Please provide a group name and upload a document.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Group created!",
      description: `Group "${groupName}" has been created with code: GRP123456`,
    });
  };

  const handleJoinGroup = () => {
    if (!groupCode) {
      toast({
        title: "Missing group code",
        description: "Please enter a valid group code to join.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Joined group!",
      description: `Successfully joined group: ${groupCode}`,
    });
  };

  const handleInviteMembers = () => {
    if (!inviteEmails) {
      toast({
        title: "No emails provided",
        description: "Please enter email addresses to invite.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Invitations sent!",
      description: "Group invitations have been sent to the provided emails.",
    });
    setInviteEmails("");
  };

  const totalCopies = groupMembers.reduce((sum, member) => sum + member.copies, 0);
  const costPerCopy = 0.10; // $0.10 per copy
  const totalCost = totalCopies * costPerCopy;

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Group Print</h1>
              <p className="text-muted-foreground">
                Create or join a group to share printing costs
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Group</TabsTrigger>
              <TabsTrigger value="join">Join Group</TabsTrigger>
            </TabsList>

            {/* Create Group Tab */}
            <TabsContent value="create" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Group Setup */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create New Group
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        placeholder="e.g., CS101 Study Group"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="groupDescription">Description (Optional)</Label>
                      <Textarea
                        id="groupDescription"
                        placeholder="Brief description of what you're printing..."
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label>Shared Document</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {uploadedFile ? uploadedFile.name : "Upload document to share with group"}
                          </p>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            {uploadedFile ? "Change File" : "Choose File"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleCreateGroup} 
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  </CardContent>
                </Card>

                {/* Invite Members */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Invite Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteEmails">Email Addresses</Label>
                      <Textarea
                        id="inviteEmails"
                        placeholder="Enter email addresses separated by commas or new lines..."
                        value={inviteEmails}
                        onChange={(e) => setInviteEmails(e.target.value)}
                        rows={4}
                      />
                      <p className="text-sm text-gray-500">
                        Separate multiple emails with commas or line breaks
                      </p>
                    </div>

                    <Button 
                      onClick={handleInviteMembers}
                      variant="outline" 
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitations
                    </Button>

                    {/* Share Code */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Share className="h-4 w-4" />
                        Share Group Code
                      </h4>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-3 py-2 rounded border flex-1 text-center font-mono">
                          GRP123456
                        </code>
                        <Button size="sm" variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Share this code for others to join your group
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Join Group Tab */}
            <TabsContent value="join" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Join Existing Group
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupCode">Group Code</Label>
                      <Input
                        id="groupCode"
                        placeholder="Enter group code (e.g., GRP123456)"
                        value={groupCode}
                        onChange={(e) => setGroupCode(e.target.value)}
                        className="text-center font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="memberCopies">Number of Copies</Label>
                      <Input
                        id="memberCopies"
                        type="number"
                        min="1"
                        max="10"
                        value={memberCopies}
                        onChange={(e) => setMemberCopies(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <Button 
                      onClick={handleJoinGroup}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Group
                    </Button>
                  </CardContent>
                </Card>

                {/* Preview Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Group Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Enter a group code to see group details</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Group Summary (when group exists) */}
          {groupMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Group Print Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-1">Document</h4>
                  <p className="text-blue-700">CS101_Final_Study_Guide.pdf</p>
                  <p className="text-sm text-blue-600">15 pages • Uploaded by {user?.firstName || "You"}</p>
                </div>

                {/* Members List */}
                <div>
                  <h4 className="font-medium mb-3">Group Members ({groupMembers.length})</h4>
                  <div className="space-y-2">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">
                            {member.copies} {member.copies === 1 ? 'copy' : 'copies'}
                          </span>
                          <Badge 
                            variant={
                              member.status === 'confirmed' ? 'default' : 
                              member.status === 'joined' ? 'secondary' : 'outline'
                            }
                          >
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Cost Summary */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{totalCopies}</div>
                    <div className="text-sm text-gray-600">Total Copies</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">${costPerCopy}</div>
                    <div className="text-sm text-gray-600">Per Copy</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">${totalCost.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-gradient-hero">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
