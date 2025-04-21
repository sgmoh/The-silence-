import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Link } from "wouter";
import Logo from "@/components/Logo";
import GridBackground from "@/components/GridBackground";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, SendIcon, UsersIcon, ServerIcon, RefreshCwIcon, CheckIcon } from "lucide-react";

// Single DM form schema
const dmFormSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  message: z.string().min(1, { message: "Message content is required" }),
});

// Bulk DM form schema
const bulkDmFormSchema = z.object({
  userIds: z.string().optional(),
  message: z.string().min(1, { message: "Message content is required" }),
});

type DmFormValues = z.infer<typeof dmFormSchema>;
type BulkDmFormValues = z.infer<typeof bulkDmFormSchema>;

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoadingDm, setIsLoadingDm] = useState(false);
  const [isLoadingBulk, setIsLoadingBulk] = useState(false);

  // State for member data
  const [guildMembers, setGuildMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageDelay, setMessageDelay] = useState(0);

  // Set up forms
  const dmForm = useForm<DmFormValues>({
    resolver: zodResolver(dmFormSchema),
    defaultValues: {
      userId: "",
      message: "",
    },
  });

  const bulkDmForm = useForm<BulkDmFormValues>({
    resolver: zodResolver(bulkDmFormSchema),
    defaultValues: {
      userIds: "",
      message: "",
    },
  });

  // Check if token exists in session storage
  useEffect(() => {
    const storedToken = sessionStorage.getItem("discord_token");
    const storedClientId = sessionStorage.getItem("discord_client_id");
    
    if (!storedToken) {
      // Redirect to home if no token
      toast({
        title: "Authentication Required",
        description: "Please enter your Discord credentials first.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
    
    setToken(storedToken);
    setClientId(storedClientId);
    
    // Load members when token is available
    fetchGuildMembers(storedToken);
  }, [toast, setLocation]);
  
  // Function to fetch guild members
  const fetchGuildMembers = async (token: string) => {
    if (!token) return;
    
    setLoadingMembers(true);
    try {
      const response = await apiRequest("POST", "/api/guild/members", { token });
      if (response.success && response.members) {
        setGuildMembers(response.members);
      } else {
        throw new Error(response.error || "Failed to fetch members");
      }
    } catch (error: any) {
      console.error("Error fetching members:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch guild members",
        variant: "destructive",
      });
    } finally {
      setLoadingMembers(false);
    }
  };
  
  // Handle selection of members
  const toggleMemberSelection = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    } else {
      setSelectedMembers(prev => [...prev, memberId]);
    }
  };
  
  // Handle select all checkbox
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (!checked) {
      // If unchecking, clear selected members
      setSelectedMembers([]);
    }
  };
  
  // Single DM form submit handler
  const onDmSubmit = async (data: DmFormValues) => {
    if (!token) return;
    
    setIsLoadingDm(true);
    try {
      await apiRequest("POST", "/api/dm/single", {
        token,
        userId: data.userId,
        message: data.message,
      });
      
      toast({
        title: "Success",
        description: "Direct message sent successfully",
        variant: "default",
      });
      
      // Reset form
      dmForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send direct message",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDm(false);
    }
  };
  
  // Bulk DM form submit handler
  const onBulkDmSubmit = async (data: BulkDmFormValues) => {
    if (!token) return;
    
    setIsLoadingBulk(true);
    try {
      // Get user IDs either from the textarea or selected members
      let userIds: string[] = [];
      
      if (data.userIds && data.userIds.trim()) {
        // Parse from comma-separated list if provided
        userIds = data.userIds
          .split(',')
          .map(id => id.trim())
          .filter(id => id.length > 0);
      } else if (selectedMembers.length > 0) {
        // Use selected members if textarea is empty
        userIds = selectedMembers;
      }
      
      if (userIds.length === 0 && !selectAll) {
        throw new Error("No users selected for the message");
      }
      
      await apiRequest("POST", "/api/dm/bulk", {
        token,
        userIds,
        message: data.message,
        selectAll,
        delay: messageDelay
      });
      
      toast({
        title: "Success",
        description: selectAll 
          ? "Bulk message sent to all members" 
          : `Bulk message sent to ${userIds.length} users`,
        variant: "default",
      });
      
      // Reset form
      bulkDmForm.reset();
      setSelectedMembers([]);
      setSelectAll(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send bulk messages",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBulk(false);
    }
  };
  
  // Function to handle logout
  const handleLogout = () => {
    sessionStorage.removeItem("discord_token");
    sessionStorage.removeItem("discord_client_id");
    setLocation("/");
  };
  
  // Get filtered members for display and count
  const getFilteredMembers = () => {
    return guildMembers.filter(member => 
      searchTerm === "" || 
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.displayName && member.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };
  
  // Count of filtered members when searching
  const filteredMemberCount = searchTerm ? getFilteredMembers().length : guildMembers.length;
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <GridBackground />
      
      <header className="w-full px-4 z-10 bg-background/80 backdrop-blur-sm" style={{ 
        paddingTop: '0.05cm', 
        paddingBottom: '0.05cm', 
        height: '0.5cm', 
        borderBottom: '0.03cm solid var(--border)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1" style={{ maxWidth: '2cm' }}>
            <div className="transform origin-left" style={{ transform: 'scale(0.65)' }}>
              <Logo />
            </div>
            <span className="font-bold" style={{ fontSize: '12px', height: '0.3cm' }}>SilentSignal</span>
          </div>
          
          <nav className="flex items-center gap-2">
            <Link href="/replies">
              <Button variant="ghost" size="sm" className="h-5 text-xs px-2 py-0">
                Message Replies
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-5 text-xs px-2 py-0">
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-8 px-4 z-10 relative">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="single-dm" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="single-dm" className="text-center py-3">
                <div className="flex items-center gap-2">
                  <SendIcon size={16} />
                  <span>Single DM</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="bulk-dm" className="text-center py-3">
                <div className="flex items-center gap-2">
                  <UsersIcon size={16} />
                  <span>Bulk DM</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="single-dm">
              <Card>
                <CardHeader>
                  <CardTitle>Send Direct Message</CardTitle>
                  <CardDescription>
                    Send a direct message to a specific Discord user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...dmForm}>
                    <form onSubmit={dmForm.handleSubmit(onDmSubmit)} className="space-y-6">
                      <FormField
                        control={dmForm.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discord User ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter user ID" {...field} />
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1">
                              The ID of the Discord user you want to message
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={dmForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter your message here..." 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1">
                              The content of the message to send
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={isLoadingDm}
                      >
                        {isLoadingDm ? "Sending..." : "Send Direct Message"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bulk-dm">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Message</CardTitle>
                  <CardDescription>
                    Send messages to multiple Discord users at once
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...bulkDmForm}>
                    <form onSubmit={bulkDmForm.handleSubmit(onBulkDmSubmit)} className="space-y-6">
                      <FormField
                        control={bulkDmForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter your message here..." 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1">
                              The content of the message to send to all selected users
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <FormField
                          control={bulkDmForm.control}
                          name="userIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>User IDs (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter comma-separated user IDs or select members below" 
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <div className="text-xs text-muted-foreground mt-1">
                                Enter comma-separated user IDs or select members below
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="pt-4 border-t border-border">
                        <div className="mb-4">
                          <h3 className="text-sm font-medium mb-2">Select Members</h3>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id="select-all"
                              checked={selectAll}
                              onCheckedChange={handleSelectAllChange}
                            />
                            <label
                              htmlFor="select-all"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Select All Members <span className="text-primary font-medium">({guildMembers.length})</span> {selectAll && "(All members will receive the message)"}
                            </label>
                          </div>
                          
                          {!selectAll && (
                            <>
                              <div className="mb-3">
                                <Input
                                  placeholder="Search members..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="w-full"
                                />
                              </div>
                              <div className="max-h-[200px] overflow-y-auto space-y-2 mt-3">
                                {loadingMembers ? (
                                  <div className="text-center py-4 text-muted-foreground text-sm">
                                    Loading members...
                                  </div>
                                ) : guildMembers.length > 0 ? (
                                  <div>
                                    {searchTerm && (
                                      <div className="text-xs text-muted-foreground mb-2">
                                        Found <span className="font-medium text-primary">
                                          {filteredMemberCount}
                                        </span> matching members
                                      </div>
                                    )}
                                    
                                    {getFilteredMembers().map(member => (
                                      <div key={member.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`member-${member.id}`}
                                          checked={selectedMembers.includes(member.id)}
                                          onCheckedChange={() => toggleMemberSelection(member.id)}
                                        />
                                        <label
                                          htmlFor={`member-${member.id}`}
                                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                                        >
                                          {member.displayName} 
                                          <span className="text-muted-foreground ml-1 text-xs">
                                            ({member.username})
                                            {member.guildName && <span className="ml-1">• {member.guildName}</span>}
                                          </span>
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-muted-foreground text-sm">
                                    No members found. Make sure your bot is added to at least one server.
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                          
                          <div className="mt-3 text-xs text-muted-foreground">
                            {selectedMembers.length > 0 && !selectAll && (
                              <p>{selectedMembers.length} members selected</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-border space-y-4">
                        <div>
                          <label htmlFor="message-delay" className="text-sm font-medium block mb-2">
                            Message Delay (milliseconds)
                          </label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="message-delay"
                              type="number"
                              min="0"
                              max="10000"
                              value={messageDelay}
                              onChange={(e) => setMessageDelay(parseInt(e.target.value) || 0)}
                              placeholder="Delay between messages (0-10000ms)"
                              className="w-full"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add a delay between 0-10000ms to avoid rate limiting
                          </p>
                        </div>
                      
                        <Button 
                          type="submit" 
                          className="w-full bg-primary hover:bg-primary/90"
                          disabled={isLoadingBulk}
                        >
                          {isLoadingBulk ? "Sending..." : "Send Bulk Messages"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-muted-foreground text-sm z-10">
        <p>&copy; {new Date().getFullYear()} -SilentSignal. All rights reserved.</p>
      </footer>
    </div>
  );
}