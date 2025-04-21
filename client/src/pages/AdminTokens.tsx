import { useEffect, useState } from "react";
import { apiRequest } from "../lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Token {
  id: number;
  botToken: string;
  clientId: string | null;
  timestamp: string;
}

export default function AdminTokens() {
  const { toast } = useToast();
  
  const { data: tokens, isLoading } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tokens', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch tokens');
      return response.json();
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Token copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Token Admin Panel</h1>
      
      {isLoading ? (
        <div className="flex justify-center">
          <p>Loading tokens...</p>
        </div>
      ) : !tokens?.length ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No tokens found in the database.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {tokens.map((token: Token) => (
            <Card key={token.id}>
              <CardHeader>
                <CardTitle>Token #{token.id}</CardTitle>
                <CardDescription>Submitted on {formatDate(token.timestamp)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Bot Token:</h4>
                    <div className="flex items-center">
                      <code className="bg-muted p-2 rounded flex-1 overflow-x-auto">
                        {token.botToken}
                      </code>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2" 
                        onClick={() => copyToClipboard(token.botToken)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  {token.clientId && (
                    <div>
                      <h4 className="font-medium mb-1">Client ID:</h4>
                      <div className="flex items-center">
                        <code className="bg-muted p-2 rounded flex-1">
                          {token.clientId}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-2" 
                          onClick={() => copyToClipboard(token.clientId!)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => copyToClipboard(token.botToken)}>
                  Copy Token
                </Button>
                <div className="text-sm text-muted-foreground">
                  ID: {token.id}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}