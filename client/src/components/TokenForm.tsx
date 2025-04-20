import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

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
import { Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  botToken: z.string().min(1, { message: "Bot token is required" }),
  clientId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function TokenForm() {
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      botToken: "",
      clientId: "",
    },
  });

  const toggleTokenVisibility = () => {
    setIsTokenVisible(!isTokenVisible);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/token", {
        botToken: data.botToken,
        clientId: data.clientId || undefined
      });
      
      toast({
        title: "Credentials received!",
        description: "Redirecting to dashboard...",
        variant: "default",
      });
      
      // Store the token in sessionStorage for use in dashboard
      sessionStorage.setItem('discord_token', data.botToken);
      if (data.clientId) {
        sessionStorage.setItem('discord_client_id', data.clientId);
      }
      
      // Redirect to dashboard
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit credentials. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-secondary p-8 rounded-lg shadow-lg border border-muted"
        >
          <FormField
            control={form.control}
            name="botToken"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="text-sm font-medium">
                  Bot Token <span className="text-primary">*</span>
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={isTokenVisible ? "text" : "password"}
                      placeholder="Enter your Discord bot token"
                      className="bg-muted w-full p-3 border-muted focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={toggleTokenVisibility}
                  >
                    {isTokenVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your token will be securely processed</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem className="mb-8">
                <FormLabel className="text-sm font-medium">
                  Client ID <span className="text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Enter your Discord client ID"
                    className="bg-muted w-full p-3 border-muted focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-center">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white font-medium py-6 px-10 rounded-md transition-colors duration-200 min-w-[180px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Continue"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
