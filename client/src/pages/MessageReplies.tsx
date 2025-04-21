import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface MessageReply {
  id: number;
  userId: string;
  username: string;
  content: string;
  messageId: string;
  timestamp: string;
  avatarUrl?: string;
  guildId?: string;
  guildName?: string;
}

export default function MessageReplies() {
  // State for storing replies from WebSocket
  const [liveReplies, setLiveReplies] = useState<MessageReply[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  // Fetch initial replies from API
  const { data: initialReplies, isLoading } = useQuery<{ success: boolean, replies: MessageReply[] }>({
    queryKey: ['/api/replies'],
    retry: false
  });

  // Function to get WebSocket URL
  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  };

  // Setup WebSocket connection
  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'initialReplies') {
          // Initial data
          setLiveReplies(data.data);
        } else if (data.type === 'newReply') {
          // New reply received
          setLiveReplies(prev => [data.data, ...prev]);
          // Also invalidate the query to keep the data fresh
          queryClient.invalidateQueries({ queryKey: ['/api/replies'] });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      // Try to reconnect after a delay
      setTimeout(() => {
        setSocket(null);
      }, 5000);
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(newSocket);

    // Cleanup on component unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  // All replies (combine initial API data with live updates)
  const allReplies = liveReplies.length > 0 ? liveReplies : (initialReplies?.replies || []);

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  // Format date/time
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Message Replies</h1>
        <Badge variant={connected ? "success" : "destructive"}>
          {connected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Replies</TabsTrigger>
          <TabsTrigger value="recent">Recent Replies</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-pulse">Loading replies...</div>
            </div>
          ) : allReplies.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No message replies yet</p>
                <p className="text-sm mt-2">When users reply to your bot's messages, they will appear here</p>
              </CardContent>
            </Card>
          ) : (
            allReplies.map((reply: MessageReply) => (
              <Card key={reply.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={reply.avatarUrl} alt={reply.username} />
                        <AvatarFallback>{getInitials(reply.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{reply.username}</CardTitle>
                        <CardDescription className="text-xs">
                          User ID: {reply.userId}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(reply.timestamp)}
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="whitespace-pre-wrap">{reply.content}</div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-pulse">Loading replies...</div>
            </div>
          ) : allReplies.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No message replies yet</p>
                <p className="text-sm mt-2">When users reply to your bot's messages, they will appear here</p>
              </CardContent>
            </Card>
          ) : (
            allReplies.slice(0, 5).map((reply: MessageReply) => (
              <Card key={reply.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={reply.avatarUrl} alt={reply.username} />
                        <AvatarFallback>{getInitials(reply.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{reply.username}</CardTitle>
                        <CardDescription className="text-xs">
                          User ID: {reply.userId}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(reply.timestamp)}
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="whitespace-pre-wrap">{reply.content}</div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}