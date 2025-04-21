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

  // State for guild/server data
  const [guilds, setGuilds] = useState<any[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<string>("");
  const [guildMembers, setGuildMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
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
    if (storedClientId) {
      setClientId(storedClientId);
    }
    
    // Fetch guilds when component mounts and token is available
    fetchGuilds(storedToken);
  }, [setLocation, toast]);
  
  // Fetch guilds (Discord servers)
  const fetchGuilds = async (userToken: string) => {
    if (!userToken) return;
    
    setLoadingGuilds(true);
    try {
      const data = await apiRequest("POST", "/api/guilds", { token: userToken });
      
      if (data.success && data.guilds) {
        setGuilds(data.guilds);
        if (data.guilds.length > 0) {
          setSelectedGuild(data.guilds[0].id);
          // Load members for the first guild
          fetchGuildMembers(userToken, data.guilds[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching guilds:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Discord servers. Make sure your bot has the right permissions.",
        variant: "destructive",
      });
    } finally {
      setLoadingGuilds(false);
    }
  };
  
  // Fetch members of a guild
  const fetchGuildMembers = async (userToken: string, guildId: string) => {
    if (!userToken || !guildId) return;
    
    setLoadingMembers(true);
    try {
      const data = await apiRequest("POST", "/api/guild/members", { 
        token: userToken,
        guildId
      });
      
      if (data.success && data.members) {
        // Filter out bots
        const filteredMembers = data.members.filter((member: any) => !member.bot);
        setGuildMembers(filteredMembers);
      }
    } catch (error) {
      console.error("Error fetching guild members:", error);
      toast({
        title: "Error",
        description: "Failed to fetch guild members. Make sure your bot has the right permissions.",
        variant: "destructive",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  // Handle Direct Message submission
  const onDmSubmit = async (data: DmFormValues) => {
    if (!token) return;
    
    setIsLoadingDm(true);
    try {
      await apiRequest("POST", "/api/dm/send", {
        token,
        userId: data.userId,
        message: data.message,
      });
      
      toast({
        title: "Success",
        description: `Message sent to user ${data.userId}`,
        variant: "default",
      });
      
      // Reset form
      dmForm.reset();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please check the user ID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDm(false);
    }
  };

  // Handle guild selection change
  const handleGuildChange = (guildId: string) => {
    setSelectedGuild(guildId);
    setSelectedMembers([]);
    setSelectAll(false);
    
    if (token && guildId) {
      fetchGuildMembers(token, guildId);
    }
  };
  
  // Handle member selection
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };
  
  // Handle select all toggle
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // Select all member IDs
      setSelectedMembers(guildMembers.map(member => member.id));
    } else {
      // Deselect all
      setSelectedMembers([]);
    }
  };
  
  // Refresh guild members
  const refreshGuildMembers = () => {
    if (token && selectedGuild) {
      fetchGuildMembers(token, selectedGuild);
    }
  };

  // Handle Bulk DM submission
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
        guildId: selectAll ? selectedGuild : undefined,
        delay: messageDelay
      });
      
      toast({
        title: "Success",
        description: selectAll 
          ? "Bulk message sent to all guild members" 
          : `Bulk message sent to ${userIds.length} users`,
        variant: "default",
      });
      
      // Reset form
      bulkDmForm.reset();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send bulk messages. Please check your user selections and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBulk(false);
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("discord_token");
    sessionStorage.removeItem("discord_client_id");
    toast({
      title: "Signed Out",
      description: "Your Discord credentials have been removed.",
      variant: "default",
    });
    setLocation("/");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <GridBackground />
      
      <header className="w-full flex justify-between items-center py-4 px-6 md:px-8 z-10">
        <Link href="/" className="flex items-center">
          <div className="w-10 md:w-12">
            <Logo />
          </div>
          <span className="ml-2 font-bold text-xl">-SilentSignal</span>
        </Link>
        
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          className="text-sm"
        >
          Sign Out
        </Button>
      </header>

      <main className="container mx-auto px-4 py-8 flex-grow z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">
              Discord <span className="text-primary">Messaging Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Send Direct Messages or Bulk Messages using your Discord Bot token
            </p>
          </div>

          <div className="mb-4 p-4 bg-secondary/50 rounded-lg border border-muted-foreground/20">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-primary mr-2" />
              <p className="text-sm">
                <span className="font-medium">Connected with:</span> Discord Bot Token {token && `(${token.substring(0, 5)}...${token.substring(token.length - 5)})`}
                {clientId && ` • Client ID: ${clientId.substring(0, 5)}...`}
              </p>
            </div>
          </div>

          <Tabs defaultValue="direct-message" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="direct-message" className="flex items-center">
                <SendIcon className="mr-2 h-4 w-4" />
                Direct Message
              </TabsTrigger>
              <TabsTrigger value="bulk-message" className="flex items-center">
                <UsersIcon className="mr-2 h-4 w-4" />
                Bulk Messages
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="direct-message">
              <Card>
                <CardHeader>
                  <CardTitle>Send Direct Message</CardTitle>
                  <CardDescription>
                    Send a message to a specific Discord user using their user ID
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
                            <FormLabel>User ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Discord user ID" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter the Discord user ID (e.g. 123456789012345678)
                            </p>
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
                                placeholder="Enter your message" 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={isLoadingDm}
                      >
                        {isLoadingDm ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bulk-message">
              <Card>
                <CardHeader>
                  <CardTitle>Send Bulk Messages</CardTitle>
                  <CardDescription>
                    Send a message to multiple Discord users at once
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...bulkDmForm}>
                    <form onSubmit={bulkDmForm.handleSubmit(onBulkDmSubmit)} className="space-y-6">
                      <FormField
                        control={bulkDmForm.control}
                        name="userIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>User IDs (comma-separated)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter Discord user IDs separated by commas" 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              Example: 123456789012345678, 234567890123456789
                            </p>
                            <p className="text-xs text-primary mt-1">
                              Note: You can either enter IDs here OR select server members below
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bulkDmForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter your message" 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium flex items-center">
                            <ServerIcon className="mr-2 h-5 w-5 text-primary" />
                            Choose Server & Members
                          </h3>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={refreshGuildMembers}
                            disabled={loadingMembers}
                            className="text-xs flex items-center"
                          >
                            <RefreshCwIcon className="mr-1 h-3 w-3" />
                            Refresh
                          </Button>
                        </div>
                        
                        {guilds.length > 0 ? (
                          <div className="space-y-3">
                            <Select 
                              value={selectedGuild} 
                              onValueChange={handleGuildChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Discord Server" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Available Servers</SelectLabel>
                                  {guilds.map(guild => (
                                    <SelectItem key={guild.id} value={guild.id}>
                                      {guild.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            
                            {selectedGuild && (
                              <div className="border border-border rounded-md p-3">
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
                                    Select All Members {selectAll && "(All server members will receive the message)"}
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
                                        guildMembers
                                          .filter(member => 
                                            searchTerm === "" || 
                                            member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (member.displayName && member.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
                                          )
                                          .map(member => (
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
                                                </span>
                                              </label>
                                            </div>
                                          ))
                                      ) : (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                          No members found in this server
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
                            )}
                          </div>
                        ) : loadingGuilds ? (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            Loading available servers...
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No servers found. Make sure your bot is added to at least one server.
                          </div>
                        )}
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